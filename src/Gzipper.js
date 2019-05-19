const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const util = require('util')
const uuid = require('uuid/v4')

const OUTPUT_FILE_FORMAT_REGEXP = /(\[filename\]*)|(\[hash\]*)|(\[compressExt\]*)|(\[ext\]*)/g
const Logger = require('./Logger')
const BrotliCompression = require('./compressions/Brotli')
const GzipCompression = require('./compressions/Gzip')
const { VALID_EXTENSIONS } = require('./constants')

const compileFolderRecursively = Symbol('compileFolderRecursively')
const compressFile = Symbol('compressFile')
const compressionLog = Symbol('compressionLog')
const getCompressionType = Symbol('getCompressionType')
const createFolders = Symbol('createFolders')
const statExists = Symbol('statExists')
const getOutputPath = Symbol('getOutputPath')

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
    this.compressionInstance = this.options.brotli
      ? new BrotliCompression(this.options, this.logger)
      : new GzipCompression(this.options, this.logger)
    this.target = path.resolve(process.cwd(), target)
    const [
      createCompression,
      compressionOptions,
    ] = this.compressionInstance.selectCompression()
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
            if (VALID_EXTENSIONS.includes(path.extname(filePath))) {
              const hrtimeStart = process.hrtime()
              compressedFiles.push(filePath)
              const fileInfo = await this[compressFile](
                file,
                target,
                this.outputPath
              )

              if (fileInfo) {
                const [seconds, nanoseconds] = process.hrtime(hrtimeStart)
                this.logger.info(
                  `File ${file} has been compressed ${fileInfo.beforeSize.toFixed(
                    4
                  )}Kb -> ${fileInfo.afterSize.toFixed(4)}Kb (${
                    seconds ? seconds + 's ' : ''
                  }${nanoseconds / 1e6}ms)`
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
    const outputPath = this[getOutputPath](target, filename)
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
      this[compressionLog]()
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
        `we couldn't find any appropriate files. valid extensions are: ${VALID_EXTENSIONS.join(
          ', '
        )}`,
        true
      )
    }
  }

  /**
   * Show message with compression params.
   *
   * @memberof Gzipper
   */
  [compressionLog]() {
    let options = ''

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      switch (this.compressionType.name) {
        case 'BROTLI':
          options += `${this.compressionInstance.getBrotliOptionName(
            key
          )}: ${value}, `
          break
        default:
          options += `${key}: ${value}, `
      }
    }

    this.logger.warn(
      `${this.compressionType.name} -> ${options.slice(0, -2)}`,
      true
    )

    if (!this.options.outputFileFormat) {
      this.logger.info(
        'Use default output file format [filename].[ext].[compressExt]'
      )
    }
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

  /**
   * Get output path which is based on [outputFileFormat].
   *
   * @param {string} target
   * @param {string} file - file name with extension
   * @returns {string}
   * @memberof Gzipper
   */
  [getOutputPath](target, file) {
    const artifactsMap = new Map([
      ['[filename]', path.parse(file).name],
      ['[ext]', path.extname(file).slice(1)],
      ['[compressExt]', this.compressionType.ext],
    ])
    let filename = `${artifactsMap.get('[filename]')}.${artifactsMap.get(
      '[ext]'
    )}.${artifactsMap.get('[compressExt]')}`

    if (this.options.outputFileFormat) {
      artifactsMap.set('[hash]', null)

      filename = this.options.outputFileFormat.replace(
        OUTPUT_FILE_FORMAT_REGEXP,
        artifact => {
          if (artifactsMap.has(artifact)) {
            // Need to generate hash only if we have appropriate param
            if (artifact === '[hash]') {
              artifactsMap.set('[hash]', uuid())
            }
            return artifactsMap.get(artifact)
          } else {
            return artifact
          }
        }
      )
    }

    return `${path.join(target, filename)}`
  }
}

module.exports = Gzipper
