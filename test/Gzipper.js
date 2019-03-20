const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')

const Gzipper = require('../Gzipper')
const {
  COMPRESS_PATH,
  NO_FILES_COMPRESS_PATH,
  clear,
  getPrivateSymbol,
} = require('./utils')

const FILES_COUNT = 6
const VERBOSE_REGEXP = /File [^\s]+ has been compressed [^\s]+Kb -> [^\s]+Kb./
const MESSAGE_REGEXP = /[^\s]+ files have been compressed./

describe('Gzipper', () => {
  beforeEach(async () => await clear())

  it('should throw an error if no path found', () => {
    try {
      new Gzipper(null, null)
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.strictEqual(err.message, `Can't find a path.`)
    }
  })

  it('should emit compress-error on compress error', async () => {
    const gzipper = new Gzipper(COMPRESS_PATH, null)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    sinon
      .stub(gzipper, getPrivateSymbol(gzipper, 'compressFile'))
      .rejects('UNKNOWN_ERROR', 'Compressing error.')

    try {
      await gzipper.compress()
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.strictEqual(err.message, 'Compressing error.')
      assert.ok(compressEventSpy.alwaysCalledWith('compress-error'))
    }
  })

  it('should print message about appropriate files', async () => {
    const gzipper = new Gzipper(NO_FILES_COMPRESS_PATH, null)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()
    const responseMessage = `we couldn't find any appropriate files (.css, .js).`

    assert.ok(message === responseMessage)
    assert.ok(compressEventSpy.calledOnce)
    assert.ok(
      compressEventSpy.calledOnceWith('compress', responseMessage, 'warn')
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 0)
    assert.strictEqual(Object.keys(gzipper.options).length, 0)
  })

  it('--verbose should print logs to console with and use default configuration', async () => {
    const options = { verbose: true }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.ok(compressEventSpy.calledOnce)
    assert.ok(
      compressEventSpy.calledOnceWith(
        'compress',
        `${FILES_COUNT} files have been compressed.`,
        'success'
      )
    )
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
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.ok(compressEventSpy.calledOnce)
    assert.ok(
      compressEventSpy.calledOnceWith(
        'compress',
        `${FILES_COUNT} files have been compressed.`,
        'success'
      )
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 1)
    assert.strictEqual(Object.keys(gzipper.options).length, 1)
    assert.strictEqual(gzipper.compressionOptions.gzipLevel, 6)
  })

  afterEach(async () => await clear())
})
