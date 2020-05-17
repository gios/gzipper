/**
 * Custom logger.
 */
export class Logger {
  private readonly verbose: boolean;
  /**
   * Creates an instance of Logger.
   */
  constructor(verbose = true) {
    this.verbose = verbose;
  }

  /**
   * Info logger.
   */
  info(message: string, force?: boolean): void {
    return this.logger('info')(message, force);
  }

  /**
   * Error logger.
   */
  error(message: string, force?: boolean): void {
    return this.logger('error')(message, force);
  }

  /**
   * Success logger.
   */
  success(message: string, force?: boolean): void {
    return this.logger('success')(message, force);
  }

  /**
   * Warn logger.
   */
  warn(message: string, force?: boolean): void {
    return this.logger('warning')(message, force);
  }

  /**
   * Colorize messages depends on the level and return a wrapper.
   */
  private logger(
    level: 'info' | 'error' | 'warning' | 'success',
  ): (message: string, force?: boolean) => void {
    let colorfulMessage: string;
    const prefix = 'gzipper';

    switch (level) {
      case 'info':
        colorfulMessage = `\x1b[30;46m${prefix}:\x1b[0m\x1b[36m %s\x1b[0m`;
        break;

      case 'error':
        colorfulMessage = `\x1b[30;41m${prefix}:\x1b[0m\x1b[31m %s\x1b[0m`;
        break;

      case 'warning':
        colorfulMessage = `\x1b[30;43m${prefix}:\x1b[0m\x1b[33m %s\x1b[0m`;
        break;

      case 'success':
        colorfulMessage = `\x1b[30;42m${prefix}:\x1b[0m\x1b[32m %s\x1b[0m`;
        break;
    }

    return (message: string, force?: boolean): void => {
      if (this.verbose || force) {
        console.log(colorfulMessage, message);
      }
    };
  }
}
