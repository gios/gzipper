import fs from 'fs';
import path from 'path';
import util from 'util';
import { Worker } from 'worker_threads';

import { Helpers } from './helpers';
import { Logger } from './logger/Logger';
import { BrotliCompression } from './compressions/Brotli';
import { GzipCompression } from './compressions/Gzip';
import {
  NO_FILES_MESSAGE,
  NO_PATH_MESSAGE,
  DEFAULT_OUTPUT_FORMAT_MESSAGE,
  INCREMENTAL_ENABLE_MESSAGE,
  WORKER_STARTED,
} from './constants';
import { CompressOptions, WorkerMessage } from './interfaces';
import { DeflateCompression } from './compressions/Deflate';
import { Incremental } from './Incremental';
import { Config } from './Config';
import { LogLevel } from './logger/LogLevel.enum';
import { CompressService } from './Compress.service';

/**
 * Compressing files.
 */
export class Compress {
  private readonly nativeFs = {
    lstat: util.promisify(fs.lstat),
    readdir: util.promisify(fs.readdir),
  };
  private readonly logger: Logger;
  private readonly incremental!: Incremental;
  private readonly config: Config;
  private readonly options: CompressOptions;
  private readonly outputPath: string | undefined;
  private readonly compressionInstance:
    | BrotliCompression
    | GzipCompression
    | DeflateCompression;
  private readonly target: string;
  private readonly service: CompressService;

  /**
   * Creates an instance of Compress.
   */
  constructor(
    target: string,
    outputPath?: string | null,
    options: CompressOptions = {} as never,
  ) {
    this.logger = new Logger(options.verbose as boolean);
    this.config = new Config();
    if (!target) {
      const message = NO_PATH_MESSAGE;
      this.logger.log(message, LogLevel.ERROR);
      throw new Error(message);
    }
    if (outputPath) {
      this.outputPath = path.resolve(process.cwd(), outputPath);
    }
    if (options.incremental) {
      this.incremental = new Incremental(this.config);
    }
    this.target = path.resolve(process.cwd(), target);
    this.options = options;
    this.service = new CompressService(this.options);
    this.compressionInstance = this.service.getCompressionInstance();
  }

  /**
   * Start compressing files.
   */
  async run(): Promise<string[]> {
    let files: string[];
    let hrtime: [number, number];
    try {
      if (this.outputPath) {
        await Helpers.createFolders(this.outputPath);
      }
      if (this.options.incremental) {
        await this.config.readConfig();
        this.logger.log(INCREMENTAL_ENABLE_MESSAGE, LogLevel.INFO);
        await this.incremental.initCacheFolder();
        await this.incremental.readConfig();
      }
      this.compressionLog();
      const hrtimeStart = process.hrtime();
      const workersResponse = await this.createWorkers();
      files = workersResponse.files;
      this.incremental.filePaths = workersResponse.filePaths;
      hrtime = process.hrtime(hrtimeStart);
      if (this.options.incremental) {
        await this.incremental.updateConfig();
        await this.config.writeConfig();
      }
    } catch (error) {
      this.logger.log(error, LogLevel.ERROR);
      throw new Error(error.message);
    }

    const filesCount = files.length;
    if (filesCount) {
      this.logger.log(
        `${filesCount} ${
          filesCount > 1 ? 'files have' : 'file has'
        } been compressed. (${Helpers.readableHrtime(hrtime)})`,
        LogLevel.SUCCESS,
      );
    } else {
      this.logger.log(NO_FILES_MESSAGE, LogLevel.WARNING);
    }

    return files;
  }

  /**
   * Returns available files to compress.
   */
  private async getFilesToCompress(target = this.target): Promise<string[]> {
    const compressedFiles: string[] = [];
    const isFileTarget = (await this.nativeFs.lstat(target)).isFile();
    let filesList: string[];

    if (isFileTarget) {
      const targetParsed = path.parse(target);
      target = targetParsed.dir;
      filesList = [targetParsed.base];
    } else {
      filesList = await this.nativeFs.readdir(target);
    }

    for (const file of filesList) {
      const filePath = path.resolve(target, file);
      const fileStat = await this.nativeFs.lstat(filePath);

      if (fileStat.isDirectory()) {
        compressedFiles.push(...(await this.getFilesToCompress(filePath)));
      } else if (
        fileStat.isFile() &&
        this.service.isValidFileExtensions(path.extname(filePath).slice(1))
      ) {
        if (fileStat.size < this.options.threshold) {
          continue;
        }
        compressedFiles.push(filePath);
      }
    }
    return compressedFiles;
  }

  /**
   * Create workers for parallel compression.
   */
  private async createWorkers(): Promise<WorkerMessage> {
    const files = await this.getFilesToCompress();
    const cpus = Helpers.getCPUs();
    const size = Math.ceil(files.length / cpus);
    const chunks = Helpers.chunkArray(files, size);
    const workers = chunks.map((chunk) => this.runCompressWorker(chunk));
    const results = await Promise.all(workers);
    return results.reduce(
      (accumulator, value) => {
        return {
          files: [...accumulator.files, ...value.files],
          filePaths: { ...accumulator.filePaths, ...value.filePaths },
        };
      },
      {
        files: [],
        filePaths: {},
      } as WorkerMessage,
    );
  }

  /**
   * Run compress worker
   */
  private async runCompressWorker(chunk: string[]): Promise<WorkerMessage> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        path.resolve(__dirname, './Compress.worker.js'),
        {
          workerData: {
            chunk,
            target: this.target,
            outputPath: this.outputPath,
            options: this.options,
            incrementalFilePaths:
              this.options.incremental && this.incremental.filePaths,
          },
        },
      );

      worker.on('online', () => {
        this.logger.log(
          `[${worker.threadId}] ${WORKER_STARTED}`,
          LogLevel.INFO,
        );
      });

      worker.once('message', (result) => {
        worker.terminate();
        resolve(result);
      });

      worker.on('error', (error) => {
        worker.terminate();
        reject(error);
      });
    });
  }

  /**
   * Show message with compression params.
   */
  private compressionLog(): void {
    const options = this.compressionInstance.readableOptions();
    this.logger.log(`Compression ${options}`, LogLevel.INFO);

    if (!this.options.outputFileFormat) {
      this.logger.log(DEFAULT_OUTPUT_FORMAT_MESSAGE, LogLevel.INFO);
    }
  }
}
