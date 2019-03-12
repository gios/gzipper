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
    if (!target) {
      throw new Error(`Can't find a path.`)
    }
    this.options = options
    this.logger = new Logger(this.options.verbose)
    this.nativeTarget = target
    this.target = path.resolve(process.cwd(), target)

    this.compressionMechanism = zlib.createGzip({
      level: this.options.gzipLevel || DEFAULT_GZIP_LEVEL,
      memLevel: this.options.gzipMemoryLevel || DEFAULT_GZIP_MEMORY_LEVEL,
      strategy: this.options.gzipStrategy || DEFAULT_GZIP_STRATEGY,
    })
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

          this[compressFile](file, target, null, () => {
            ++successGlobalCount
            this.logger.info(`File ${file} has been compiled.`)

            if (globalCount === successGlobalCount) {
              this.logger.success(
                `${globalCount} ${
                  globalCount.length > 1 ? 'files have' : 'file has'
                } been compiled from folder ${path.relative(
                  this.nativeTarget,
                  path.dirname(filePath)
                )}.`,
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
    let input = fs.createReadStream(path.join(target, filename))
    let output = fs.createWriteStream(
      `${path.join(outputDir || target, filename)}.gz`
    )

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
