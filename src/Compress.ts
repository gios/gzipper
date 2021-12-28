import fs from 'fs';
import path from 'path';
import util from 'util';
import { Worker } from 'worker_threads';

import { Helpers } from './helpers';
import { Logger } from './logger/Logger';
import {
  NO_FILES_MESSAGE,
  NO_PATH_MESSAGE,
  DEFAULT_OUTPUT_FORMAT_MESSAGE,
  INCREMENTAL_ENABLE_MESSAGE,
  WORKER_STARTED,
} from './constants';
import { CompressionType, CompressOptions, WorkerMessage } from './interfaces';
import { Incremental } from './Incremental';
import { Config } from './Config';
import { LogLevel } from './logger/LogLevel.enum';
import { CompressService } from './Compress.service';
import { CompressionExtensions } from './enums';

/**
 * Compressing files.
 */
export class Compress {
  private readonly nativeFs = {
    lstat: util.promisify(fs.lstat),
    readdir: util.promisify(fs.readdir),
  };
  private readonly incremental!: Incremental;
  private readonly config: Config;
  private readonly options: CompressOptions;
  private readonly outputPath: string | undefined;
  private readonly compressionInstances: CompressionType[];
  private readonly target: string;
  private readonly service: CompressService;

  /**
   * Creates an instance of Compress.
   */
  constructor(
    target: string,
    outputPath?: string | null,
    options: CompressOptions = {},
  ) {
    Logger.setVerboseMode(options.verbose as boolean);
    this.config = new Config();
    if (!target) {
      const message = NO_PATH_MESSAGE;
      Logger.log(message, LogLevel.ERROR);
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
    this.compressionInstances = this.service.getCompressionInstances();
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
        Logger.log(INCREMENTAL_ENABLE_MESSAGE, LogLevel.INFO);
        await this.incremental.initCacheFolder();
        await this.incremental.readConfig();
      }
      this.compressionLog();
      const hrtimeStart = process.hrtime();
      const workersResponse = await this.createWorkers();
      files = workersResponse.files;
      hrtime = process.hrtime(hrtimeStart);
      if (this.options.incremental) {
        this.incremental.filePaths = workersResponse.filePaths;
        await this.incremental.updateConfig();
        await this.config.writeConfig();
      }
    } catch (error) {
      Logger.log(error as Error, LogLevel.ERROR);
      throw new Error((error as Error).message);
    }

    const filesCount = files.length;
    if (filesCount) {
      Logger.log(
        `${filesCount} ${
          filesCount > 1 ? 'files have' : 'file has'
        } been compressed. (${Helpers.readableHrtime(hrtime)})`,
        LogLevel.SUCCESS,
      );
    } else {
      Logger.log(NO_FILES_MESSAGE, LogLevel.WARNING);
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
        this.service.isValidFileExtensions(
          path.extname(filePath).slice(1) as CompressionExtensions,
        )
      ) {
        if (fileStat.size < (this.options.threshold ?? 0)) {
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
    const cpus =
      process.env.NODE_ENV !== 'test'
        ? this.options.workers || Helpers.getCPUs()
        : 1;
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
        path.resolve(
          __dirname,
          process.env.NODE_ENV !== 'test'
            ? './Compress.worker.js'
            : '../test/__mocks__/Compress.worker.import.js',
        ),
        {
          workerData: {
            cwd: process.cwd(),
            chunk,
            target: this.target,
            outputPath: this.outputPath,
            options: this.options,
            incrementalFilePaths:
              this.options.incremental &&
              Helpers.filterObject(this.incremental.filePaths, (key) =>
                chunk.includes(key),
              ),
          },
          execArgv: [...process.execArgv, '--unhandled-rejections=strict'],
        },
      );

      worker.on('online', () => {
        Logger.log(`[${worker.threadId}] ${WORKER_STARTED}`, LogLevel.INFO);
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
    for (const instance of this.compressionInstances) {
      Logger.log(`Compression ${instance.readableOptions()}`, LogLevel.INFO);
    }

    if (!this.options.outputFileFormat) {
      Logger.log(DEFAULT_OUTPUT_FORMAT_MESSAGE, LogLevel.INFO);
    }
  }
}
