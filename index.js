#!/usr/bin/env node
const program = require('commander')

const version = require('./package.json').version
const Gzipper = require('./Gzipper')

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
  verbose: program.verbose,
  gzipLevel: program.gzipLevel,
  gzipMemoryLevel: program.gzipMemoryLevel,
  gzipStrategy: program.gzipStrategy,
  brotli: program.brotli,
  brotliParamMode: program.brotliParamMode,
  brotliQuality: program.brotliQuality,
  brotliSizeHint: program.brotliSizeHint,
}

Object.keys(options).forEach(
  key => options[key] === undefined && delete options[key]
)

Object.keys(options).forEach(key => {
  if (!isNaN(+options[key]) && typeof options[key] !== 'boolean') {
    options[key] = +options[key]
  }
})

new Gzipper(target, outputPath, options).compress()
