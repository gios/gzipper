#!/usr/bin/env node
import program from 'commander';

import { Gzipper } from './src/Gzipper';
import { GlobalOptions } from './src/interfaces';
const version = require('./package.json').version;

const {
  GZIPPER_VERBOSE,
  GZIPPER_EXCLUDE,
  GZIPPER_INCLUDE,
  GZIPPER_THRESHOLD,
  GZIPPER_GZIP_LEVEL,
  GZIPPER_GZIP_MEMORY_LEVEL,
  GZIPPER_GZIP_STRATEGY,
  GZIPPER_BROTLI,
  GZIPPER_BROTLI_PARAM_MODE,
  GZIPPER_BROTLI_QUALITY,
  GZIPPER_BROTLI_SIZE_HINT,
  GZIPPER_OUTPUT_FILE_FORMAT,
} = process.env;

program
  .version(version)
  .usage('[options] <path> [outputPath]')
  .option('-v, --verbose', 'detailed level of logs', Boolean(GZIPPER_VERBOSE))
  .option(
    '-e, --exclude <extensions>',
    'exclude file extensions from compression, example: jpeg,jpg...',
    (value: string) => value.split(',').map(item => `.${item.trim()}`),
    GZIPPER_EXCLUDE,
  )
  .option(
    '-i, --include <extensions>',
    'include file extensions for compression, example: js,css,html...',
    (value: string) => value.split(',').map(item => `.${item.trim()}`),
    GZIPPER_INCLUDE,
  )
  .option(
    '-t, --threshold <number>',
    'exclude assets smaller than this byte size. 0 (default)',
    value => parseInt(value),
    parseInt(GZIPPER_THRESHOLD as string) || 0,
  )
  .option(
    '-gl, --gzip-level <number>',
    'gzip compression level 6 (default), 0 (no compression) - 9 (best compression)',
    value => parseInt(value),
    parseInt(GZIPPER_GZIP_LEVEL as string),
  )
  .option(
    '-gm, --gzip-memory-level <number>',
    'amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory)',
    value => parseInt(value),
    parseInt(GZIPPER_GZIP_MEMORY_LEVEL as string),
  )
  .option(
    '-gs, --gzip-strategy <number>',
    'compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)',
    value => parseInt(value),
    parseInt(GZIPPER_GZIP_STRATEGY as string),
  )
  .option(
    '--brotli',
    'enable brotli compression, Node.js >= v11.7.0',
    Boolean(GZIPPER_BROTLI),
  )
  .option(
    '-bp, --brotli-param-mode <value>',
    'default, text (for UTF-8 text), font (for WOFF 2.0 fonts)',
    GZIPPER_BROTLI_PARAM_MODE,
  )
  .option(
    '-bq, --brotli-quality <number>',
    'brotli compression quality 11 (default), 0 - 11',
    value => parseInt(value),
    parseInt(GZIPPER_BROTLI_QUALITY as string),
  )
  .option(
    '-bs, --brotli-size-hint <number>',
    'expected input size 0 (default)',
    value => parseInt(value),
    parseInt(GZIPPER_BROTLI_SIZE_HINT as string),
  )
  .option(
    '--output-file-format <value>',
    'output file format with default artifacts [filename].[ext].[compressExt]',
    GZIPPER_OUTPUT_FILE_FORMAT,
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
  .parse(process.argv);

const [target, outputPath] = program.args;
const options: GlobalOptions & { [key: string]: unknown } = {
  verbose: program.verbose,
  exclude: program.exclude,
  include: program.include,
  threshold: program.threshold,
  gzipLevel: program.gzipLevel,
  gzipMemoryLevel: program.gzipMemoryLevel,
  gzipStrategy: program.gzipStrategy,
  brotli: program.brotli,
  brotliParamMode: program.brotliParamMode,
  brotliQuality: program.brotliQuality,
  brotliSizeHint: program.brotliSizeHint,
  outputFileFormat: program.outputFileFormat,
};

// Delete undefined options.
Object.keys(options).forEach(key => {
  if (options[key] === undefined || options[key] !== options[key]) {
    delete options[key];
  }
});

const gzipper = new Gzipper(target, outputPath, options || {});
gzipper.compress().catch(err => console.error(err));
