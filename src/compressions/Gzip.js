const zlib = require('zlib')
const Compression = require('./Compression')

module.exports = class GzipCompression extends Compression {
  /**
   * Creates an instance of GzipCompression.
   *
   * @param {object} options
   */
  constructor(options) {
    super(options)
  }

  /**
   * Select gzip compression type and options.
   *
   * @returns {[() => object, object]} compression instance and options
   * @memberof GzipCompression
   */
  selectCompression() {
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

    return [() => zlib.createGzip(options), options]
  }
}
