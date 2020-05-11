import fs from 'fs';
import path from 'path';
import util from 'util';
import uuid from 'uuid/v4';
import stream from 'stream';

import { Helpers } from './helpers';
import { Logger } from './Logger';
import { BrotliCompression } from './compressions/Brotli';
import { GzipCompression } from './compressions/Gzip';
import { OUTPUT_FILE_FORMAT_REGEXP, NO_FILES_MESSAGE } from './constants';
import { GlobalOptions, CompressedFile } from './interfaces';
import { DeflateCompression } from './compressions/Deflate';
import { Incremental } from './Incremental';
import { Config } from './Config';

/**
 * Compressing files.
 */
export class Gzipper {
  private readonly nativeFs = {
    lstat: util.promisify(fs.lstat),
    readdir: util.promisify(fs.readdir),
    exists: util.promisify(fs.exists),
  };
  private readonly nativeStream = {
    pipeline: util.promisify(stream.pipeline),
  };
  private readonly logger: Logger;
  private readonly incremental!: Incremental;
  private readonly config: Config;
  private readonly options: GlobalOptions;
  private readonly outputPath: string | undefined;
  private readonly compressionInstance:
    | BrotliCompression
    | GzipCompression
    | DeflateCompression;
  private readonly target: string;
  private readonly createCompression:
    | ReturnType<BrotliCompression['getCompression']>
    | ReturnType<GzipCompression['getCompression']>
    | ReturnType<DeflateCompression['getCompression']>;
  /**
   * Creates an instance of Gzipper.
   */
  constructor(
    target: string,
    outputPath?: string | undefined | null,
    options: GlobalOptions = {} as never,
  ) {
    this.logger = new Logger(options.verbose as boolean);
    this.target = path.resolve(process.cwd(), target);
    this.config = new Config(this.target);
    if (!target) {
      const message = `Can't find a path.`;
      this.logger.error(message, true);
      throw new Error(message);
    }
    if (outputPath) {
      this.outputPath = path.resolve(process.cwd(), outputPath);
    }
    if (options.incremental) {
      this.incremental = new Incremental(this.target, this.config);
    }
    this.options = options;
    this.compressionInstance = this.getCompressionInstance();
    this.createCompression = this.compressionInstance.getCompression();
  }

  /**
   * Start compressing files.
   */
  async compress(): Promise<string[]> {
    let files;
    try {
      if (this.outputPath) {
        await Helpers.createFolders(this.outputPath);
      }
      if (this.options.incremental) {
        await this.incremental.initCacheFolder();
        await this.incremental.readConfig();
      }
      this.compressionLog();
      files = await this.compileFolderRecursively(this.target);
      if (this.options.incremental) {
        await this.incremental.updateConfig();
        await this.config.writeConfig();
      }
    } catch (error) {
      this.logger.error(error, true);
      throw new Error(error.message);
    }

    const filesCount = files.length;
    if (filesCount) {
      this.logger.success(
        `${filesCount} ${
          filesCount > 1 ? 'files have' : 'file has'
        } been compressed.`,
        true,
      );
    } else {
      this.logger.warn(NO_FILES_MESSAGE, true);
    }

    return files;
  }

  /**
   * Return compression instance.
   */
  private getCompressionInstance():
    | BrotliCompression
    | DeflateCompression
    | GzipCompression {
    if (this.options.brotli) {
      return new BrotliCompression(this.options, this.logger);
    } else if (this.options.deflate) {
      return new DeflateCompression(this.options, this.logger);
    } else {
      return new GzipCompression(this.options, this.logger);
    }
  }

  /**
   * Compile files in folder recursively.
   */
  private async compileFolderRecursively(target: string): Promise<string[]> {
    try {
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
        const isFile = (await this.nativeFs.lstat(filePath)).isFile();
        const isDirectory = (await this.nativeFs.lstat(filePath)).isDirectory();

        if (isDirectory) {
          compressedFiles.push(
            ...(await this.compileFolderRecursively(filePath)),
          );
        } else if (
          isFile &&
          this.isValidFileExtensions(path.extname(filePath).slice(1))
        ) {
          const { size: fileSize } = await this.nativeFs.lstat(filePath);
          if (fileSize < this.options.threshold) {
            continue;
          }

          const hrtimeStart = process.hrtime();
          compressedFiles.push(filePath);
          const fileInfo = await this.compressFile(
            file,
            target,
            this.outputPath,
          );

          if (fileInfo) {
            const hrTimeEnd = process.hrtime(hrtimeStart);
            this.logger.info(
              this.getCompressedFileMsg(file, fileInfo, hrTimeEnd),
            );
          }
        }
      }
      return compressedFiles;
    } catch (error) {
      throw error;
    }
  }

  /**
   * File compression.
   */
  private async compressFile(
    filename: string,
    target: string,
    outputDir: string | undefined,
  ): Promise<CompressedFile | undefined> {
    let isCached = false;
    const inputPath = path.join(target, filename);
    if (outputDir) {
      const isFileTarget = (await this.nativeFs.lstat(this.target)).isFile();
      target = isFileTarget
        ? outputDir
        : path.join(outputDir, path.relative(this.target, target));
      await Helpers.createFolders(target);
    }
    const outputPath = this.getOutputPath(target, filename);

    if (this.options.incremental) {
      const { isChanged, fileId } = await this.incremental.setFileChecksum(
        inputPath,
      );
      const cachedFile = path.resolve(
        this.incremental.cacheFolderPath,
        fileId as string,
      );

      if (isChanged) {
        await this.nativeStream.pipeline(
          fs.createReadStream(inputPath),
          this.createCompression(),
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
        this.createCompression(),
        fs.createWriteStream(outputPath),
      );
    }

    if (this.options.verbose) {
      const beforeSize = (await this.nativeFs.lstat(inputPath)).size / 1024;
      const afterSize = (await this.nativeFs.lstat(outputPath)).size / 1024;
      return { beforeSize, afterSize, isCached };
    }
  }

  /**
   * Show message with compression params.
   */
  private compressionLog(): void {
    const options = this.compressionInstance.readableOptions();
    this.logger.warn(options, true);

    if (!this.options.outputFileFormat) {
      this.logger.info(
        'Default output file format: [filename].[ext].[compressExt]',
      );
    }
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
        artifact => {
          if (artifactsMap.has(artifact)) {
            // Need to generate hash only if we have appropriate param
            if (artifact === '[hash]') {
              artifactsMap.set('[hash]', uuid());
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
   * Returns if the file extension is valid.
   */
  private isValidFileExtensions(ext: string): boolean {
    const excludeExtensions = this.options.exclude;
    const includeExtensions = this.options.include;

    if (includeExtensions && includeExtensions.length) {
      return includeExtensions.includes(ext);
    }

    if (excludeExtensions && excludeExtensions.length) {
      return !excludeExtensions.includes(ext);
    }

    return true;
  }

  /**
   * Returns information message about compressed file (size, time, cache, etc.)
   */
  private getCompressedFileMsg(
    file: string,
    fileInfo: CompressedFile,
    hrTime: [number, number],
  ): string {
    const [seconds, nanoseconds] = hrTime;
    const getTime = `${seconds ? seconds + 's ' : ''}${nanoseconds / 1e6}ms`;
    const getSize = `${fileInfo.beforeSize.toFixed(
      4,
    )}Kb -> ${fileInfo.afterSize.toFixed(4)}Kb`;
    return fileInfo.isCached
      ? `${file} has been retrieved from the cache ${getSize}`
      : `File ${file} has been compressed ${getSize} (${getTime})`;
  }
}
