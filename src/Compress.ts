import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

import {
  createFolders,
  readableHrtime,
  getCPUs,
  chunkArray,
  filterObject,
} from './helpers.js';
import { Logger } from './logger/Logger.js';
import {
  NO_FILES_MESSAGE,
  NO_PATH_MESSAGE,
  DEFAULT_OUTPUT_FORMAT_MESSAGE,
  INCREMENTAL_ENABLE_MESSAGE,
  WORKER_STARTED,
} from './constants.js';
import {
  CompressionType,
  CompressOptions,
  WorkerMessage,
} from './interfaces.js';
import { Incremental } from './Incremental.js';
import { Config } from './Config.js';
import { LogLevel } from './logger/LogLevel.enum.js';
import { CompressService } from './Compress.service.js';
import { CompressionExtensions } from './enums.js';

/**
 * Compressing files.
 */
export class Compress {
  private readonly incremental!: Incremental;
  private readonly config: Config;
  private readonly outputPath: string | undefined;
  private readonly target: string;
  private readonly service: CompressService;
  readonly logger: Logger;
  readonly options: CompressOptions;
  readonly compressionInstances: CompressionType[];

  /**
   * Creates an instance of Compress.
   */
  constructor(
    target: string,
    outputPath?: string | null,
    options: CompressOptions = {},
  ) {
    this.logger = new Logger();
    this.logger.initialize({
      verbose: options.verbose,
      color: options.color,
    });
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
        await createFolders(this.outputPath);
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
      hrtime = process.hrtime(hrtimeStart);
      if (this.options.incremental) {
        this.incremental.filePaths = workersResponse.filePaths;
        await this.incremental.updateConfig();
        await this.config.writeConfig();
      }
    } catch (error) {
      this.logger.log(error as Error, LogLevel.ERROR);
      throw new Error((error as Error).message);
    }

    const filesCount = files.length;
    if (filesCount) {
      this.logger.log(
        `${filesCount} ${
          filesCount > 1 ? 'files have' : 'file has'
        } been compressed. (${readableHrtime(hrtime)})`,
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
    const isFileTarget = (await lstat(target)).isFile();
    let filesList: string[];

    if (isFileTarget) {
      const targetParsed = path.parse(target);
      target = targetParsed.dir;
      filesList = [targetParsed.base];
    } else {
      filesList = await readdir(target);
    }

    for (const file of filesList) {
      const filePath = path.resolve(target, file);
      const fileStat = await lstat(filePath);

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
        ? this.options.workers || getCPUs() - 1
        : 1;
    const size = Math.ceil(files.length / cpus);
    const chunks = chunkArray(files, size);
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
          import.meta.dirname,
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
              filterObject(this.incremental.filePaths, (key) =>
                chunk.includes(key),
              ),
          },
          execArgv: [...process.execArgv, '--unhandled-rejections=strict'],
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
    for (const instance of this.compressionInstances) {
      this.logger.log(
        `Compression ${instance.readableOptions()}`,
        LogLevel.INFO,
      );
    }

    if (!this.options.outputFileFormat) {
      this.logger.log(DEFAULT_OUTPUT_FORMAT_MESSAGE, LogLevel.INFO);
    }
  }
}
