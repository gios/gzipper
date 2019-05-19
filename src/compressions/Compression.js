module.exports = class Compression {
  /**
   * Creates an instance of Compression.
   *
   * @param {object} options
   * @param {Logger} logger logger instance
   */
  constructor(options, logger) {
    this.options = options
    this.logger = logger
  }

  /**
   * Returns human-readable compression options info.
   *
   */
  readableOptions() {
    throw new Error('You have to implement the method readableOptions!')
  }

  /**
   * Returns a compression instance in closure.
   *
   */
  getCompression() {
    throw new Error('You have to implement the method getCompression!')
  }
}
