#!/usr/bin/env node
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const distFolder = process.argv[2]
const logLevel = process.argv[3]
let logger = logLevel === '--log' ? loggerInit(true) : loggerInit(false)

if (!distFolder) {
  throw new Error('Path should be present.')
}

let globalFilesCount = 0
let successGlobalFilesCount = 0
const outputDir = path.resolve(process.cwd(), distFolder)
compileFolderRecursively(outputDir)

/**
 * Compile files in folders recursively.
 *
 * @param {string} outputDir
 * @param {number} fileCounter
 */
function compileFolderRecursively(outputDir) {
  const filesList = fs.readdirSync(outputDir)

  try {
    filesList.forEach(file => {
      const fullFilePath = path.resolve(outputDir, file)

      if (
        fs.lstatSync(fullFilePath).isFile() &&
        (path.extname(fullFilePath) === '.js' ||
          path.extname(fullFilePath) === '.css')
      ) {
        ++globalFilesCount

        compressFile(file, outputDir, () => {
          ++successGlobalFilesCount
          logger(`File ${file} has been compiled.`)

          if (globalFilesCount === successGlobalFilesCount) {
            logger(`${globalFilesCount} files have been compiled.`, true)
          }
        })
      } else if (fs.lstatSync(fullFilePath).isDirectory()) {
        compileFolderRecursively(fullFilePath)
      }
    })
  } catch (err) {
    console.error(err)
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
  let output = fs.createWriteStream(path.join(outputDir, filename) + '.gz')

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
