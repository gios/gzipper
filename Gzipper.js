const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const util = require('util')

const Logger = require('./Logger')

const compileFolderRecursively = Symbol('compileFolderRecursively')
const compressFile = Symbol('compressFile')
const compressionTypeLog = Symbol('compressionTypeLog')
const selectCompression = Symbol('selectCompression')
const getCompressionType = Symbol('getCompressionType')
const createFolders = Symbol('createFolders')
const getBrotliOptionName = Symbol('getBrotliOptionName')
const statExists = Symbol('statExists')

const stat = util.promisify(fs.stat)
const lstat = util.promisify(fs.lstat)
const readdir = util.promisify(fs.readdir)
const mkdir = util.promisify(fs.mkdir)

/**
 * Compressing files.
 *
 * @class Gzipper
 */
class Gzipper {
  /**
   * Creates an instance of Gzipper.
   *
   * @param {string} target path to directory
   * @param {Object} [options={}]
   * @memberof Gzipper
   */
  constructor(target, outputPath, options = {}) {
    this.logger = new Logger(options.verbose)
    if (!target) {
      const message = `Can't find a path.`
      this.logger.error(message, true)
      throw new Error(message)
    }
    this.options = options
    if (outputPath) {
      this.outputPath = path.resolve(process.cwd(), outputPath)
    }
    this.target = path.resolve(process.cwd(), target)
    const [createCompression, compressionOptions] = this[selectCompression]()
    this.createCompression = createCompression
    this.compressionOptions = compressionOptions
    this.compressionType = this[getCompressionType]()
  }

  /**
   * Compile files in folder recursively.
   *
   * @param {string} target path to target directory
   * @memberof Gzipper
   */
  async [compileFolderRecursively](target) {
    try {
      const compressedFiles = []
      const filesList = await readdir(target)

      for (const file of filesList) {
        const filePath = path.resolve(target, file)
        const isFile = (await lstat(filePath)).isFile()
        const isDirectory = (await lstat(filePath)).isDirectory()

        if (isDirectory) {
          compressedFiles.push(
            ...(await this[compileFolderRecursively](filePath))
          )
        } else if (isFile) {
          try {
            if (
              path.extname(filePath) === '.js' ||
              path.extname(filePath) === '.css'
            ) {
              compressedFiles.push(filePath)
              const fileInfo = await this[compressFile](
                file,
                target,
                this.outputPath
              )

              if (fileInfo) {
                this.logger.info(
                  `File ${file} has been compressed ${
                    fileInfo.beforeSize
                  }Kb -> ${fileInfo.afterSize}Kb.`
                )
              }
            }
          } catch (error) {
            throw error
          }
        }
      }
      return compressedFiles
    } catch (error) {
      throw error
    }
  }

  /**
   * File compression.
   *
   * @param {string} filename path to file
   * @param {string} target path to target directory
   * @param {string} outputDir path to output directory (default {target})
   * @returns {Promise<{ beforeSize: number, afterSize: number }>} finish promise
   * @memberof Gzipper
   */
  async [compressFile](filename, target, outputDir) {
    const inputPath = path.join(target, filename)
    if (outputDir) {
      target = path.join(outputDir, path.relative(this.target, target))
      await this[createFolders](target)
    }
    const outputPath = `${path.join(target, filename)}.${
      this.compressionType.ext
    }`
    const input = fs.createReadStream(inputPath)
    const output = fs.createWriteStream(outputPath)

    output.once('open', () => input.pipe(this.createCompression()).pipe(output))

    const compressPromise = new Promise((resolve, reject) => {
      output.once('finish', async () => {
        if (this.options.verbose) {
          const beforeSize = (await stat(inputPath)).size / 1024
          const afterSize = (await stat(outputPath)).size / 1024
          resolve({ beforeSize, afterSize })
        } else {
          resolve()
        }
      })
      output.once('error', error => {
        this.logger.error(error, true)
        reject(error)
      })
    })

    return compressPromise
  }

  /**
   * Start compressing files.
   *
   * @memberof Gzipper
   */
  async compress() {
    let files
    try {
      if (this.outputPath) {
        await this[createFolders](this.outputPath)
      }
      this[compressionTypeLog]()
      files = await this[compileFolderRecursively](this.target)
    } catch (error) {
      this.logger.error(error, true)
      throw new Error(error.message)
    }

    const filesCount = files.length
    if (filesCount) {
      this.logger.success(
        `${filesCount} ${
          filesCount > 1 ? 'files have' : 'file has'
        } been compressed.`,
        true
      )
    } else {
      this.logger.warn(
        `we couldn't find any appropriate files (.css, .js).`,
        true
      )
    }
  }

  /**
   * Show message with compression params.
   *
   * @memberof Gzipper
   */
  [compressionTypeLog]() {
    let options = ''

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      switch (this.compressionType.name) {
        case 'BROTLI':
          options += `${this[getBrotliOptionName](key)}: ${value}, `
          break
        default:
          options += `${key}: ${value}, `
      }
    }

    this.logger.warn(
      `${this.compressionType.name} -> ${options.slice(0, -2)}`,
      true
    )
  }

  /**
   * Select compression type and options.
   *
   * @returns {[() => object, object]} compression instance (Gzip or BrotliCompress) and options
   * @memberof Gzipper
   */
  [selectCompression]() {
    let options = {}

    if (this.options.gzipLevel !== undefined) {
      options.gzipLevel = this.options.gzipLevel
    }

    if (this.options.gzipMemoryLevel !== undefined) {
      options.gzipMemoryLevel = this.options.gzipMemoryLevel
    }

    if (this.options.gzipStrategy !== undefined) {
      options.gzipStrategy = this.options.gzipStrategy
    }

    if (
      this.options.brotli &&
      typeof zlib.createBrotliCompress !== 'function'
    ) {
      const message = `Can't use brotli compression, Node.js >= v11.7.0 required.`
      this.logger.error(message, true)
      throw new Error(message)
    }

    if (this.options.brotli) {
      options = {}

      if (this.options.brotliParamMode !== undefined) {
        switch (this.options.brotliParamMode) {
          case 'default':
            options[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_GENERIC
            break

          case 'text':
            options[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_TEXT
            break

          case 'font':
            options[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_FONT
            break

          default:
            options[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_GENERIC
            break
        }
      }

      if (this.options.brotliQuality !== undefined) {
        options[
          zlib.constants.BROTLI_PARAM_QUALITY
        ] = this.options.brotliQuality
      }

      if (this.options.brotliSizeHint !== undefined) {
        options[
          zlib.constants.BROTLI_PARAM_SIZE_HINT
        ] = this.options.brotliSizeHint
      }
    }

    const createCompression = () => {
      let compression = zlib.createGzip(options)

      if (this.options.brotli) {
        compression = zlib.createBrotliCompress({
          params: options,
        })
      }

      return compression
    }

    return [createCompression, options]
  }

  /**
   * Get compression type and extension.
   *
   * @typedef {Object} CompressionType
   * @property {string} name compression name
   * @property {string} ext compression extension
   *
   * @returns {CompressionType} compression type and extension
   * @memberof Gzipper
   */
  [getCompressionType]() {
    const compression = this.createCompression()
    if (compression instanceof zlib.Gzip) {
      return {
        name: 'GZIP',
        ext: 'gz',
      }
    } else if (compression instanceof zlib.BrotliCompress) {
      return {
        name: 'BROTLI',
        ext: 'br',
      }
    }
  }

  /**
   * Create folders by path.
   *
   * @todo when Node.js >= 8 support will be removed, rewrite this to mkdir(path, { recursive: true })
   *
   * @param {string} target where folders will be created
   * @memberof Gzipper
   */
  async [createFolders](target) {
    const initDir = path.isAbsolute(target) ? path.sep : ''

    await target.split(path.sep).reduce(async (parentDir, childDir) => {
      parentDir = await parentDir
      childDir = await childDir
      const folderPath = path.resolve(parentDir, childDir)
      if (!(await this[statExists](folderPath))) {
        await mkdir(folderPath)
      }
      return folderPath
    }, initDir)
  }

  /**
   * Returns human-readable brotli option name.
   *
   * @param {number} index
   * @returns {string}
   * @memberof Gzipper
   */
  [getBrotliOptionName](index) {
    switch (+index) {
      case zlib.constants.BROTLI_PARAM_MODE:
        return 'brotliParamMode'

      case zlib.constants.BROTLI_PARAM_QUALITY:
        return 'brotliQuality'

      case zlib.constants.BROTLI_PARAM_SIZE_HINT:
        return 'brotliSizeHint'

      default:
        return 'unknown'
    }
  }

  /**
   * Returns if the file or folder exists.
   *
   * @param {string} target
   * @returns {Promise<boolean>}
   * @memberof Gzipper
   */
  [statExists](target) {
    return new Promise(async (resolve, reject) => {
      try {
        await stat(target)
        resolve(true)
      } catch (error) {
        if (error && error.code === 'ENOENT') {
          resolve(false)
        } else {
          reject(error)
        }
      }
    })
  }
}

module.exports = Gzipper
