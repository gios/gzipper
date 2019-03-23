const { extname, resolve, basename } = require('path')
const fs = require('fs')
const { promisify } = require('util')

const compressionExtensions = ['.gz', '.br']
const unlink = promisify(fs.unlink)
const mkdir = promisify(fs.mkdir)
const exists = promisify(fs.exists)
const COMPRESS_PATH = resolve(__dirname, './resources/folder_to_compress')
const NO_FILES_COMPRESS_PATH = resolve(
  __dirname,
  './resources/no_files_to_compress'
)

async function clearDirectory(target = COMPRESS_PATH) {
  try {
    const filesCount = []
    const filesList = fs.readdirSync(target)

    for (const file of filesList) {
      const filePath = resolve(target, file)
      const isFile = fs.lstatSync(filePath).isFile()
      const isDirectory = fs.lstatSync(filePath).isDirectory()

      if (isDirectory) {
        filesCount.push(...(await clearDirectory(filePath)))
      } else if (isFile) {
        try {
          if (compressionExtensions.includes(extname(filePath))) {
            filesCount.push(file)
            await unlink(resolve(target, filePath))
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
  const path = resolve(__dirname, `./resources/${name}`)
  const isExists = await exists(path)
  if (!isExists) {
    await mkdir(path)
  }
  return path
}

function dirTree(target) {
  const stats = fs.lstatSync(target)
  const info = {
    path: target,
    name: basename(target),
  }

  if (stats.isDirectory()) {
    info.type = 'folder'
    info.children = fs.readdirSync(target).map(function(child) {
      return dirTree(target + '/' + child)
    })
  } else {
    info.type = 'file'
  }

  return info
}

function getFolderStructure(target) {
  return dirTree(target)
}

exports.COMPRESS_PATH = COMPRESS_PATH
exports.NO_FILES_COMPRESS_PATH = NO_FILES_COMPRESS_PATH
exports.clearDirectory = clearDirectory
exports.clear = clear
exports.getPrivateSymbol = getPrivateSymbol
exports.createFolderInResources = createFolderInResources
exports.getFolderStructure = getFolderStructure
