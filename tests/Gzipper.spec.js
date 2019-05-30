const assert = require('assert')
const sinon = require('sinon')
const zlib = require('zlib')
const path = require('path')

const Gzipper = require('../src/Gzipper')
const { VALID_EXTENSIONS } = require('../src/constants')
const {
  EMPTY_FOLDER_PATH,
  COMPRESS_PATH,
  NO_FILES_COMPRESS_PATH,
  COMPRESS_PATH_TARGET,
  getFiles,
  createFolder,
  clear,
  getPrivateSymbol,
} = require('./utils')

describe('Gzipper', () => {
  beforeEach(async () => {
    await createFolder(EMPTY_FOLDER_PATH)
    await createFolder(COMPRESS_PATH_TARGET)
    await clear(COMPRESS_PATH, ['.gz', '.br'])
  })

  it('should throw an error if no path found', () => {
    try {
      new Gzipper(null, null)
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.strictEqual(err.message, `Can't find a path.`)
    }
  })

  it('should throw on compress error', async () => {
    const gzipper = new Gzipper(COMPRESS_PATH, null)
    const compileFolderRecursivelySpy = sinon.spy(
      gzipper,
      getPrivateSymbol(gzipper, 'compileFolderRecursively')
    )
    const errorSpy = sinon.spy(gzipper.logger, 'error')
    sinon
      .stub(gzipper, getPrivateSymbol(gzipper, 'compressFile'))
      .rejects('UNKNOWN_ERROR', 'Compressing error.')

    try {
      await gzipper.compress()
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.strictEqual(err.message, 'Compressing error.')
      assert.ok(compileFolderRecursivelySpy.calledWithExactly(COMPRESS_PATH))
      assert.ok(
        errorSpy.calledOnceWithExactly(sinon.match.instanceOf(Error), true)
      )
    }
  })

  it('should print message about appropriate files', async () => {
    const gzipper = new Gzipper(NO_FILES_COMPRESS_PATH, null)
    const noFilesWarnSpy = sinon.spy(gzipper.logger, 'warn')
    await gzipper.compress()
    const responseMessage = `we couldn't find any appropriate files. valid extensions are: ${VALID_EXTENSIONS.join(
      ', '
    )}`

    assert.ok(noFilesWarnSpy.calledWithExactly(responseMessage, true))
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 0)
  })

  it('should print message about empty folder', async () => {
    const gzipper = new Gzipper(EMPTY_FOLDER_PATH, null)
    const noFilesWarnSpy = sinon.spy(gzipper.logger, 'warn')
    await gzipper.compress()
    const responseMessage = `we couldn't find any appropriate files. valid extensions are: ${VALID_EXTENSIONS.join(
      ', '
    )}`

    assert.ok(noFilesWarnSpy.calledWithExactly(responseMessage, true))
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 0)
  })

  it('--verbose should print logs to console and use default configuration', async () => {
    const options = { verbose: true }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.gz'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.strictEqual(loggerInfoSpy.callCount, files.length + 1)
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 1)
  })

  it('should compress files to a certain folder with existing folder structure', async () => {
    const gzipper = new Gzipper(COMPRESS_PATH, COMPRESS_PATH_TARGET)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH)
    const compressedFiles = await getFiles(COMPRESS_PATH_TARGET, ['.gz'])

    const filesRelative = files.map(file => path.relative(COMPRESS_PATH, file))
    const compressedRelative = compressedFiles.map(file =>
      path.relative(COMPRESS_PATH_TARGET, file)
    )

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.strictEqual(files.length, compressedFiles.length)
    for (const file of filesRelative) {
      assert.ok(
        compressedRelative.some(compressedFile => {
          const withoutExtFile = compressedFile.replace(
            path.basename(compressedFile),
            path.parse(path.basename(compressedFile)).name
          )
          return withoutExtFile === file
        })
      )
    }
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 0)
  })

  it('getOutputPath should returns correct file path', () => {
    const gzipper = new Gzipper(COMPRESS_PATH, null)
    const target = '/the/elder/scrolls/'
    const file = 'skyrim.js'

    let outputFilePath = gzipper[getPrivateSymbol(gzipper, 'getOutputPath')](
      target,
      file
    )
    assert.strictEqual(
      outputFilePath,
      '/the/elder/scrolls/skyrim.js.gz'.split('/').join(path.sep)
    )

    gzipper.options.outputFileFormat = 'test[filename].[compressExt].[ext]'
    outputFilePath = gzipper[getPrivateSymbol(gzipper, 'getOutputPath')](
      target,
      file
    )
    assert.strictEqual(
      outputFilePath,
      '/the/elder/scrolls/testskyrim.gz.js'.split('/').join(path.sep)
    )

    gzipper.options.outputFileFormat = '[filename]-test.[compressExt]'
    outputFilePath = gzipper[getPrivateSymbol(gzipper, 'getOutputPath')](
      target,
      file
    )
    assert.strictEqual(
      outputFilePath,
      '/the/elder/scrolls/skyrim-test.gz'.split('/').join(path.sep)
    )

    gzipper.options.outputFileFormat =
      '[filename]-[hash]-[filename]-test.[compressExt].[ext]'
    outputFilePath = gzipper[getPrivateSymbol(gzipper, 'getOutputPath')](
      target,
      file
    )
    const [hash] = /(?<=skyrim-)(.*)(?=-skyrim)/.exec(outputFilePath)
    assert.strictEqual(
      outputFilePath,
      `/the/elder/scrolls/skyrim-${hash}-skyrim-test.gz.js`
        .split('/')
        .join(path.sep)
    )
  })

  it('should use default file format artifacts via --output-file-format and print to console via --verbose flag', async () => {
    const options = { verbose: true }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
    const getOutputPathSpy = sinon.spy(
      gzipper,
      getPrivateSymbol(gzipper, 'getOutputPath')
    )
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.gz'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(
      loggerInfoSpy.calledWithExactly(
        `Use default output file format [filename].[ext].[compressExt]`
      )
    )
    assert.strictEqual(loggerInfoSpy.callCount, files.length + 1)
    assert.strictEqual(getOutputPathSpy.callCount, files.length)
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 1)
    assert.strictEqual(gzipper.options.outputFileFormat, undefined)

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index)
      const [fullPath, filename] = call.args
      assert.strictEqual(
        call.returnValue,
        path.join(fullPath, `${filename}.${gzipper.compressionInstance.ext}`)
      )
    }
  })

  async function validateOutputFileFormat(options, outputFileFormat) {
    const gzipper = new Gzipper(COMPRESS_PATH, COMPRESS_PATH_TARGET, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
    const getOutputPathSpy = sinon.spy(
      gzipper,
      getPrivateSymbol(gzipper, 'getOutputPath')
    )
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH_TARGET)

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.ok(
      loggerInfoSpy.neverCalledWithMatch(
        `Use default output file format [filename].[ext].[compressExt]`
      )
    )
    assert.strictEqual(getOutputPathSpy.callCount, files.length)
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 2)
    assert.strictEqual(gzipper.options.outputFileFormat, outputFileFormat)

    return [gzipper, getOutputPathSpy]
  }

  it('should set custom file format artifacts (test-[filename]-55-[filename].[compressExt]x.[ext]) via --output-file-format', async () => {
    const options = {
      outputFileFormat: 'test-[filename]-55-[filename].[compressExt]x.[ext]',
      verbose: true,
    }

    const [gzipper, getOutputPathSpy] = await validateOutputFileFormat(
      options,
      options.outputFileFormat
    )

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index)
      const [fullPath, file] = call.args
      const filename = path.parse(file).name
      const ext = path.extname(file).slice(1)
      assert.strictEqual(
        call.returnValue,
        path.join(
          fullPath,
          `test-${filename}-55-${filename}.${
            gzipper.compressionInstance.ext
          }x.${ext}`
        )
      )
    }
  })

  it('should set custom file format artifacts ([filename]-[hash]-55.[ext]) via --output-file-format', async () => {
    const options = {
      outputFileFormat: '[filename]-[hash]-55.[ext]',
      verbose: true,
    }

    const [, getOutputPathSpy] = await validateOutputFileFormat(
      options,
      options.outputFileFormat
    )

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index)
      const [fullPath, file] = call.args
      const filename = path.parse(file).name
      const ext = path.extname(file).slice(1)
      const [hash] = new RegExp(`(?<=${filename}-)(.*)(?=-55)`, 'g').exec(
        call.returnValue
      )
      assert.strictEqual(
        call.returnValue,
        path.join(fullPath, `${filename}-${hash}-55.${ext}`)
      )
    }
  })

  it('should exclude file extensions from compression jpeg,jpg', async () => {
    const options = {
      exclude: 'jpeg,jpg',
      verbose: true,
    }
    const EXCLUDED_FILES_COUNT = 2
    const beforeFiles = await getFiles(COMPRESS_PATH)
    const gzipper = new Gzipper(COMPRESS_PATH, null, options)
    const loggerSuccessSpy = sinon.spy(gzipper.logger, 'success')
    const loggerInfoSpy = sinon.spy(gzipper.logger, 'info')
    await gzipper.compress()
    const files = await getFiles(COMPRESS_PATH, ['.gz'])

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true
      )
    )
    assert.strictEqual(
      loggerInfoSpy.callCount,
      beforeFiles.length - EXCLUDED_FILES_COUNT + 1
    )
    assert.ok(gzipper.createCompression() instanceof zlib.Gzip)
    assert.strictEqual(gzipper.compressionInstance.ext, 'gz')
    assert.strictEqual(
      Object.keys(gzipper.compressionInstance.compressionOptions).length,
      0
    )
    assert.strictEqual(Object.keys(gzipper.options).length, 2)
  })

  afterEach(async () => {
    await clear(EMPTY_FOLDER_PATH, true)
    await clear(COMPRESS_PATH_TARGET, true)
    await clear(COMPRESS_PATH, ['.gz', '.br'])
  })
})
