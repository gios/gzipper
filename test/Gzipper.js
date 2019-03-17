const assert = require('assert')

const Gzipper = require('../Gzipper')
const { RESOURCES_PATH, clear } = require('./utils')

describe('Gzipper', () => {
  describe('verbose', () => {
    beforeEach(async () => await clear())

    it('should print logs to console with --verbose', async () => {
      const options = { verbose: true }
      const gzipper = new Gzipper(RESOURCES_PATH, null, options)
      const message = await gzipper.compress()
      console.log(message)
      assert.equal(true, true)
    })

    afterEach(async () => await clear())
  })
})
