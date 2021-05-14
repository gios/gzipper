import zlib from 'zlib';

import { Compression } from './Compression';
import { CompressOptions, CompressionOptions } from '../interfaces';

/**
 * Deflate compression
 */
export class DeflateCompression extends Compression<CompressionOptions> {
  readonly compressionName = 'DEFLATE';
  readonly ext = 'zz';
  /**
   * Creates an instance of GzipCompression.
   */
  constructor(options: CompressOptions) {
    super(options);
  }

  /**
   * Returns deflate compression instance in closure.
   */
  getCompression(): () => zlib.Deflate {
    return (): zlib.Deflate => zlib.createDeflate(this.compressionOptions);
  }
}
