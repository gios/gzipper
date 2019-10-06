import zlib from 'zlib';

import { GlobalOptions } from '../interfaces';
import { Logger } from '../Logger';

export abstract class Compression {
  protected readonly options: GlobalOptions;
  protected readonly logger: Logger;
  /**
   * Creates an instance of Compression.
   */
  constructor(options: GlobalOptions, logger: Logger) {
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
