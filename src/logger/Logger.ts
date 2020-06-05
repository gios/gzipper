import { filter } from './filter.decorator';
import { LogLevel } from './LogLevel.enum';

/**
 * Custom logger.
 */
export class Logger {
  readonly verbose: boolean;
  /**
   * Creates an instance of Logger.
   */
  constructor(verbose: boolean) {
    this.verbose = verbose;
  }
  /**
   * Info logger.
   */
  @filter(LogLevel.INFO)
  info(message: string): void {
    return this.logger(LogLevel.INFO)(message);
  }

  /**
   * Error logger.
   */
  @filter(LogLevel.ERROR)
  error(message: string): void {
    return this.logger(LogLevel.ERROR)(message);
  }

  /**
   * Success logger.
   */
  @filter(LogLevel.SUCCESS)
  success(message: string): void {
    return this.logger(LogLevel.SUCCESS)(message);
  }

  /**
   * Warning logger.
   */
  @filter(LogLevel.WARNING)
  warn(message: string): void {
    return this.logger(LogLevel.WARNING)(message);
  }

  /**
   * Colorize messages depends on the level and return a wrapper.
   */
  private logger(level: LogLevel): (message: string) => void {
    let colorfulMessage: string;
    const prefix = 'gzipper';

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
    }

    return (message: string): void => console.log(colorfulMessage, message);
  }
}
