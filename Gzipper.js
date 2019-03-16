const zlib = require('zlib')
const fs = require('fs')
const { resolve, extname, join, relative, sep } = require('path')
const { promisify } = require('util')

const Logger = require('./Logger')

const compileFolderRecursively = Symbol('compileFolderRecursively')
const compressFile = Symbol('compressFile')
const compressionTypeLog = Symbol('compressionTypeLog')
const selectCompression = Symbol('selectCompression')
const getCompressionType = Symbol('getCompressionType')
const createFolders = Symbol('createFolders')

const stat = promisify(fs.stat)

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
    if (!target) {
      throw new Error(`Can't find a path.`)
    }
    this.options = options
    this.logger = new Logger(this.options.verbose)
    if (outputPath) {
      this.outputPath = resolve(process.cwd(), outputPath)
    }
    this.target = resolve(process.cwd(), target)
    const [createCompression, compressionOptions] = this[selectCompression]()
    this.createCompression = createCompression
    this.compressionOptions = compressionOptions
    this.compressionType = this[getCompressionType]()
  }

  /**
   * Compile files in folder recursively.
   *
   * @param {string} target path to target directory
   * @param {number} [globalCount=0] global files count
   * @param {number} [successGlobalCount=0] success files count
   * @memberof Gzipper
   */
  async [compileFolderRecursively](target, pending = [], files = []) {
    try {
      const filesList = fs.readdirSync(target)

      for (const file of filesList) {
        const filePath = resolve(target, file)
        const isFile = fs.lstatSync(filePath).isFile()
        const isDirectory = fs.lstatSync(filePath).isDirectory()

        if (
          isFile &&
          (extname(filePath) === '.js' || extname(filePath) === '.css')
        ) {
          files.push(file)
          pending.push(file)
          const fileInfo = await this[compressFile](
            file,
            target,
            this.outputPath
          )

          pending.pop()

          if (fileInfo) {
            this.logger.info(
              `File ${file} has been compressed ${fileInfo.beforeSize}Kb -> ${
                fileInfo.afterSize
              }Kb.`
            )
          }

          if (!pending.length) {
            this.logger.success(
              `${files.length} ${
                files.length > 1 ? 'files have' : 'file has'
              } been compressed.`,
              true
            )
            return
          }
        } else if (isDirectory) {
          this[compileFolderRecursively](filePath, pending, files)
        }
      }
    } catch (err) {
      this.logger.error(err, true)
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
    const inputPath = join(target, filename)
    if (outputDir) {
      target = join(outputDir, relative(this.target, target))
      this[createFolders](target)
    }
    const outputPath = `${join(target, filename)}.${this.compressionType.ext}`
    const input = fs.createReadStream(inputPath)
    const output = fs.createWriteStream(outputPath)

    input.pipe(this.createCompression()).pipe(output)

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
    if (this.outputPath) {
      this[createFolders](this.outputPath)
    }
    this[compressionTypeLog]()
    await this[compileFolderRecursively](this.target)
  }

  /**
   * Show message with compression params.
   *
   * @memberof Gzipper
   */
  [compressionTypeLog]() {
    let options = ''

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${key}: ${value}, `
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
      throw new Error(
        `Can't use brotli compression, Node.js >= v11.7.0 required.`
      )
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
  [createFolders](target) {
    target = resolve(process.cwd(), target)
    const folders = target.split(sep)
    let prev = folders.shift()

    for (const folder of folders) {
      const folderPath = join(prev, folder)
      const isExists = fs.existsSync(folderPath)

      if (!isExists) {
        fs.mkdirSync(folderPath)
      }
      prev = folderPath
    }
  }
}

module.exports = Gzipper
