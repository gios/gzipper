const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')

const Gzipper = require('../Gzipper')
const {
  COMPRESS_PATH,
  NO_FILES_COMPRESS_PATH,
  COMPRESS_TARGET_PATH,
  createFolderInResources,
  clear,
  getPrivateSymbol,
} = require('./utils')

const FILES_COUNT = 6
const VERBOSE_REGEXP = /File [^\s]+ has been compressed [^\s]+Kb -> [^\s]+Kb./
const MESSAGE_REGEXP = /[^\s]+ files have been compressed./

describe('Gzipper', () => {
  beforeEach(async () => {
    await clear()
    await clear(COMPRESS_TARGET_PATH)
  })

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
      compressEventSpy.calledOnceWith('compress-empty', responseMessage)
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 0)
    assert.strictEqual(Object.keys(gzipper.options).length, 0)
  })

  it('should print message about empty folder', async () => {
    const emptyFolderPath = await createFolderInResources('empty_folder')
    const gzipper = new Gzipper(emptyFolderPath, null)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()
    const responseMessage = `we couldn't find any appropriate files (.css, .js).`

    assert.ok(message === responseMessage)
    assert.ok(compressEventSpy.calledOnce)
    assert.ok(
      compressEventSpy.calledOnceWith('compress-empty', responseMessage)
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
    assert.ok(
      compressEventSpy.withArgs(
        'compress',
        `${FILES_COUNT} files have been compressed.`
      ).calledOnce
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

  it('--gzip-level, --gzip-memory-level, --gzip-strategy should change gzip configuration', async () => {
    const options = { gzipLevel: 6, gzipMemoryLevel: 4, gzipStrategy: 2 }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.ok(
      compressEventSpy.withArgs(
        'compress',
        `${FILES_COUNT} files have been compressed.`
      ).calledOnce
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 3)
    assert.strictEqual(Object.keys(gzipper.options).length, 3)
    assert.strictEqual(gzipper.compressionOptions.gzipLevel, 6)
    assert.strictEqual(gzipper.compressionOptions.gzipMemoryLevel, 4)
    assert.strictEqual(gzipper.compressionOptions.gzipStrategy, 2)
  })

  it('--brotli should emit compress-error on compress error', () => {
    const createBrotliCompress =
      zlib.createBrotliCompress && zlib.createBrotliCompress.bind({})
    try {
      delete zlib.createBrotliCompress
      new Gzipper(COMPRESS_PATH, null, { brotli: true })
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.strictEqual(
        err.message,
        `Can't use brotli compression, Node.js >= v11.7.0 required.`
      )
    }
    zlib.createBrotliCompress = createBrotliCompress
  })

  it('--brotli-param-mode, --brotli-quality, --brotli-size-hint should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'text',
      brotliQuality: 10,
      brotliSizeHint: 5,
    }
    if (zlib.createBrotliCompress !== 'function') {
      return
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.ok(
      compressEventSpy.withArgs(
        'compress',
        `${FILES_COUNT} files have been compressed.`
      ).calledOnce
    )
    assert.ok(gzipper.createCompression() instanceof zlib.BrotliCompress)
    assert.strictEqual(gzipper.compressionType.name, 'BROTLI')
    assert.strictEqual(gzipper.compressionType.ext, 'br')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 3)
    assert.strictEqual(Object.keys(gzipper.options).length, 4)
    assert.strictEqual(
      gzipper.compressionOptions[zlib.constants.BROTLI_PARAM_MODE],
      zlib.constants.BROTLI_MODE_TEXT
    )
    assert.strictEqual(
      gzipper.compressionOptions[zlib.constants.BROTLI_PARAM_QUALITY],
      10
    )
    assert.strictEqual(
      gzipper.compressionOptions[zlib.constants.BROTLI_PARAM_SIZE_HINT],
      5
    )
  })

  it('should compress files to a certain folder with existing folder structure', async () => {
    // TODO: Write more efficient tests
    const gzipper = new Gzipper(COMPRESS_PATH, COMPRESS_TARGET_PATH)
    const compressEventSpy = sinon.spy(gzipper.compressEvent, 'emit')
    const message = await gzipper.compress()

    assert.ok(MESSAGE_REGEXP.test(message))
    assert.ok(
      compressEventSpy.withArgs(
        'compress',
        `${FILES_COUNT} files have been compressed.`
      ).calledOnce
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionType.name, 'GZIP')
    assert.strictEqual(gzipper.compressionType.ext, 'gz')
    assert.strictEqual(Object.keys(gzipper.compressionOptions).length, 0)
    assert.strictEqual(Object.keys(gzipper.options).length, 0)
  })

  afterEach(async () => {
    await clear()
    await clear(COMPRESS_TARGET_PATH)
  })
})
