const assert = require('assert')
const sinon = require('sinon')

const Gzipper = require('../Gzipper')
const { RESOURCES_PATH, clear } = require('./utils')

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
      assert.strictEqual(loggerInfoSpy.callCount, 6)
      for (const [arg] of loggerInfoSpy.args) {
        assert.ok(verboseRegExp.test(arg))
      }
    })

    afterEach(async () => await clear())
  })
})
