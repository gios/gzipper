import zlib from 'zlib';

import { Compression } from './Compression';
import { CompressOptions, CompressionOptions } from '../interfaces';
import { Logger } from '../Logger';

/**
 * Gzip compression
 */
export class GzipCompression extends Compression<CompressionOptions> {
  readonly compressionName = 'GZIP';
  readonly ext = 'gz';
  /**
   * Creates an instance of GzipCompression.
   */
  constructor(options: CompressOptions, logger: Logger) {
    super(options, logger);
  }

  /**
   * Returns gzip compression instance in closure.
   */
  getCompression(): () => zlib.Gzip {
    return (): zlib.Gzip => zlib.createGzip(this.compressionOptions);
  }
}
