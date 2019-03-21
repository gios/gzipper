const { extname, resolve } = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const { promisify } = require('util')

const compressionExtensions = ['.gz', '.br']
const unlink = promisify(fs.unlink)
const mkdir = promisify(fs.mkdir)
const exists = promisify(fs.exists)
const COMPRESS_PATH = resolve(__dirname, './resources/folder_to_compress')
const NO_FILES_COMPRESS_PATH = resolve(
  __dirname,
  './resources/no_file_to_compress'
)

async function clearDirectory(
  target = COMPRESS_PATH,
  pending = [],
  clearEvent
) {
  try {
    const files = fs.readdirSync(target)
    pending.push(...files)

    for (const file of files) {
      const filePath = resolve(target, file)
      const isFile = fs.lstatSync(filePath).isFile()
      const isDirectory = fs.lstatSync(filePath).isDirectory()

      if (isFile) {
        if (compressionExtensions.includes(extname(filePath))) {
          await unlink(resolve(target, filePath))
        }
        pending.pop()

        if (!pending.length) {
          clearEvent.emit('clear')
          return
        }
      } else if (isDirectory) {
        pending.pop()
        clearDirectory(filePath, pending, clearEvent)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

function clear(directory) {
  const clearEvent = new EventEmitter()
  return new Promise(async resolve => {
    clearEvent.once('clear', () => {
      resolve()
    })
    await clearDirectory(directory, [], clearEvent)
  })
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

exports.COMPRESS_PATH = COMPRESS_PATH
exports.NO_FILES_COMPRESS_PATH = NO_FILES_COMPRESS_PATH
exports.clearDirectory = clearDirectory
exports.clear = clear
exports.getPrivateSymbol = getPrivateSymbol
exports.createFolderInResources = createFolderInResources
