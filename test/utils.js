const path = require('path')
const fs = require('fs')
const util = require('util')

const unlink = util.promisify(fs.unlink)
const mkdir = util.promisify(fs.mkdir)
const exists = util.promisify(fs.exists)
const lstat = util.promisify(fs.lstat)
const readdir = util.promisify(fs.readdir)
const rmdir = util.promisify(fs.rmdir)

const EMPTY_FOLDER_PATH = path.resolve(__dirname, './resources/empty_folder')
const COMPRESS_PATH = path.resolve(__dirname, './resources/folder_to_compress')
const COMPRESS_PATH_TARGET = path.resolve(
  __dirname,
  './resources/compress_target'
)
const NO_FILES_COMPRESS_PATH = path.resolve(
  __dirname,
  './resources/no_files_to_compress'
)

async function clearDirectory(target = COMPRESS_PATH, extensions) {
  try {
    const force = typeof extensions === 'boolean' && extensions
    const files = []
    const filesList = await readdir(target)

    for (const file of filesList) {
      const filePath = path.resolve(target, file)
      const isFile = (await lstat(filePath)).isFile()
      const isDirectory = (await lstat(filePath)).isDirectory()

      if (isDirectory) {
        files.push(...(await clearDirectory(filePath, extensions)))
      } else if (isFile) {
        try {
          if (Array.isArray(extensions) && extensions.length) {
            if (extensions.includes(path.extname(filePath))) {
              await unlink(path.resolve(target, filePath))
              files.push(filePath)
            }
          } else if (force) {
            await unlink(path.resolve(target, filePath))
            files.push(filePath)
          }
        } catch (error) {
          throw error
        }
      }
    }
    force && (await rmdir(target))
    return files
  } catch (error) {
    throw error
  }
}

async function clear(directory, extensions) {
  await clearDirectory(directory, extensions)
}

function getPrivateSymbol(instance, method) {
  const symbol = Object.getOwnPropertySymbols(instance.__proto__).find(item => {
    return item.toString() === `Symbol(${method})`
  })

  return symbol
}

async function createFolder(target) {
  const folderPath = path.resolve(__dirname, target)
  const isExists = await exists(folderPath)
  if (!isExists) {
    await mkdir(folderPath)
  }
  return folderPath
}

async function getFiles(target, filterByExtensions = []) {
  try {
    const files = []
    const filesList = await readdir(target)

    for (const file of filesList) {
      const filePath = path.resolve(target, file)
      const isFile = (await lstat(filePath)).isFile()
      const isDirectory = (await lstat(filePath)).isDirectory()

      if (isDirectory) {
        files.push(...(await getFiles(filePath, filterByExtensions)))
      } else if (isFile) {
        if (filterByExtensions.length) {
          filterByExtensions.includes(path.extname(filePath)) &&
            files.push(filePath)
        } else {
          files.push(filePath)
        }
      }
    }
    return files
  } catch (error) {
    throw new Error(error)
  }
}

exports.COMPRESS_PATH_TARGET = COMPRESS_PATH_TARGET
exports.EMPTY_FOLDER_PATH = EMPTY_FOLDER_PATH
exports.COMPRESS_PATH = COMPRESS_PATH
exports.NO_FILES_COMPRESS_PATH = NO_FILES_COMPRESS_PATH
exports.clearDirectory = clearDirectory
exports.clear = clear
exports.getPrivateSymbol = getPrivateSymbol
exports.createFolder = createFolder
exports.getFiles = getFiles
