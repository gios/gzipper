const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const Logger = require('./Logger')

const compileFolderRecursively = Symbol('compileFolderRecursively')
const compressFile = Symbol('compressFile')

const DEFAULT_GZIP_LEVEL = -1
const DEFAULT_GZIP_MEMORY_LEVEL = 8
const DEFAULT_GZIP_STRATEGY = 0

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
    this.nativeTarget = target
    this.target = path.resolve(process.cwd(), target)

    this.compressionMechanism = zlib.createGzip({
      level:
        this.options.gzipLevel !== undefined
          ? this.options.gzipLevel
          : DEFAULT_GZIP_LEVEL,
      memLevel:
        this.options.gzipMemoryLevel !== undefined
          ? this.options.gzipMemoryLevel
          : DEFAULT_GZIP_MEMORY_LEVEL,
      strategy:
        this.options.gzipStrategy !== undefined
          ? this.options.gzipStrategy
          : DEFAULT_GZIP_STRATEGY,
    })
    this.selectCompressionMechanismLog()
  }

  /**
   * Compile files in folder recursively.
   *
   * @param {string} target path to target directory
   * @param {number} [globalCount=0] global files count
   * @param {number} [successGlobalCount=0] success files count
   * @memberof Gzipper
   */
  [compileFolderRecursively](target, globalCount = 0, successGlobalCount = 0) {
    const filesList = fs.readdirSync(target)

    try {
      filesList.forEach(file => {
        const filePath = path.resolve(target, file)

        if (
          fs.lstatSync(filePath).isFile() &&
          (path.extname(filePath) === '.js' ||
            path.extname(filePath) === '.css')
        ) {
          ++globalCount

          this[compressFile](
            file,
            target,
            this.outputPath,
            (beforeSize, afterSize) => {
              ++successGlobalCount
              this.logger.info(
                `File ${file} has been compressed ${beforeSize}Kb -> ${afterSize}Kb.`
              )

              if (globalCount === successGlobalCount) {
                this.logger.success(
                  `${globalCount} ${
                    globalCount > 1 ? 'files have' : 'file has'
                  } been compressed from folder ${path.relative(
                    this.nativeTarget,
                    path.dirname(filePath)
                  )}.`,
                  true
                )
              }
            }
          )
        } else if (fs.lstatSync(filePath).isDirectory()) {
          this[compileFolderRecursively](
            filePath,
            globalCount,
            successGlobalCount
          )
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

    input.pipe(this.compressionMechanism).pipe(output)

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
  selectCompressionMechanismLog() {
    let compressionType,
      optionsStr = '',
      options = new Map([['level', '_level'], ['strategy', '_strategy']])

    if (this.compressionMechanism instanceof zlib.Gzip) {
      compressionType = 'GZIP'
    }

    for (const [key, value] of options) {
      optionsStr += `${key}: ${this.compressionMechanism[value]}, `
    }

    this.logger.warn(`${compressionType} -> ${optionsStr.slice(0, -2)}`)
  }
}

module.exports = Gzipper
