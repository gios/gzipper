import { parentPort, workerData } from 'node:worker_threads';
import { createReadStream, createWriteStream } from 'node:fs';
import { lstat, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  CompressedFile,
  CompressionType,
  CompressOptions,
  IncrementalFileValue,
  WorkerMessage,
} from './interfaces';
import { OUTPUT_FILE_FORMAT_REGEXP } from './constants';
import {
  createFolders,
  checkFileExists,
  readableSize,
  readableHrtime,
} from './helpers';
import { Logger } from './logger/Logger';
import { CompressService } from './Compress.service';
import { Incremental } from './Incremental';

class CompressWorker {
  private readonly options: CompressOptions = workerData.options;
  private readonly chunk: string[] = workerData.chunk;
  private readonly target: string = workerData.target;
  private readonly outputPath: string = workerData.outputPath;
  private readonly incrementalFilePaths: Record<string, IncrementalFileValue> =
    workerData.incrementalFilePaths;
  private readonly incremental!: Incremental;
  private readonly service: CompressService;
  private readonly compressionInstances: CompressionType[];
  private readonly logger: Logger;

  constructor() {
    if (this.options.incremental) {
      this.incremental = new Incremental();
      this.incremental.filePaths = this.incrementalFilePaths;
    }
    this.logger = new Logger();
    this.logger.initialize({
      verbose: this.options.verbose,
      color: this.options.color,
    });
    this.service = new CompressService(this.options);
    this.compressionInstances = this.service.getCompressionInstances();
  }

  /**
   * Compress files list and returns files and incremental data.
   */
  async compressFiles(): Promise<WorkerMessage> {
    const filesList: string[] = [];

    for (const compressionInstance of this.compressionInstances) {
      for (const filePath of this.chunk) {
        const hrtimeStart = process.hrtime();
        const fileInfo = await this.compressFile(
          path.basename(filePath),
          path.dirname(filePath),
          compressionInstance,
        );

        if (!fileInfo.removeCompressed && !fileInfo.isSkipped) {
          filesList.push(filePath);
        }

        if (this.options.verbose) {
          const hrTimeEnd = process.hrtime(hrtimeStart);
          this.logger.log(
            this.getCompressedFileMsg(
              compressionInstance,
              filePath,
              fileInfo as CompressedFile,
              hrTimeEnd,
            ),
          );
        }
      }
    }

    return {
      files: filesList,
      filePaths: this.incremental?.filePaths,
    };
  }

  /**
   * File compression.
   */
  private async compressFile(
    filename: string,
    target: string,
    compressionInstance: CompressionType,
  ): Promise<Partial<CompressedFile>> {
    const createCompression = await compressionInstance.getCompression();
    let isCached = false;
    let isSkipped = false;
    const inputPath = path.join(target, filename);
    if (this.outputPath) {
      const isFileTarget = (await lstat(this.target)).isFile();
      target = isFileTarget
        ? this.outputPath
        : path.join(this.outputPath, path.relative(this.target, target));
      await createFolders(target);
    }
    const outputPath = this.getOutputPath(
      target,
      filename,
      compressionInstance.ext,
    );

    if (this.options.skipCompressed) {
      if (await checkFileExists(outputPath)) {
        isSkipped = true;
        return { isCached, isSkipped };
      }
    }

    if (this.options.incremental) {
      const checksum = await this.incremental.getFileChecksum(inputPath);
      const { isChanged, fileId } = this.incremental.setFile(
        inputPath,
        checksum,
        compressionInstance.compressionName,
        compressionInstance.compressionOptions,
      );

      const cachedFile = path.resolve(
        this.incremental.cacheFolder,
        fileId as string,
      );

      if (isChanged) {
        await pipeline(
          createReadStream(inputPath),
          createCompression,
          createWriteStream(outputPath),
        );

        await pipeline(
          createReadStream(outputPath),
          createWriteStream(cachedFile),
        );
      } else {
        await pipeline(
          createReadStream(cachedFile),
          createWriteStream(outputPath),
        );
        isCached = true;
      }
    } else {
      await pipeline(
        createReadStream(inputPath),
        createCompression,
        createWriteStream(outputPath),
      );
    }

    if (this.options.verbose || this.options.removeLarger) {
      const beforeSize = (await lstat(inputPath)).size;
      const afterSize = (await lstat(outputPath)).size;

      const removeCompressed =
        this.options.removeLarger && beforeSize < afterSize;
      if (removeCompressed) {
        await unlink(outputPath);
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
  private getOutputPath(target: string, file: string, ext: string): string {
    const artifactsMap = new Map<string, string | null>([
      ['[filename]', path.parse(file).name],
      ['[ext]', path.extname(file).slice(1)],
      ['[compressExt]', ext],
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
              artifactsMap.set('[hash]', crypto.randomUUID());
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
    compressionInstance: CompressionType,
    file: string,
    fileInfo: CompressedFile,
    hrtime: [number, number],
  ): string {
    const fileRelative = path.relative(this.target, file);
    const compressionName = compressionInstance.compressionName;
    if (fileInfo.isSkipped) {
      return `File ${fileRelative} has been skipped.`;
    }

    const getSize = `${readableSize(
      fileInfo.beforeSize,
    )} -> ${readableSize(fileInfo.afterSize)}`;
    const getTime = readableHrtime(hrtime);
    const fileMessage = fileInfo.isCached
      ? `File ${fileRelative} has been retrieved from the cache.`
      : `File ${fileRelative} has been compressed.`;

    return `${fileMessage} \n
      Algorithm: ${compressionName} \n
      Size: ${getSize} \n
      Time: ${getTime}`;
  }
}

const compressWorker = new CompressWorker();

(async function () {
  const { files, filePaths } = await compressWorker.compressFiles();
  parentPort?.postMessage({ files, filePaths });
})();
