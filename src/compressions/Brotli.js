const zlib = require('zlib')
const Compression = require('./Compression')

module.exports = class BrotliCompression extends Compression {
  /**
   * Creates an instance of BrotliCompression
   .
   * @param {object} options
   */
  constructor(options) {
    super()
    this.options = options
  }

  /**
   * Select brotli compression type and options.
   *
   * @returns {[() => object, object]} compression instance and options
   * @memberof BrotliCompression
   */
  selectCompression() {
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

    return [
      () =>
        zlib.createBrotliCompress({
          params: options,
        }),
      options,
    ]
  }

  /**
   * Returns human-readable brotli option name.
   *
   * @param {number} index
   * @returns {string}
   * @memberof BrotliCompression
   */
  getBrotliOptionName(index) {
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
}
