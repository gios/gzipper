#!/usr/bin/env node
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const program = require('commander')
const version = require('./package.json').version

let outputDir

program
  .version(version)
  .usage('[options] <path>')
  .action(folderPath => {
    if (!folderPath) {
      throw new Error(`Can't find a path.`)
    }
    outputDir = path.resolve(process.cwd(), folderPath)
  })
  .option('-v, --verbose', 'detailed level of logs')
  .parse(process.argv)

let logger = program.verbose ? loggerInit(true) : loggerInit(false)
compileFolderRecursively(outputDir)

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
            logger.success(`${globalCount} files have been compiled.`, true)
          }
        })
      } else if (fs.lstatSync(filePath).isDirectory()) {
        compileFolderRecursively(filePath, globalCount, successGlobalCount)
      }
    })
  } catch (err) {
    console.error(err)
    logger.warn(`${globalCount} files have been compiled.`, true)
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
  let compress = zlib.createGzip()
  let input = fs.createReadStream(path.join(outputDir, filename))
  let output = fs.createWriteStream(`${path.join(outputDir, filename)}.gz`)

  input.pipe(compress).pipe(output)

  if (callback) {
    output.on('finish', callback)
    output.on('error', error => console.error(error))
  }
}

/**
 * Custom logger.
 *
 * @typedef {Object} Logger
 * @property {(message: any, force: boolean) => void} info info message
 * @property {(message: any, force: boolean) => void} error error message
 * @property {(message: any, force: boolean) => void} success success message
 * @property {(message: any, force: boolean) => void} warn warning message
 *
 * @param {boolean} enable verbose logging
 * @return {Logger}
 */
function loggerInit(enable) {
  const logFn = level => {
    let colorfulMessage
    switch (level) {
      case 'info':
        colorfulMessage = `\x1b[36m%s\x1b[0m`
        break

      case 'error':
        colorfulMessage = `\x1b[31m%s\x1b[0m`
        break

      case 'warning':
        colorfulMessage = `\x1b[33m%s\x1b[0m`
        break

      case 'success':
        colorfulMessage = `\x1b[32m%s\x1b[0m`
        break
    }
    return (message, force) =>
      (enable || force) && console.log(colorfulMessage.replace('%s', message))
  }

  return {
    info: logFn('info'),
    error: logFn('error'),
    success: logFn('success'),
    warn: logFn('warning'),
  }
}
