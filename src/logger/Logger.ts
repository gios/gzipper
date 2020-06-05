import { filter } from './filter.decorator';
import { Types } from './types.enum';

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
  @filter(Types.Info)
  info(message: string): void {
    return this.logger(Types.Info)(message);
  }

  /**
   * Error logger.
   */
  @filter(Types.Error)
  error(message: string): void {
    return this.logger(Types.Error)(message);
  }

  /**
   * Success logger.
   */
  @filter(Types.Success)
  success(message: string): void {
    return this.logger(Types.Success)(message);
  }

  /**
   * Warning logger.
   */
  @filter(Types.Warning)
  warn(message: string): void {
    return this.logger(Types.Warning)(message);
  }

  /**
   * Colorize messages depends on the level and return a wrapper.
   */
  private logger(level: Types): (message: string, force?: boolean) => void {
    let colorfulMessage: string;
    const prefix = 'gzipper';

    switch (level) {
      case Types.Info:
        colorfulMessage = `\x1b[30;46m${prefix}:\x1b[0m\x1b[36m %s\x1b[0m`;
        break;

      case Types.Error:
        colorfulMessage = `\x1b[30;41m${prefix}:\x1b[0m\x1b[31m %s\x1b[0m`;
        break;

      case Types.Warning:
        colorfulMessage = `\x1b[30;43m${prefix}:\x1b[0m\x1b[33m %s\x1b[0m`;
        break;

      case Types.Success:
        colorfulMessage = `\x1b[30;42m${prefix}:\x1b[0m\x1b[32m %s\x1b[0m`;
        break;
    }

    return (message: string): void => console.log(colorfulMessage, message);
  }
}
