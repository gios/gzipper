import { LogLevel } from './LogLevel.enum';
import { getLogColor } from '../helpers';
import { CompressOptions } from '../interfaces';

export class Logger {
  private verbose = false;
  private color = false;

  /**
   * Initialize the logger.
   */
  initialize(options: Pick<CompressOptions, 'verbose' | 'color'>) {
    this.verbose = !!options.verbose;
    this.color = getLogColor(options.color);
  }

  /**
   * Colorize messages depends on the level and return a wrapper.
   */
  private logger<T>(message: T, level: LogLevel): void {
    let colorfulMessage: string;
    const prefix = 'gzipper';
    level = !this.color ? LogLevel.DEBUG : level;

    switch (level) {
      case LogLevel.INFO:
        colorfulMessage = `\x1b[30;46m${prefix}:\x1b[0m\x1b[36m %s\x1b[0m`;
        break;

      case LogLevel.ERROR:
        colorfulMessage = `\x1b[30;41m${prefix}:\x1b[0m\x1b[31m %s\x1b[0m`;
        break;

      case LogLevel.WARNING:
        colorfulMessage = `\x1b[30;43m${prefix}:\x1b[0m\x1b[33m %s\x1b[0m`;
        break;

      case LogLevel.SUCCESS:
        colorfulMessage = `\x1b[30;42m${prefix}:\x1b[0m\x1b[32m %s\x1b[0m`;
        break;

      case LogLevel.DEBUG:
      default:
        colorfulMessage = `${prefix}: %s`;
        break;
    }

    console.log(colorfulMessage, message);
  }

  /**
   * Log message.
   */
  log<T>(message: T, level: LogLevel = LogLevel.DEBUG): void {
    const shouldLog =
      this.verbose || level === LogLevel.SUCCESS || level === LogLevel.ERROR;

    if (shouldLog) {
      this.logger(message, level);
    }
  }
}
