const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')

const Gzipper = require('../Gzipper')
const { RESOURCES_PATH, clear } = require('./utils')

const FILES_COUNT = 6
const VERBOSE_REGEXP = /File [^\s]+ has been compressed [^\s]+Kb -> [^\s]+Kb./
const MESSAGE_REGEXP = /[^\s]+ files have been compressed./

describe('Gzipper', () => {
  beforeEach(async () => await clear())

  it('should throw error if no path found', async () => {
    try {
      new Gzipper(null, null)
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.strictEqual(err.message, `Can't find a path.`)
    }
  })

  it('--verbose should print logs to console with and use default configuration', async () => {
    const options = { verbose: true }
    const gzipper = new Gzipper(RESOURCES_PATH, null, options)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.strictEqual(compressEventSpy.callCount, 1)
    assert.strictEqual(loggerInfoSpy.callCount, FILES_COUNT)
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 0)
    assert.strictEqual(Object.keys(gzipper.options).length, 1)
    for (const [arg] of loggerInfoSpy.args) {
      assert.ok(VERBOSE_REGEXP.test(arg))
    }
  })

  it('--gzip-level should change gzip level for gzip compression', async () => {
    const options = { gzipLevel: 6 }
    const gzipper = new Gzipper(RESOURCES_PATH, null, options)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.strictEqual(compressEventSpy.callCount, 1)
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 1)
    assert.strictEqual(Object.keys(gzipper.options).length, 1)
    assert.strictEqual(gzipper.compressionOptions.gzipLevel, 6)
  })

  afterEach(async () => await clear())
})
