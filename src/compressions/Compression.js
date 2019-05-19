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

  selectCompression() {
    throw new Error('Override selectCompression method in child class.')
  }
}
