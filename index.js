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
  .parse(process.argv)

const [target, outputPath] = program.args
const options = {
  verbose: program.verbose,
  gzipLevel: program.gzipLevel,
  gzipMemoryLevel: program.gzipMemoryLevel,
  gzipStrategy: program.gzipStrategy,
}

Object.keys(options).forEach(
  key => options[key] === undefined && delete options[key]
)

Object.keys(options).forEach(key => {
  if (!isNaN(+options[key])) {
    options[key] = +options[key]
  }
})

new Gzipper(target, outputPath, options).compress()
