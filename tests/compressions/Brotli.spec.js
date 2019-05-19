const { disableBrotli } = require('../../helpers')
const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')

const Gzipper = require('../../src/Gzipper')
const {
  COMPRESS_PATH,
  EMPTY_FOLDER_PATH,
  COMPRESS_PATH_TARGET,
  getFiles,
  createFolder,
  clear,
} = require('../utils')

const describeTest = disableBrotli ? describe.skip : describe

describeTest('Gzipper -> Brotli compression', () => {
  beforeEach(async () => {
    await createFolder(EMPTY_FOLDER_PATH)
    await createFolder(COMPRESS_PATH_TARGET)
    await clear(COMPRESS_PATH, ['.gz', '.br'])
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
    if (typeof zlib.createBrotliCompress !== 'function') {
      return
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.br'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(gzipper.createCompression() instanceof zlib.BrotliCompress)
    assert.strictEqual(gzipper.compressionInstance.ext, 'br')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      3
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 4)
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_TEXT
    )
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_QUALITY
      ],
      10
    )
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_SIZE_HINT
      ],
      5
    )
  })

  it('--brotli-param-mode=default should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'default',
    }
    if (typeof zlib.createBrotliCompress !== 'function') {
      return
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.br'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(gzipper.createCompression() instanceof zlib.BrotliCompress)
    assert.strictEqual(gzipper.compressionInstance.ext, 'br')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      1
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 2)
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_GENERIC
    )
  })

  it('wrong value for --brotli-param-mode should change brotli configuration to brotliParamMode=default', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'amigos',
    }
    if (typeof zlib.createBrotliCompress !== 'function') {
      return
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.br'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(gzipper.createCompression() instanceof zlib.BrotliCompress)
    assert.strictEqual(gzipper.compressionInstance.ext, 'br')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      1
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 2)
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_GENERIC
    )
  })

  it('--brotli-param-mode=font should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'font',
    }
    if (typeof zlib.createBrotliCompress !== 'function') {
      return
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.br'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(gzipper.createCompression() instanceof zlib.BrotliCompress)
    assert.strictEqual(gzipper.compressionInstance.ext, 'br')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      1
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 2)
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_FONT
    )
  })

  afterEach(async () => {
    await clear(EMPTY_FOLDER_PATH, true)
    await clear(COMPRESS_PATH_TARGET, true)
    await clear(COMPRESS_PATH, ['.gz', '.br'])
  })
})
