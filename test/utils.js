const path = require('path')
const fs = require('fs')
const util = require('util')

const compressionExtensions = ['.gz', '.br']
const unlink = util.promisify(fs.unlink)
const mkdir = util.promisify(fs.mkdir)
const exists = util.promisify(fs.exists)
const lstat = util.promisify(fs.lstat)
const readdir = util.promisify(fs.readdir)

const COMPRESS_PATH = path.resolve(__dirname, './resources/folder_to_compress')
const NO_FILES_COMPRESS_PATH = path.resolve(
  __dirname,
  './resources/no_files_to_compress'
)

async function clearDirectory(target = COMPRESS_PATH) {
  try {
    const filesCount = []
    const filesList = await readdir(target)

    for (const file of filesList) {
      const filePath = path.resolve(target, file)
      const isFile = (await lstat(filePath)).isFile()
      const isDirectory = (await lstat(filePath)).isDirectory()

      if (isDirectory) {
        filesCount.push(...(await clearDirectory(filePath)))
      } else if (isFile) {
        try {
          if (compressionExtensions.includes(path.extname(filePath))) {
            filesCount.push(file)
            await unlink(path.resolve(target, filePath))
          }
        } catch (error) {
          throw error
        }
      }
    }
    return filesCount
  } catch (error) {
    throw error
  }
}

async function clear(directory) {
  await clearDirectory(directory)
}

function getPrivateSymbol(instance, method) {
  const symbol = Object.getOwnPropertySymbols(instance.__proto__).find(item => {
    return item.toString() === `Symbol(${method})`
  })

  return symbol
}

async function createFolderInResources(name) {
  const folderPath = path.resolve(__dirname, `./resources/${name}`)
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

exports.COMPRESS_PATH = COMPRESS_PATH
exports.NO_FILES_COMPRESS_PATH = NO_FILES_COMPRESS_PATH
exports.clearDirectory = clearDirectory
exports.clear = clear
exports.getPrivateSymbol = getPrivateSymbol
exports.createFolderInResources = createFolderInResources
exports.getFiles = getFiles
