const { extname, resolve } = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const { promisify } = require('util')

const compressionExtensions = ['.gz', '.br']
const clearEvent = new EventEmitter()
const unlink = promisify(fs.unlink)
const RESOURCES_PATH = resolve(__dirname, './resources')

async function clearDirectory(target = RESOURCES_PATH, pending = []) {
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

exports.RESOURCES_PATH = RESOURCES_PATH
exports.clearDirectory = clearDirectory
exports.clear = clear
exports.getPrivateSymbol = getPrivateSymbol
