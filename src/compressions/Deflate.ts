import zlib from 'zlib';

import { Compression } from './Compression';
import { GlobalOptions, CompressionOptions } from '../interfaces';
import { Logger } from '../Logger';

/**
 * Deflate compression
 */
export class DeflateCompression extends Compression<CompressionOptions> {
  readonly compressionName = 'DEFLATE';
  readonly ext = 'zz';
  /**
   * Creates an instance of GzipCompression.
   */
  constructor(options: GlobalOptions, logger: Logger) {
    super(options, logger);
  }

  /**
   * Returns deflate compression instance in closure.
   */
  getCompression(): () => zlib.Deflate {
    return (): zlib.Deflate => zlib.createDeflate(this.compressionOptions);
  }
}
