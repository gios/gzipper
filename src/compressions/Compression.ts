import zlib from 'zlib';

import { IOptions } from '../interfaces';
import { Logger } from '../Logger';

export abstract class Compression {
  protected options: IOptions;
  protected logger: Logger;
  /**
   * Creates an instance of Compression.
   */
  constructor(options: IOptions, logger: Logger) {
    this.options = options;
    this.logger = logger;
  }

  /**
   * Returns human-readable compression options info.
   */
  public abstract readableOptions(): string;

  /**
   * Returns a compression instance in closure.
   */
  public abstract getCompression(): () => zlib.BrotliCompress | zlib.Gzip;
}
