import zlib from 'node:zlib';

import { Compression } from './Compression';
import { CompressionOptions } from '../interfaces';
import { CompressionExtensions, CompressionNames } from '../enums';

/**
 * Deflate compression
 */
export class DeflateCompression extends Compression<CompressionOptions> {
  readonly compressionName = CompressionNames.DEFLATE;
  readonly ext = CompressionExtensions.DEFLATE;

  /**
   * Returns deflate compression instance in closure.
   */
  getCompression(): zlib.Deflate {
    return zlib.createDeflate(this.compressionOptions);
  }

  /**
   * Build deflate compression options object.
   */
  protected selectCompression(): void {
    const options: CompressionOptions = {};

    if (this.options.deflateLevel !== undefined) {
      options.level = this.options.deflateLevel;
    }

    if (this.options.deflateMemoryLevel !== undefined) {
      options.memLevel = this.options.deflateMemoryLevel;
    }

    if (this.options.deflateStrategy !== undefined) {
      options.strategy = this.options.deflateStrategy;
    }

    this.compressionOptions = options;
  }
}
