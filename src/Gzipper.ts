import fs from 'fs';
import path from 'path';
import util from 'util';
import uuid from 'uuid/v4';
import stream from 'stream';

import { Logger } from './Logger';
import { BrotliCompression } from './compressions/Brotli';
import { GzipCompression } from './compressions/Gzip';
import { VALID_EXTENSIONS } from './constants';
import { GlobalOptions } from './interfaces';
import { DeflateCompression } from './compressions/Deflate';

const OUTPUT_FILE_FORMAT_REGEXP = /(\[filename\]*)|(\[hash\]*)|(\[compressExt\]*)|(\[ext\]*)/g;

/**
 * Compressing files.
 */
export class Gzipper {
  private readonly nativeFs = {
    stat: util.promisify(fs.stat),
    lstat: util.promisify(fs.lstat),
    readdir: util.promisify(fs.readdir),
    mkdir: util.promisify(fs.mkdir),
  };
  private readonly nativeStream = {
    pipeline: util.promisify(stream.pipeline),
  };
  private readonly logger: Logger;
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
  private readonly validExtensions: string[];
  /**
   * Creates an instance of Gzipper.
   */
  constructor(
    target: string | undefined | null,
    outputPath: string | undefined | null,
    options: GlobalOptions = {} as never,
  ) {
    this.logger = new Logger(options.verbose as boolean);
    if (!target) {
      const message = `Can't find a path.`;
      this.logger.error(message, true);
      throw new Error(message);
    }
    this.options = options;
    if (outputPath) {
      this.outputPath = path.resolve(process.cwd(), outputPath);
    }
    this.compressionInstance = this.options.brotli
      ? new BrotliCompression(this.options, this.logger)
      : new GzipCompression(this.options, this.logger);
    this.target = path.resolve(process.cwd(), target);
    this.createCompression = this.compressionInstance.getCompression();
    this.validExtensions = this.getValidExtensions();
  }

  /**
   * Start compressing files.
   */
  public async compress(): Promise<void> {
    let files;
    try {
      if (this.outputPath) {
        await this.createFolders(this.outputPath);
      }
      this.compressionLog();
      files = await this.compileFolderRecursively(this.target);
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
      this.logger.warn(
        `we couldn't find any appropriate files. valid extensions are: ${VALID_EXTENSIONS.join(
          ', ',
        )}`,
        true,
      );
    }
  }

  /**
   * Compile files in folder recursively.
   */
  private async compileFolderRecursively(target: string): Promise<string[]> {
    try {
      const compressedFiles: string[] = [];
      const filesList = await this.nativeFs.readdir(target);

      for (const file of filesList) {
        const filePath = path.resolve(target, file);
        const isFile = (await this.nativeFs.lstat(filePath)).isFile();
        const isDirectory = (await this.nativeFs.lstat(filePath)).isDirectory();

        if (isDirectory) {
          compressedFiles.push(
            ...(await this.compileFolderRecursively(filePath)),
          );
        } else if (isFile) {
          try {
            if (this.validExtensions.includes(path.extname(filePath))) {
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
                const [seconds, nanoseconds] = process.hrtime(hrtimeStart);
                this.logger.info(
                  `File ${file} has been compressed ${fileInfo.beforeSize.toFixed(
                    4,
                  )}Kb -> ${fileInfo.afterSize.toFixed(4)}Kb (${
                    seconds ? seconds + 's ' : ''
                  }${nanoseconds / 1e6}ms)`,
                );
              }
            }
          } catch (error) {
            throw error;
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
  ): Promise<{ beforeSize: number; afterSize: number } | undefined> {
    const inputPath = path.join(target, filename);
    if (outputDir) {
      target = path.join(outputDir, path.relative(this.target, target));
      await this.createFolders(target);
    }
    const outputPath = this.getOutputPath(target, filename);

    await this.nativeStream.pipeline(
      fs.createReadStream(inputPath),
      this.createCompression(),
      fs.createWriteStream(outputPath),
    );

    if (this.options.verbose) {
      const beforeSize = (await this.nativeFs.stat(inputPath)).size / 1024;
      const afterSize = (await this.nativeFs.stat(outputPath)).size / 1024;
      return { beforeSize, afterSize };
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
        'Use default output file format [filename].[ext].[compressExt]',
      );
    }
  }

  /**
   * Create folders by path.
   */
  private async createFolders(target: string): Promise<void> {
    await this.nativeFs.mkdir(target, { recursive: true });
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
   * Returns the filtered list of extensions from `options.exclude`.
   */
  private getValidExtensions(): string[] {
    const excludeExtensions = this.options.exclude;
    const includeExtensions = this.options.include;

    if (excludeExtensions) {
      return VALID_EXTENSIONS.filter(
        extension => !excludeExtensions.includes(extension),
      );
    }

    if (includeExtensions) {
      return VALID_EXTENSIONS.filter(extension =>
        includeExtensions.includes(extension),
      );
    }

    return VALID_EXTENSIONS;
  }
}
