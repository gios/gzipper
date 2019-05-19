const zlib = require('zlib')

const selectCompression = Symbol('selectCompression')

const Compression = require('./Compression')

module.exports = class GzipCompression extends Compression {
  /**
   * Creates an instance of GzipCompression.
   *
   * @param {object} options
   */
  constructor(options) {
    super(options)
    this.ext = 'gz'
    this[selectCompression]()
  }

  /**
   * Build gzip options object [compressionOptions].
   *
   * @memberof GzipCompression
   */
  [selectCompression]() {
    const options = {}

    if (this.options.gzipLevel !== undefined) {
      options.gzipLevel = this.options.gzipLevel
    }

    if (this.options.gzipMemoryLevel !== undefined) {
      options.gzipMemoryLevel = this.options.gzipMemoryLevel
    }

    if (this.options.gzipStrategy !== undefined) {
      options.gzipStrategy = this.options.gzipStrategy
    }
    this.compressionOptions = options
  }

  /**
   * Returns human-readable gzip compression options info.
   *
   * @returns {string} formatted string with compression options
   * @memberof GzipCompression
   */
  readableOptions() {
    let options = ''

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${key}: ${value}, `
    }

    return `GZIP -> ${options.slice(0, -2)}`
  }

  /**
   * Returns gzip compression instance in closure.
   *
   * @returns {() => Gzip} brotli instance in closure
   * @memberof GzipCompression
   */
  getCompression() {
    return () => zlib.createGzip(this.compressionOptions)
  }
}
