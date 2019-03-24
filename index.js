#!/usr/bin/env node
const program = require('commander')

const version = require('./package.json').version
const Gzipper = require('./Gzipper')

const {
  GZIPPER_VERBOSE,
  GZIPPER_GZIP_LEVEL,
  GZIPPER_GZIP_MEMORY_LEVEL,
  GZIPPER_GZIP_STRATEGY,
  GZIPPER_BROTLI,
  GZIPPER_BROTLI_PARAM_MODE,
  GZIPPER_BROTLI_QUALITY,
  GZIPPER_BROTLI_SIZE_HINT,
} = process.env

program
  .version(version)
  .usage('[options] <path> [outputPath]')
  .option('-v, --verbose', 'detailed level of logs')
  .option(
    '-gl, --gzip-level [level]',
    'gzip compression level -1 (default), 0 (no compression) - 9 (best compression)'
  )
  .option(
    '-gm, --gzip-memory-level [memoryLevel]',
    'amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory)'
  )
  .option(
    '-gs, --gzip-strategy [strategy]',
    'compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)'
  )
  .option('--brotli', 'enable brotli compression, Node.js >= v11.7.0')
  .option(
    '-bp, --brotli-param-mode [brotliParamMode]',
    'default, text (for UTF-8 text), font (for WOFF 2.0 fonts)'
  )
  .option(
    '-bq, --brotli-quality [brotliQuality]',
    'brotli compression quality 11 (default), 0 - 11'
  )
  .option(
    '-bs, --brotli-size-hint [brotliSizeHint]',
    'expected input size 0 (default)'
  )
  .parse(process.argv)

const [target, outputPath] = program.args
const options = {
  verbose: Boolean(GZIPPER_VERBOSE) || program.verbose,
  gzipLevel: +GZIPPER_GZIP_LEVEL || +program.gzipLevel,
  gzipMemoryLevel: +GZIPPER_GZIP_MEMORY_LEVEL || +program.gzipMemoryLevel,
  gzipStrategy: +GZIPPER_GZIP_STRATEGY || +program.gzipStrategy,
  brotli: Boolean(GZIPPER_BROTLI) || program.brotli,
  brotliParamMode: GZIPPER_BROTLI_PARAM_MODE || program.brotliParamMode,
  brotliQuality: +GZIPPER_BROTLI_QUALITY || +program.brotliQuality,
  brotliSizeHint: +GZIPPER_BROTLI_SIZE_HINT || +program.brotliSizeHint,
}

Object.keys(options).forEach(key => {
  if (options[key] === undefined || isNaN(options[key])) {
    delete options[key]
  }
})

const gzipper = new Gzipper(target, outputPath, options)
gzipper.compress().catch(err => console.error(err))
