const zlib = require('zlib')

const availability = Symbol('availability')
const selectCompression = Symbol('selectCompression')
const getBrotliOptionName = Symbol('getBrotliOptionName')

const Compression = require('./Compression')

/**
 * Brotli
 *
 * @class BrotliCompression
 * @extends {Compression}
 */
class BrotliCompression extends Compression {
  /**
   * Creates an instance of BrotliCompression
   .
   * @param {object} options
   * @param {Logger} logger logger instance
   */
  constructor(options, logger) {
    super(options, logger)
    this.ext = 'br'
    this[availability]()
    this[selectCompression]()
  }

  /**
   * Build brotli options object [compressionOptions].
   *
   * @memberof BrotliCompression
   */
  [selectCompression]() {
    const options = {}

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
      options[zlib.constants.BROTLI_PARAM_QUALITY] = this.options.brotliQuality
    }

    if (this.options.brotliSizeHint !== undefined) {
      options[
        zlib.constants.BROTLI_PARAM_SIZE_HINT
      ] = this.options.brotliSizeHint
    }
    this.compressionOptions = options
  }

  /**
   * Returns human-readable brotli option name.
   *
   * @param {number} index
   * @returns {string}
   * @memberof BrotliCompression
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
   * Check if brotli compression is exists on current Node.js version.
   *
   * @memberof BrotliCompression
   */
  [availability]() {
    if (typeof zlib.createBrotliCompress !== 'function') {
      const message = `Can't use brotli compression, Node.js >= v11.7.0 required.`
      this.logger.error(message, true)
      throw new Error(message)
    }
  }

  /**
   * Returns human-readable brotli compression options info.
   *
   * @returns {string} formatted string with compression options
   */
  readableOptions() {
    let options = ''

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${this[getBrotliOptionName](key)}: ${value}, `
    }

    return `BROTLI -> ${options.slice(0, -2)}`
  }

  /**
   * Returns brotli compression instance in closure.
   *
   * @returns {() => BrotliCompress} brotli instance in closure
   * @memberof BrotliCompression
   */
  getCompression() {
    return () =>
      zlib.createBrotliCompress({
        params: this.compressionOptions,
      })
  }
}

module.exports = BrotliCompression
