import fs from "fs";
import path from "path";
import util from "util";
import { v4 } from "uuid";
import stream from "stream";

import { Helpers } from "./helpers";
import { Logger } from "./logger/Logger";
import { BrotliCompression } from "./compressions/Brotli";
import { GzipCompression } from "./compressions/Gzip";
import { OUTPUT_FILE_FORMAT_REGEXP, NO_FILES_MESSAGE } from "./constants";
import { CompressOptions, CompressedFile } from "./interfaces";
import { DeflateCompression } from "./compressions/Deflate";
import { Incremental } from "./Incremental";
import { Config } from "./Config";
import { LogLevel } from "./logger/LogLevel.enum";

/**
 * Compressing files.
 */
export class Compress {
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
  private readonly options: CompressOptions;
  private readonly outputPath: string | undefined;
  private readonly compressionInstance:
    | BrotliCompression
    | GzipCompression
    | DeflateCompression;
  private readonly target: string;
  private readonly createCompression:
    | ReturnType<BrotliCompression["getCompression"]>
    | ReturnType<GzipCompression["getCompression"]>
    | ReturnType<DeflateCompression["getCompression"]>;
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
      const message = `Can't find a path.`;
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
    this.compressionInstance = this.getCompressionInstance();
    this.createCompression = this.compressionInstance.getCompression();
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
        await this.incremental.initCacheFolder();
        await this.incremental.readConfig();
      }
      this.compressionLog();
      const hrtimeStart = process.hrtime();
      files = await this.compileFolderRecursively(this.target);
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
          filesCount > 1 ? "files have" : "file has"
        } been compressed. (${Helpers.readableHrtime(hrtime)})`,
        LogLevel.SUCCESS,
      );
    } else {
      this.logger.log(NO_FILES_MESSAGE, LogLevel.WARNING);
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
        const fileStat = await this.nativeFs.lstat(filePath);

        if (fileStat.isDirectory()) {
          compressedFiles.push(
            ...(await this.compileFolderRecursively(filePath)),
          );
        } else if (
          fileStat.isFile() &&
          this.isValidFileExtensions(path.extname(filePath).slice(1))
        ) {
          if (fileStat.size < this.options.threshold) {
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
            this.logger.log(
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
    this.logger.log(`Compression ${options}`, LogLevel.INFO);

    if (!this.options.outputFileFormat) {
      this.logger.log(
        "Default output file format: [filename].[ext].[compressExt]",
        LogLevel.INFO,
      );
    }
  }

  /**
   * Get output path which is based on [outputFileFormat].
   */
  private getOutputPath(target: string, file: string): string {
    const artifactsMap = new Map<string, string | null>([
      ["[filename]", path.parse(file).name],
      ["[ext]", path.extname(file).slice(1)],
      ["[compressExt]", this.compressionInstance.ext],
    ]);
    let filename = `${artifactsMap.get("[filename]")}.${artifactsMap.get(
      "[ext]",
    )}.${artifactsMap.get("[compressExt]")}`;

    if (this.options.outputFileFormat) {
      artifactsMap.set("[hash]", null);

      filename = this.options.outputFileFormat.replace(
        OUTPUT_FILE_FORMAT_REGEXP,
        (artifact) => {
          if (artifactsMap.has(artifact)) {
            // Need to generate hash only if we have appropriate param
            if (artifact === "[hash]") {
              artifactsMap.set("[hash]", v4());
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
    hrtime: [number, number],
  ): string {
    const getSize = `${Helpers.readableSize(
      fileInfo.beforeSize,
    )} -> ${Helpers.readableSize(fileInfo.afterSize)}`;
    return fileInfo.isCached
      ? `${file} has been retrieved from the cache ${getSize} (${Helpers.readableHrtime(
          hrtime,
        )})`
      : `File ${file} has been compressed ${getSize} (${Helpers.readableHrtime(
          hrtime,
        )})`;
  }
}
