import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import { v4 } from 'uuid';
import util from 'util';
import stream from 'stream';
import path from 'path';

import {
  CompressedFile,
  CompressOptions,
  IncrementalValueOf,
} from './interfaces';
import { OUTPUT_FILE_FORMAT_REGEXP } from './constants';
import { Helpers } from './helpers';
import { Logger } from './logger/Logger';
import { BrotliCompression } from './compressions/Brotli';
import { GzipCompression } from './compressions/Gzip';
import { DeflateCompression } from './compressions/Deflate';
import { CompressService } from './Compress.service';
import { Incremental } from './Incremental';
import { Config } from './Config';

class CompressWorker {
  private readonly nativeFs = {
    lstat: util.promisify(fs.lstat),
    exists: util.promisify(fs.exists),
    unlink: util.promisify(fs.unlink),
  };
  private readonly nativeStream = {
    pipeline: util.promisify(stream.pipeline),
  };
  private readonly options: CompressOptions = workerData.options;
  private readonly chunk: string[] = workerData.chunk;
  private readonly target: string = workerData.target;
  private readonly outputPath: string = workerData.outputPath;
  private readonly incrementalValueOf: IncrementalValueOf =
    workerData.incremental;
  private readonly logger: Logger;
  private readonly incremental!: Incremental;
  private readonly service: CompressService;
  private readonly compressionInstance:
    | BrotliCompression
    | DeflateCompression
    | GzipCompression;

  constructor() {
    if (this.options.incremental) {
      const config = new Config();
      config.writableContent = this.incrementalValueOf.config.writableContent;
      this.incrementalValueOf.config.writableContent;
      this.incremental = new Incremental(config);
      this.incremental.filePaths = this.incrementalValueOf.filePaths;
    }
    this.logger = new Logger(this.options.verbose as boolean);
    this.service = new CompressService(this.options);
    this.compressionInstance = this.service.getCompressionInstance();
  }

  /**
   * Compress files list and returns files and incremental data.
   */
  async compressFiles(): Promise<[string[], IncrementalValueOf]> {
    const createCompression = this.compressionInstance.getCompression();
    const filesList: string[] = [];

    for (const filePath of this.chunk) {
      const hrtimeStart = process.hrtime();
      const fileInfo = await this.compressFile(
        path.basename(filePath),
        path.dirname(filePath),
        createCompression,
      );

      if (!fileInfo.removeCompressed && !fileInfo.isSkipped) {
        filesList.push(filePath);
      }

      if (this.options.verbose) {
        const hrTimeEnd = process.hrtime(hrtimeStart);
        this.logger.log(
          this.getCompressedFileMsg(
            filePath,
            fileInfo as CompressedFile,
            hrTimeEnd,
          ),
        );
      }
    }

    return [filesList, this.incremental.valueOf()];
  }

  /**
   * File compression.
   */
  private async compressFile(
    filename: string,
    target: string,
    createCompression:
      | ReturnType<BrotliCompression['getCompression']>
      | ReturnType<GzipCompression['getCompression']>
      | ReturnType<DeflateCompression['getCompression']>,
  ): Promise<Partial<CompressedFile>> {
    let isCached = false;
    let isSkipped = false;
    const inputPath = path.join(target, filename);
    if (this.outputPath) {
      const isFileTarget = (await this.nativeFs.lstat(this.target)).isFile();
      target = isFileTarget
        ? this.outputPath
        : path.join(this.outputPath, path.relative(this.target, target));
      await Helpers.createFolders(target);
    }
    const outputPath = this.getOutputPath(target, filename);

    if (this.options.skipCompressed) {
      if (await this.nativeFs.exists(outputPath)) {
        isSkipped = true;
        return { isCached, isSkipped };
      }
    }

    if (this.options.incremental) {
      const checksum = await this.incremental.getFileChecksum(inputPath);
      const { isChanged, fileId } = await this.incremental.setFile(
        inputPath,
        checksum,
        this.compressionInstance.compressionOptions,
      );

      const cachedFile = path.resolve(
        this.incremental.cacheFolder,
        fileId as string,
      );

      if (isChanged) {
        await this.nativeStream.pipeline(
          fs.createReadStream(inputPath),
          createCompression(),
          fs.createWriteStream(outputPath),
        );

        await this.nativeStream.pipeline(
          fs.createReadStream(outputPath),
          fs.createWriteStream(cachedFile),
        );
      } else {
        await this.nativeStream.pipeline(
          fs.createReadStream(cachedFile),
          fs.createWriteStream(outputPath),
        );
        isCached = true;
      }
    } else {
      await this.nativeStream.pipeline(
        fs.createReadStream(inputPath),
        createCompression(),
        fs.createWriteStream(outputPath),
      );
    }

    if (this.options.verbose || this.options.removeLarger) {
      const beforeSize = (await this.nativeFs.lstat(inputPath)).size;
      const afterSize = (await this.nativeFs.lstat(outputPath)).size;

      const removeCompressed =
        this.options.removeLarger && beforeSize < afterSize;
      if (removeCompressed) {
        await this.nativeFs.unlink(outputPath);
      }
      return {
        beforeSize,
        afterSize,
        isCached,
        isSkipped,
        removeCompressed,
      };
    }

    return { isCached, isSkipped };
  }

  /**
   * Get output path which is based on [outputFileFormat].
   */
  private getOutputPath(target: string, file: string): string {
    const artifactsMap = new Map<string, string | null>([
      ['[filename]', path.parse(file).name],
      ['[ext]', path.extname(file).slice(1)],
      ['[compressExt]', this.compressionInstance.ext],
    ]);
    let filename = `${artifactsMap.get('[filename]')}.${artifactsMap.get(
      '[ext]',
    )}.${artifactsMap.get('[compressExt]')}`;

    if (this.options.outputFileFormat) {
      artifactsMap.set('[hash]', null);

      filename = this.options.outputFileFormat.replace(
        OUTPUT_FILE_FORMAT_REGEXP,
        (artifact) => {
          if (artifactsMap.has(artifact)) {
            // Need to generate hash only if we have appropriate param
            if (artifact === '[hash]') {
              artifactsMap.set('[hash]', v4());
            }
            return artifactsMap.get(artifact) as string;
          } else {
            return artifact;
          }
        },
      );
    }

    return `${path.join(target, filename)}`;
  }

  /**
   * Returns information message about compressed file (size, time, cache, etc.)
   */
  private getCompressedFileMsg(
    file: string,
    fileInfo: CompressedFile,
    hrtime: [number, number],
  ): string {
    if (fileInfo.isSkipped) {
      return `File ${file} has been skipped`;
    }

    const getSize = `${Helpers.readableSize(
      fileInfo.beforeSize,
    )} -> ${Helpers.readableSize(fileInfo.afterSize)}`;
    return fileInfo.isCached
      ? `File ${file} has been retrieved from the cache ${getSize} (${Helpers.readableHrtime(
          hrtime,
        )})`
      : `File ${file} has been compressed ${getSize} (${Helpers.readableHrtime(
          hrtime,
        )})`;
  }
}

const compressWorker = new CompressWorker();

(async function () {
  const [files, incrementalValueOf] = await compressWorker.compressFiles();
  parentPort?.postMessage([files, incrementalValueOf]);
})();
