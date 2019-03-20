const { extname, resolve } = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const { promisify } = require('util')

const compressionExtensions = ['.gz', '.br']
const clearEvent = new EventEmitter()
const unlink = promisify(fs.unlink)
const COMPRESS_PATH = resolve(__dirname, './resources/folder_to_compress')
const NO_FILES_COMPRESS_PATH = resolve(
  __dirname,
  './resources/no_file_to_compress'
)

async function clearDirectory(target = COMPRESS_PATH, pending = []) {
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
        clearDirectory(filePath, pending)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

function clear() {
  return new Promise(async resolve => {
    clearEvent.once('clear', () => {
      resolve()
    })
    await clearDirectory()
  })
}

function getPrivateSymbol(instance, method) {
  const symbol = Object.getOwnPropertySymbols(instance.__proto__).find(item => {
    return item.toString() === `Symbol(${method})`
  })

  return symbol
}

exports.COMPRESS_PATH = COMPRESS_PATH
exports.NO_FILES_COMPRESS_PATH = NO_FILES_COMPRESS_PATH
exports.clearDirectory = clearDirectory
exports.clear = clear
exports.getPrivateSymbol = getPrivateSymbol
