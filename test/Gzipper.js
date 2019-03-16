const assert = require('assert')
const fs = require('fs')
const path = require('path')

const Gzipper = require('../Gzipper')

const RESOURCES_PATH = path.resolve(__dirname, './resources')

describe('Gzipper', () => {
  describe('verbose', () => {
    beforeEach(() => clearDirectory())

    it('should print logs to console about every file', () => {
      const options = { verbose: true }
      new Gzipper(RESOURCES_PATH, null, options).compress()
      this.timeout(100)
      assert.equal()
    })
  })
})

function clearDirectory() {
  try {
    const files = fs.readdirSync(RESOURCES_PATH)

    for (const file of files) {
      const filePath = path.resolve(RESOURCES_PATH, file)

      if (fs.lstatSync(filePath).isFile()) {
        fs.unlink(path.join(RESOURCES_PATH, filePath), err => {
          if (err) throw err
        })
      }
    }
  } catch (err) {
    console.error(err)
  }
}
