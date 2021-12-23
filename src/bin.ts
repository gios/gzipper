import { Command } from 'commander';

import { Compress } from './Compress';
import { Helpers } from './helpers';
import { CompressOptions } from './interfaces';
import { Incremental } from './Incremental';
import { Config } from './Config';
import { Logger } from './logger/Logger';
import { LogLevel } from './logger/LogLevel.enum';

export class Index {
  private readonly argv: string[] = process.argv;
  private readonly env: NodeJS.ProcessEnv = process.env;
  private commander = new Command();

  async exec(): Promise<void> {
    this.commander.version(Helpers.getVersion()).name('gzipper');

    this.commander
      .command('compress <path> [outputPath]')
      .alias('c')
      .description('compress selected path and optionally set output directory')
      .option('-v, --verbose', 'detailed level of logs')
      .option('--incremental', 'incremental compression')
      .option(
        '-e, --exclude <extensions>',
        'exclude file extensions from compression, example: jpeg,jpg...',
        this.optionToArray.bind(this),
      )
      .option(
        '-i, --include <extensions>',
        'include file extensions for compression, example: js,css,html...',
        this.optionToArray.bind(this),
      )
      .option(
        '-t, --threshold <number>',
        'exclude assets smaller than this byte size. 0 (default)',
        (value) => parseInt(value),
      )
      .option('--deflate', 'enable deflate compression')
      .option('--brotli', 'enable brotli compression')
      .option('--gzip', 'enable gzip compression')
      .option('--zopfli', 'enable zopfli compression')
      .option(
        '--gzip-level <number>',
        'gzip compression level 6 (default), 0 (no compression) - 9 (best compression)',
        (value) => parseInt(value),
      )
      .option(
        '--gzip-memory-level <number>',
        'amount of memory which will be allocated for gzip compression 8 (default), 1 (minimum memory) - 9 (maximum memory)',
        (value) => parseInt(value),
      )
      .option(
        '--gzip-strategy <number>',
        'gzip compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)',
        (value) => parseInt(value),
      )
      .option(
        '--deflate-level <number>',
        'deflate compression level 6 (default), 0 (no compression) - 9 (best compression)',
        (value) => parseInt(value),
      )
      .option(
        '--deflate-memory-level <number>',
        'amount of memory which will be allocated for deflate compression 8 (default), 1 (minimum memory) - 9 (maximum memory)',
        (value) => parseInt(value),
      )
      .option(
        '--deflate-strategy <number>',
        'deflate compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)',
        (value) => parseInt(value),
      )
      .option(
        '--brotli-param-mode <value>',
        'default, text (for UTF-8 text), font (for WOFF 2.0 fonts)',
      )
      .option(
        '--brotli-quality <number>',
        'brotli compression quality 11 (default), 0 - 11',
        (value) => parseInt(value),
      )
      .option(
        '--brotli-size-hint <number>',
        'expected input size 0 (default)',
        (value) => parseInt(value),
      )
      .option(
        '--zopfli-num-iterations <number>',
        'maximum amount of times to rerun forward and backward pass to optimize LZ77 compression cost',
        (value) => parseInt(value),
      )
      .option(
        '--zopfli-block-splitting',
        'splits the data in multiple deflate blocks with optimal choice for the block boundaries',
      )
      .option(
        '--zopfli-block-splitting-last',
        'chooses the optimal block split points only after doing the iterative LZ77 compression',
      )
      .option(
        '--zopfli-block-splitting-max <number>',
        'maximum amount of blocks to split into (0 for unlimited, but this can give extreme results that hurt compression on some files)',
        (value) => parseInt(value),
      )
      .option(
        '--output-file-format <value>',
        'output file format with default artifacts [filename].[ext].[compressExt]',
      )
      .option(
        '--remove-larger',
        'remove compressed files if they larger than uncompressed originals',
      )
      .option(
        '--skip-compressed',
        'skip compressed files if they already exist',
      )
      .option(
        '--workers <number>',
        'numbers of workers which will be spawned, system CPU cores count (default)',
        (value) => parseInt(value),
      )
      .action(this.compress.bind(this));

    const cache = this.commander
      .command('cache')
      .description('manipulations with cache');

    cache
      .command('purge')
      .description('purge cache storage')
      .action(this.cachePurge.bind(this));

    cache
      .command('size')
      .description('size of cached resources')
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
      brotli: this.env.GZIPPER_BROTLI
        ? !!parseInt(this.env.GZIPPER_BROTLI as string)
        : options.brotli,
      deflate: this.env.GZIPPER_DEFLATE
        ? !!parseInt(this.env.GZIPPER_DEFLATE as string)
        : options.deflate,
      gzip: this.env.GZIPPER_GZIP
        ? !!parseInt(this.env.GZIPPER_GZIP as string)
        : options.gzip,
      zopfli: this.env.GZIPPER_ZOPFLI
        ? !!parseInt(this.env.GZIPPER_ZOPFLI as string)
        : options.zopfli,
      gzipLevel:
        parseInt(this.env.GZIPPER_GZIP_LEVEL as string) || options.gzipLevel,
      gzipMemoryLevel:
        parseInt(this.env.GZIPPER_GZIP_MEMORY_LEVEL as string) ||
        options.gzipMemoryLevel,
      gzipStrategy:
        parseInt(this.env.GZIPPER_GZIP_STRATEGY as string) ||
        options.gzipStrategy,
      deflateLevel:
        parseInt(this.env.GZIPPER_DEFLATE_LEVEL as string) ||
        options.deflateLevel,
      deflateMemoryLevel:
        parseInt(this.env.GZIPPER_DEFLATE_MEMORY_LEVEL as string) ||
        options.deflateMemoryLevel,
      deflateStrategy:
        parseInt(this.env.GZIPPER_DEFLATE_STRATEGY as string) ||
        options.deflateStrategy,
      brotliParamMode:
        this.env.GZIPPER_BROTLI_PARAM_MODE || options.brotliParamMode,
      brotliQuality:
        parseInt(this.env.GZIPPER_BROTLI_QUALITY as string) ||
        options.brotliQuality,
      brotliSizeHint:
        parseInt(this.env.GZIPPER_BROTLI_SIZE_HINT as string) ||
        options.brotliSizeHint,
      zopfliNumIterations:
        parseInt(this.env.GZIPPER_ZOPFLI_NUM_ITERATIONS as string) ||
        options.zopfliNumIterations,
      zopfliBlockSplitting: this.env.GZIPPER_ZOPFLI_BLOCK_SPLITTING
        ? !!parseInt(this.env.GZIPPER_ZOPFLI_BLOCK_SPLITTING as string)
        : options.zopfliBlockSplitting,
      zopfliBlockSplittingLast: this.env.GZIPPER_ZOPFLI_BLOCK_SPLITTING_LAST
        ? !!parseInt(this.env.GZIPPER_ZOPFLI_BLOCK_SPLITTING_LAST as string)
        : options.zopfliBlockSplittingLast,
      zopfliBlockSplittingMax:
        parseInt(this.env.GZIPPER_ZOPFLI_BLOCK_SPLITTING_MAX as string) ||
        options.zopfliBlockSplittingMax,
      outputFileFormat:
        this.env.GZIPPER_OUTPUT_FILE_FORMAT || options.outputFileFormat,
      removeLarger: this.env.GZIPPER_REMOVE_LARGER
        ? !!parseInt(this.env.GZIPPER_REMOVE_LARGER as string)
        : options.removeLarger,
      skipCompressed: this.env.GZIPPER_SKIP_COMPRESSED
        ? !!parseInt(this.env.GZIPPER_SKIP_COMPRESSED as string)
        : options.skipCompressed,
      workers: parseInt(this.env.GZIPPER_WORKERS as string) || options.workers,
    };

    await this.runCompress(target, outputPath, adjustedOptions);
  }

  private async cachePurge(): Promise<void> {
    Logger.setVerboseMode(true);
    const config = new Config();
    const incremental = new Incremental(config);

    try {
      await incremental.cachePurge();
      Logger.log(
        'Cache has been purged, you are free to initialize a new one.',
        LogLevel.SUCCESS,
      );
    } catch (err) {
      Logger.log(err, LogLevel.ERROR);
    }
  }

  private async cacheSize(): Promise<void> {
    Logger.setVerboseMode(true);
    const incremental = new Incremental();

    try {
      const size = await incremental.cacheSize();
      Logger.log(
        size
          ? `Cache size is ${Helpers.readableSize(size)}`
          : `Cache is empty, initialize a new one with --incremental option.`,
        LogLevel.INFO,
      );
    } catch (err) {
      Logger.log(err, LogLevel.ERROR);
    }
  }

  private async runCompress(
    target: string,
    outputPath: string,
    options: CompressOptions,
  ): Promise<void> {
    Logger.setVerboseMode(true);
    const compress = new Compress(
      target,
      outputPath,
      this.filterOptions(options),
    );

    try {
      await compress.run();
    } catch (err) {
      Logger.log(err, LogLevel.ERROR);
    }
  }

  // Delete undefined and NaN options.
  private filterOptions<T>(options: T): T {
    for (const key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        if (options[key] === undefined || options[key] !== options[key]) {
          delete options[key];
        }
      }
    }

    return options;
  }

  private optionToArray<T>(value: T): string[] | T {
    if (typeof value === 'string' && value) {
      return value.split(',').map((item) => item.trim());
    }

    return value;
  }
}

if (process.env.NODE_ENV !== 'testing') {
  new Index().exec();
}
