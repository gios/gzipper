const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')

const Gzipper = require('../../src/Gzipper')
const { COMPRESS_PATH, getFiles, clear } = require('../utils')

describe('Gzipper -> Gzip compression', () => {
  beforeEach(async () => {
    await clear(COMPRESS_PATH, ['.gz', '.br'])
  })

  it('--gzip-level, --gzip-memory-level, --gzip-strategy should change gzip configuration', async () => {
    const options = { gzipLevel: 6, gzipMemoryLevel: 4, gzipStrategy: 2 }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.gz'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      3
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 3)
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions.gzipLevel,
      6
    )
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions.gzipMemoryLevel,
      4
    )
    assert.strictEqual(
      gzipper.compressionInstance.compressionOptions.gzipStrategy,
      2
    )
  })

  afterEach(async () => {
    await clear(COMPRESS_PATH, ['.gz', '.br'])
  })
})
