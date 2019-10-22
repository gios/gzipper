import zlib from 'zlib';

import { Compression } from './Compression';
import { GlobalOptions } from '../interfaces';
import { Logger } from '../Logger';

/**
 * Gzip compression
 */
export class GzipCompression extends Compression {
  public readonly compressionName = 'GZIP';
  public readonly ext = 'gz';
  /**
   * Creates an instance of GzipCompression.
   */
  constructor(options: GlobalOptions, logger: Logger) {
    super(options, logger);
  }

  /**
   * Returns gzip compression instance in closure.
   */
  public getCompression(): () => zlib.Gzip {
    return (): zlib.Gzip => zlib.createGzip(this.compressionOptions);
  }
}
