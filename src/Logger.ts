/**
 * Custom logger.
 */
export class Logger {
  private verbose: boolean;
  /**
   * Creates an instance of Logger.
   */
  constructor(verbose: boolean) {
    this.verbose = verbose;
  }

  /**
   * Info logger.
   */
  public info(message: string, force?: boolean): void {
    return this.logger('info')(message, force);
  }

  /**
   * Error logger.
   */
  public error(message: string, force?: boolean): void {
    return this.logger('error')(message, force);
  }

  /**
   * Success logger.
   */
  public success(message: string, force?: boolean): void {
    return this.logger('success')(message, force);
  }

  /**
   * Warn logger.
   */
  public warn(message: string, force?: boolean): void {
    return this.logger('warning')(message, force);
  }

  /**
   * Colorize messages depends on the level and return a wrapper.
   */
  private logger(
    level: 'info' | 'error' | 'warning' | 'success',
  ): (message: string, force?: boolean) => void {
    let colorfulMessage: string;
    const prefix = 'gzipper: ';

    switch (level) {
      case 'info':
        colorfulMessage = `\x1b[36m${prefix}%s\x1b[0m`;
        break;

      case 'error':
        colorfulMessage = `\x1b[31m${prefix}%s\x1b[0m`;
        break;

      case 'warning':
        colorfulMessage = `\x1b[33m${prefix}%s\x1b[0m`;
        break;

      case 'success':
        colorfulMessage = `\x1b[32m${prefix}%s\x1b[0m`;
        break;
    }

    return (message: string, force?: boolean): void => {
      if (this.verbose || force) {
        console.log(colorfulMessage, message);
      }
    };
  }
}
