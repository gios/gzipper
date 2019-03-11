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
 * Compile files in folders recursively.
 *
 * @param {string} outputDir
 * @param {number} fileCounter
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
          logger(`File ${file} has been compiled.`)

          if (globalCount === successGlobalCount) {
            logger(`${globalCount} files have been compiled.`, true)
          }
        })
      } else if (fs.lstatSync(filePath).isDirectory()) {
        compileFolderRecursively(filePath, globalCount, successGlobalCount)
      }
    })
  } catch (err) {
    console.error(err)
    logger(`${globalCount} files have been compiled.`, true)
  }
}

/**
 * File compression.
 *
 * @param {string} filename
 * @param {string} outputDir
 * @param {any} callback
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
 * @param {boolean} enable
 * @return {Function} logger function
 */
function loggerInit(enable) {
  return (message, force) => (enable || force) && console.log(message)
}
