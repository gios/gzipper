import zlib from 'node:zlib';

import { Compression } from './Compression';
import { GenericCompressionOptions } from '../interfaces';
import { CompressionExtensions, CompressionNames } from '../enums';

/**
 * Gzip compression
 */
export class GzipCompression extends Compression<GenericCompressionOptions> {
  readonly compressionName = CompressionNames.GZIP;
  readonly ext = CompressionExtensions.GZIP;

  /**
   * Returns gzip compression instance in closure.
   */
  getCompression(): zlib.Gzip {
    return zlib.createGzip(this.compressionOptions);
  }

  /**
   * Build deflate compression options object.
   */
  protected selectCompression(): void {
    const options: GenericCompressionOptions = {};

    if (this.options.gzipLevel !== undefined) {
      options.level = this.options.gzipLevel;
    }

    if (this.options.gzipMemoryLevel !== undefined) {
      options.memLevel = this.options.gzipMemoryLevel;
    }

    if (this.options.gzipStrategy !== undefined) {
      options.strategy = this.options.gzipStrategy;
    }

    this.compressionOptions = options;
  }
}
