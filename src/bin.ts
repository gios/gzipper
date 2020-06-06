import { Command } from "commander";

import { Compress } from "./Compress";
import { Helpers } from "./helpers";
import { CompressOptions } from "./interfaces";
import { Incremental } from "./Incremental";
import { Config } from "./Config";
import { Logger } from "./logger/Logger";
import { LogLevel } from "./logger/LogLevel.enum";

export class Index {
  private readonly argv: string[] = process.argv;
  private readonly env: NodeJS.ProcessEnv = process.env;
  private commander = new Command();

  async exec(): Promise<void> {
    this.commander.version(Helpers.getVersion()).name("gzipper");

    this.commander
      .command("compress <path> [outputPath]")
      .alias("c")
      .description("compress selected path and optionally set output directory")
      .option("-v, --verbose", "detailed level of logs")
      .option("--incremental", "(beta) incremental compression")
      .option(
        "-e, --exclude <extensions>",
        "exclude file extensions from compression, example: jpeg,jpg...",
        this.optionToArray.bind(this),
      )
      .option(
        "-i, --include <extensions>",
        "include file extensions for compression, example: js,css,html...",
        this.optionToArray.bind(this),
      )
      .option(
        "-t, --threshold <number>",
        "exclude assets smaller than this byte size. 0 (default)",
        (value) => parseInt(value),
      )
      .option(
        "--level <number>",
        "compression level 6 (default), 0 (no compression) - 9 (best compression)",
        (value) => parseInt(value),
      )
      .option(
        "--memory-level <number>",
        "amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory)",
        (value) => parseInt(value),
      )
      .option(
        "--strategy <number>",
        "compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)",
        (value) => parseInt(value),
      )
      .option("--deflate", "enable deflate compression")
      .option("--brotli", "enable brotli compression, Node.js >= v11.7.0")
      .option(
        "--brotli-param-mode <value>",
        "default, text (for UTF-8 text), font (for WOFF 2.0 fonts)",
      )
      .option(
        "--brotli-quality <number>",
        "brotli compression quality 11 (default), 0 - 11",
        (value) => parseInt(value),
      )
      .option(
        "--brotli-size-hint <number>",
        "expected input size 0 (default)",
        (value) => parseInt(value),
      )
      .option(
        "--output-file-format <value>",
        "output file format with default artifacts [filename].[ext].[compressExt]",
      )
      .option("", "where:")
      .option("", "filename -> file name")
      .option("", "ext -> file extension")
      .option("", "compressExt -> compress extension (.gz, .br, etc)")
      .option("", "hash -> uniq uuid/v4 hash")
      .option("", "samples:")
      .option("", "[filename].[compressExt].[ext]")
      .option("", "test-[filename]-[hash].[compressExt].[ext]")
      .option("", "[filename]-[hash]-[filename]-tmp.[ext].[compressExt]")
      .action(this.compress.bind(this));

    const cache = this.commander
      .command("cache")
      .description("manipulations with cache");

    cache
      .command("purge")
      .description("purge cache storage")
      .action(this.cachePurge.bind(this));

    cache
      .command("size")
      .description("size of cached resources")
      .action(this.cacheSize.bind(this));

    await this.commander.parseAsync(this.argv);
  }

  private async compress(
    target: string,
    outputPath: string,
    options: CompressOptions,
  ): Promise<void> {
    const adjustedOptions: CompressOptions = {
      verbose: this.env.GZIPPER_VERBOSE
        ? !!parseInt(this.env.GZIPPER_VERBOSE as string)
        : options.verbose,
      incremental: this.env.GZIPPER_INCREMENTAL
        ? !!parseInt(this.env.GZIPPER_INCREMENTAL as string)
        : options.incremental,
      exclude:
        (this.optionToArray(this.env.GZIPPER_EXCLUDE) as string[]) ||
        options.exclude,
      include:
        (this.optionToArray(this.env.GZIPPER_INCLUDE) as string[]) ||
        options.include,
      threshold:
        parseInt(this.env.GZIPPER_THRESHOLD as string) ||
        options.threshold ||
        0,
      level: parseInt(this.env.GZIPPER_LEVEL as string) || options.level,
      memoryLevel:
        parseInt(this.env.GZIPPER_MEMORY_LEVEL as string) ||
        options.memoryLevel,
      strategy:
        parseInt(this.env.GZIPPER_STRATEGY as string) || options.strategy,
      brotli: this.env.GZIPPER_BROTLI
        ? !!parseInt(this.env.GZIPPER_BROTLI as string)
        : options.brotli,
      deflate: this.env.GZIPPER_DEFLATE
        ? !!parseInt(this.env.GZIPPER_DEFLATE as string)
        : options.deflate,
      brotliParamMode:
        this.env.GZIPPER_BROTLI_PARAM_MODE || options.brotliParamMode,
      brotliQuality:
        parseInt(this.env.GZIPPER_BROTLI_QUALITY as string) ||
        options.brotliQuality,
      brotliSizeHint:
        parseInt(this.env.GZIPPER_BROTLI_SIZE_HINT as string) ||
        options.brotliSizeHint,
      outputFileFormat:
        this.env.GZIPPER_OUTPUT_FILE_FORMAT || options.outputFileFormat,
    };

    await this.runCompress(target, outputPath, adjustedOptions);
  }

  private async cachePurge(): Promise<void> {
    const logger = new Logger(true);
    const config = new Config();
    const incremental = new Incremental(config);

    try {
      await incremental.cachePurge();
      logger.log(
        "Cache has been purged, you are free to initialize a new one.",
        LogLevel.SUCCESS,
      );
    } catch (err) {
      logger.log(err.message, LogLevel.ERROR);
    }
  }

  private async cacheSize(): Promise<void> {
    const logger = new Logger(true);

    const config = new Config();
    const incremental = new Incremental(config);

    try {
      const size = await incremental.cacheSize();
      logger.log(
        size
          ? `Cache size is ${Helpers.readableSize(size)}`
          : `Cache is empty, initialize a new one with --incremental option.`,
        LogLevel.INFO,
      );
    } catch (err) {
      logger.log(err.message, LogLevel.ERROR);
    }
  }

  private async runCompress(
    target: string,
    outputPath: string,
    options: CompressOptions,
  ): Promise<void> {
    const compress = new Compress(
      target,
      outputPath,
      this.filterOptions(options),
    );

    try {
      await compress.run();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete undefined and NaN options.
  private filterOptions(options: CompressOptions): CompressOptions {
    Object.keys(options).forEach((key) => {
      if (options[key] === undefined || options[key] !== options[key]) {
        delete options[key];
      }
    });

    return options;
  }

  private optionToArray<T>(value: T): string[] | T {
    if (typeof value === "string" && value) {
      return value.split(",").map((item) => item.trim());
    }

    return value;
  }
}

if (process.env.NODE_ENV !== "testing") {
  new Index().exec();
}
