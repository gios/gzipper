#!/usr/bin/env node
import program from 'commander';

import { Gzipper } from './src/Gzipper';
import { GlobalOptions } from './src/interfaces';
const version = require('./package.json').version;

export class Index {
  private target: string | undefined;
  private outputPath: string | undefined;
  private options: GlobalOptions | undefined;
  private readonly argv: string[] = process.argv;
  private readonly env: NodeJS.ProcessEnv = process.env;

  public getOptions(): this {
    program
      .version(version)
      .usage('[options] <path> [outputPath]')
      .option('-v, --verbose', 'detailed level of logs')
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
        value => parseInt(value),
      )
      .option(
        '-gl, --gzip-level <number>',
        'gzip compression level 6 (default), 0 (no compression) - 9 (best compression)',
        value => parseInt(value),
      )
      .option(
        '-gm, --gzip-memory-level <number>',
        'amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory)',
        value => parseInt(value),
      )
      .option(
        '-gs, --gzip-strategy <number>',
        'compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)',
        value => parseInt(value),
      )
      .option('--brotli', 'enable brotli compression, Node.js >= v11.7.0')
      .option(
        '-bp, --brotli-param-mode <value>',
        'default, text (for UTF-8 text), font (for WOFF 2.0 fonts)',
      )
      .option(
        '-bq, --brotli-quality <number>',
        'brotli compression quality 11 (default), 0 - 11',
        value => parseInt(value),
      )
      .option(
        '-bs, --brotli-size-hint <number>',
        'expected input size 0 (default)',
        value => parseInt(value),
      )
      .option(
        '--output-file-format <value>',
        'output file format with default artifacts [filename].[ext].[compressExt]',
      )
      .option('', 'where:')
      .option('', 'filename -> file name')
      .option('', 'ext -> file extension')
      .option('', 'compressExt -> compress extension (.gz, .br, etc)')
      .option('', 'hash -> uniq uuid/v4 hash')
      .option('', 'samples:')
      .option('', '[filename].[compressExt].[ext]')
      .option('', 'test-[filename]-[hash].[compressExt].[ext]')
      .option('', '[filename]-[hash]-[filename]-tmp.[ext].[compressExt]')
      .parse(this.argv)
      .removeAllListeners();

    const [target, outputPath] = program.args;
    const options: GlobalOptions = {
      verbose: this.env.GZIPPER_VERBOSE
        ? !!parseInt(this.env.GZIPPER_VERBOSE as string)
        : program.verbose,
      exclude:
        this.optionToArray(this.env.GZIPPER_EXCLUDE as string) ||
        program.exclude,
      include:
        this.optionToArray(this.env.GZIPPER_INCLUDE as string) ||
        program.include,
      threshold:
        parseInt(this.env.GZIPPER_THRESHOLD as string) ||
        program.threshold ||
        0,
      gzipLevel:
        parseInt(this.env.GZIPPER_GZIP_LEVEL as string) || program.gzipLevel,
      gzipMemoryLevel:
        parseInt(this.env.GZIPPER_GZIP_MEMORY_LEVEL as string) ||
        program.gzipMemoryLevel,
      gzipStrategy:
        parseInt(this.env.GZIPPER_GZIP_STRATEGY as string) ||
        program.gzipStrategy,
      brotli: this.env.GZIPPER_BROTLI
        ? !!parseInt(this.env.GZIPPER_BROTLI as string)
        : program.brotli,
      brotliParamMode:
        this.env.GZIPPER_BROTLI_PARAM_MODE || program.brotliParamMode,
      brotliQuality:
        parseInt(this.env.GZIPPER_BROTLI_QUALITY as string) ||
        program.brotliQuality,
      brotliSizeHint:
        parseInt(this.env.GZIPPER_BROTLI_SIZE_HINT as string) ||
        program.brotliSizeHint,
      outputFileFormat:
        this.env.GZIPPER_OUTPUT_FILE_FORMAT || program.outputFileFormat,
    };

    this.target = target;
    this.outputPath = outputPath;
    this.options = options;
    return this;
  }

  // Delete undefined options.
  public filterOptions(): this {
    Object.keys(this.options as GlobalOptions).forEach(key => {
      if (
        (this.options as GlobalOptions)[key] === undefined ||
        (this.options as GlobalOptions)[key] !==
          (this.options as GlobalOptions)[key]
      ) {
        delete (this.options as GlobalOptions)[key];
      }
    });

    return this;
  }

  public start(): void {
    const gzipper = new Gzipper(
      this.target,
      this.outputPath,
      (this.options as GlobalOptions) || {},
    );
    gzipper.compress().catch(err => console.error(err));
  }

  private optionToArray(value: string): string[] | string {
    if (value) {
      return value.split(',').map(item => `.${item.trim()}`);
    }

    return value;
  }
}

if (process.env.NODE_ENV !== 'testing') {
  new Index()
    .getOptions()
    .filterOptions()
    .start();
}
