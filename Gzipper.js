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
  constructor(target, options = {}) {
    this.target = target
    this.options = options
    this.logger = new Logger(this.options.verbose)

    this.compressionMechanism = zlib.createGzip({
      level: this.options.gzipLevel || DEFAULT_GZIP_LEVEL,
      memLevel: this.options.gzipMemoryLevel || DEFAULT_GZIP_MEMORY_LEVEL,
      strategy: this.options.gzipStrategy || DEFAULT_GZIP_STRATEGY,
    })
  }

  /**
   * Compile files in folder recursively.
   *
   * @param {string} outputDir path to output directory
   * @param {number} [globalCount=0] global files count
   * @param {number} [successGlobalCount=0] success files count
   * @memberof Gzipper
   */
  [compileFolderRecursively](
    outputDir,
    globalCount = 0,
    successGlobalCount = 0
  ) {
    const filesList = fs.readdirSync(outputDir)

    try {
      filesList.forEach(file => {
        const filePath = path.resolve(outputDir, file)

        if (
          fs.lstatSync(filePath).isFile() &&
          (path.extname(filePath) === '.js' ||
            path.extname(filePath) === '.css')
        ) {
          ++globalCount

          this[compressFile](file, outputDir, () => {
            ++successGlobalCount
            this.logger.info(`File ${file} has been compiled.`)

            if (globalCount === successGlobalCount) {
              this.logger.success(
                `${globalCount} ${
                  globalCount.length > 1 ? 'files have' : 'file has'
                } been compiled.`,
                true
              )
            }
          })
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
      this.logger.warn(
        `${globalCount} ${
          globalCount.length > 1 ? 'files have' : 'file has'
        } been compiled.`,
        true
      )
    }
  }

  /**
   * File compression.
   *
   * @param {string} filename path to file
   * @param {string} outputDir path to output directory
   * @param {() => void} callback finish callback
   * @memberof Gzipper
   */
  [compressFile](filename, outputDir, callback) {
    let input = fs.createReadStream(path.join(outputDir, filename))
    let output = fs.createWriteStream(`${path.join(outputDir, filename)}.gz`)

    input.pipe(this.compressionMechanism).pipe(output)

    if (callback) {
      output.on('finish', callback)
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
}

module.exports = Gzipper
