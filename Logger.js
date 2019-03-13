const logger = Symbol('logger')

/**
 * Custom logger.
 *
 * @class Logger
 */
class Logger {
  /**
   * Creates an instance of Logger.
   *
   * @param {boolean} verbose
   * @memberof Logger
   */
  constructor(verbose) {
    this.verbose = verbose
  }

  /**
   * Colorize messages depends on the level and return a wrapper.
   *
   * @param {'info' | 'error' | 'warning' | 'success'} level
   * @return {(message: any, force: boolean) => void}
   * @memberof Logger
   */
  [logger](level) {
    let colorfulMessage
    switch (level) {
      case 'info':
        colorfulMessage = `\x1b[36m%s\x1b[0m`
        break

      case 'error':
        colorfulMessage = `\x1b[31m%s\x1b[0m`
        break

      case 'warning':
        colorfulMessage = `\x1b[33m%s\x1b[0m`
        break

      case 'success':
        colorfulMessage = `\x1b[32m%s\x1b[0m`
        break
    }

    return (message, force) =>
      (this.verbose || force) && console.log(colorfulMessage, message)
  }

  /**
   * Info logger.
   *
   * @param {string} message
   * @param {boolean} force anyway print message
   * @returns
   * @memberof Logger
   */
  info(message, force) {
    return this[logger]('info')(message, force)
  }

  /**
   * Error logger.
   *
   * @param {string} message
   * @param {boolean} force anyway print message
   * @returns
   * @memberof Logger
   */
  error(message, force) {
    return this[logger]('error')(message, force)
  }

  /**
   * Success logger.
   *
   * @param {string} message
   * @param {boolean} force anyway print message
   * @returns
   * @memberof Logger
   */
  success(message, force) {
    return this[logger]('success')(message, force)
  }

  /**
   * Warn logger.
   *
   * @param {string} message
   * @param {boolean} force anyway print message
   * @returns
   * @memberof Logger
   */
  warn(message, force) {
    return this[logger]('warning')(message, force)
  }
}

module.exports = Logger
