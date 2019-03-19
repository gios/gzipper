const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')

const Gzipper = require('../Gzipper')
const { RESOURCES_PATH, clear } = require('./utils')

const FILES_COUNT = 6

describe('Gzipper', () => {
  describe('verbose', () => {
    beforeEach(async () => await clear())

    it('should print logs to console with --verbose', async () => {
      const verboseRegExp = /File [^\s]+ has been compressed [^\s]+Kb -> [^\s]+Kb./
      const messageRegExp = /[^\s]+ files have been compressed./
      const options = { verbose: true }
      const gzipper = new Gzipper(RESOURCES_PATH, null, options)
      const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
      const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
      const message = await gzipper.compress()

      assert.ok(messageRegExp.test(message))
      assert.strictEqual(compressEventSpy.callCount, 1)
      assert.strictEqual(loggerInfoSpy.callCount, FILES_COUNT)
      assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
      assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 0)
      assert.strictEqual(gzipper.compressionType.name, 'GZIP')
      assert.strictEqual(gzipper.compressionType.ext, 'gz')
      assert.strictEqual(Object.keys(gzipper.options).length, 1)
      for (const [arg] of loggerInfoSpy.args) {
        assert.ok(verboseRegExp.test(arg))
      }
    })

    afterEach(async () => await clear())
  })
})
