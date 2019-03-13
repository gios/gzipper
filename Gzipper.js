const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const Logger = require('./Logger')

const compileFolderRecursively = Symbol('compileFolderRecursively')
const compressFile = Symbol('compressFile')
const compressionTypeLog = Symbol('compressionTypeLog')
const selectCompressionType = Symbol('selectCompressionType')

/**
 * Gzipping files.
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
      this.outputPath = path.resolve(process.cwd(), outputPath)
      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true })
      }
    }
    this.target = path.resolve(process.cwd(), target)
    this[selectCompressionType]()
    this[compressionTypeLog]()
  }

  /**
   * Compile files in folder recursively.
   *
   * @param {string} target path to target directory
   * @param {number} [globalCount=0] global files count
   * @param {number} [successGlobalCount=0] success files count
   * @memberof Gzipper
   */
  [compileFolderRecursively](target, pending = [], files = []) {
    try {
      const filesList = fs.readdirSync(target)

      filesList.forEach(file => {
        const filePath = path.resolve(target, file)

        if (
          fs.lstatSync(filePath).isFile() &&
          (path.extname(filePath) === '.js' ||
            path.extname(filePath) === '.css')
        ) {
          files.push(file)
          pending.push(file)
          this[compressFile](
            file,
            target,
            this.outputPath,
            (beforeSize, afterSize) => {
              pending.pop()
              this.logger.info(
                `File ${file} has been compressed ${beforeSize}Kb -> ${afterSize}Kb.`
              )

              if (!pending.length) {
                this.logger.success(
                  `${files.length} ${
                    files.length > 1 ? 'files have' : 'file has'
                  } been compressed.`,
                  true
                )
              }
            }
          )
        } else if (fs.lstatSync(filePath).isDirectory()) {
          this[compileFolderRecursively](filePath, pending, files)
        }
      })
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
   * @param {() => void} callback finish callback
   * @memberof Gzipper
   */
  [compressFile](filename, target, outputDir, callback) {
    const inputPath = path.join(target, filename)
    const outputPath = `${path.join(outputDir || target, filename)}.gz`
    const input = fs.createReadStream(inputPath)
    const output = fs.createWriteStream(outputPath)

    input.pipe(this.compressionType).pipe(output)

    if (callback) {
      output.on('finish', () =>
        callback(
          fs.statSync(inputPath).size / 1024,
          fs.statSync(outputPath).size / 1024
        )
      )
      output.on('error', error => this.logger.error(error, true))
    }
  }

  /**
   * Start compressing files.
   *
   * @memberof Gzipper
   */
  compress() {
    this[compileFolderRecursively](this.target)
  }

  /**
   * Show message with compression params.
   *
   * @memberof Gzipper
   */
  [compressionTypeLog]() {
    let compressionType,
      optionsStr = '',
      options = new Map([['level', '_level'], ['strategy', '_strategy']])

    if (this.compressionType instanceof zlib.Gzip) {
      compressionType = 'GZIP'
    } else if (this.compressionType instanceof zlib.Brotli) {
      compressionType = 'BROTLI'
    }

    for (const [key, value] of options) {
      optionsStr += `${key}: ${this.compressionType[value]}, `
    }

    this.logger.warn(`${compressionType} -> ${optionsStr.slice(0, -2)}`, true)
  }

  /**
   * Select compression type.
   *
   * @memberof Gzipper
   */
  [selectCompressionType]() {
    const gzipOptions = {}

    if (this.options.gzipLevel !== undefined) {
      gzipOptions.gzipLevel = this.options.gzipLevel
    }

    if (this.options.gzipMemoryLevel !== undefined) {
      gzipOptions.gzipMemoryLevel = this.options.gzipMemoryLevel
    }

    if (this.options.gzipStrategy !== undefined) {
      gzipOptions.gzipStrategy = this.options.gzipStrategy
    }

    this.compressionType = zlib.createGzip(gzipOptions)

    if (
      typeof zlib.createBrotliCompress === 'function' &&
      this.options.brotli
    ) {
      const brotliOptions = {}

      if (this.options.brotliParamMode !== undefined) {
        switch (this.options.brotliParamMode) {
          case 'default':
            brotliOptions[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_GENERIC
            break

          case 'text':
            brotliOptions[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_TEXT
            break

          case 'font':
            brotliOptions[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_FONT
            break

          default:
            brotliOptions[zlib.constants.BROTLI_PARAM_MODE] =
              zlib.constants.BROTLI_MODE_GENERIC
            break
        }
      }

      if (this.options.brotliQuality !== undefined) {
        brotliOptions[
          zlib.constants.BROTLI_PARAM_QUALITY
        ] = this.options.brotliQuality
      }

      if (this.options.brotliSizeHint !== undefined) {
        brotliOptions[
          zlib.constants.BROTLI_PARAM_SIZE_HINT
        ] = this.options.brotliSizeHint
      }

      this.compressionType = zlib.createBrotliCompress({
        params: brotliOptions,
      })
    } else {
      throw new Error(
        `Can't use brotli compression, Node.js >= v11.7.0 required.`
      )
    }
  }
}

module.exports = Gzipper
