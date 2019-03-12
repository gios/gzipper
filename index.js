#!/usr/bin/env node
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const program = require('commander')

const version = require('./package.json').version
const Logger = require('./Logger')

let target

program
  .version(version)
  .usage('[options] <path>')
  .action(folderPath => {
    if (!folderPath) {
      throw new Error(`Can't find a path.`)
    }
    target = path.resolve(process.cwd(), folderPath)
  })
  .option('-v, --verbose', 'detailed level of logs')
  .option(
    '-gl, --gzip-level',
    'gzip compression level 0 (no compression) - 9 (best compression)'
  )
  .option(
    '-gm, --gzip-memory-level',
    'amount of memory which will be allocated for compression 1 (minimum memory) - 9 (maximum memory)'
  )
  .option(
    '-gs, --gzip-strategy',
    'compression strategy 1 (filtered) - 2 (huffman only) - 3 (RLE) - 4 (fixed)'
  )
  .parse(process.argv)

let logger = new Logger(program.verbose)
compileFolderRecursively(target)

/**
 * Compile files in folder recursively.
 *
 * @param {string} outputDir path to output directory
 * @param {number} [globalCount=0] global files count
 * @param {number} [successGlobalCount=0] success files count
 */
function compileFolderRecursively(
  outputDir,
  globalCount = 0,
  successGlobalCount = 0
) {
  const filesList = fs.readdirSync(outputDir)

  try {
    filesList.forEach(file => {
      const filePath = path.resolve(outputDir, file)

      if (
        fs.lstatSync(filePath).isFile() &&
        (path.extname(filePath) === '.js' || path.extname(filePath) === '.css')
      ) {
        ++globalCount

        compressFile(file, outputDir, () => {
          ++successGlobalCount
          logger.info(`File ${file} has been compiled.`)

          if (globalCount === successGlobalCount) {
            logger.success(
              `${globalCount} ${
                globalCount.length > 1 ? 'files have' : 'file has'
              } been compiled.`,
              true
            )
          }
        })
      } else if (fs.lstatSync(filePath).isDirectory()) {
        compileFolderRecursively(filePath, globalCount, successGlobalCount)
      }
    })
  } catch (err) {
    logger.error(err, true)
    logger.warn(
      `${globalCount} ${
        globalCount.length > 1 ? 'files have' : 'file has'
      } been compiled.`,
      true
    )
  }
}

/**
 * File compression.
 *
 * @param {string} filename path to file
 * @param {string} outputDir path to output directory
 * @param {() => void} callback finish callback
 */
function compressFile(filename, outputDir, callback) {
  let compress = zlib.createGzip({
    level: program.gzipLevel || -1,
    memLevel: program.gzipMemoryLevel || 8,
    strategy: program.gzipStrategy || 0,
  })
  let input = fs.createReadStream(path.join(outputDir, filename))
  let output = fs.createWriteStream(`${path.join(outputDir, filename)}.gz`)

  input.pipe(compress).pipe(output)

  if (callback) {
    output.on('finish', callback)
    output.on('error', error => logger.error(error, true))
  }
}
