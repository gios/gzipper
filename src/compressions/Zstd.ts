import stream from 'node:stream';

import { Compression } from './Compression.js';
import { ZstdOptions } from '../interfaces.js';
import { CompressionExtensions, CompressionNames } from '../enums.js';

/**
 * Zstd compression
 */
export class ZstdCompression extends Compression<ZstdOptions> {
  readonly compressionName = CompressionNames.ZSTD;
  readonly ext = CompressionExtensions.ZSTD;

  /**
   * Returns zstd compression instance in closure.
   */
  async getCompression(): Promise<stream.Transform> {
    const zstd = await import('simple-zstd');
    return zstd.ZSTDCompress(this.compressionOptions.level);
  }

  /**
   * Build zstd compression options object.
   */
  protected selectCompression(): void {
    const options: ZstdOptions = {};

    if (this.options.zstdLevel !== undefined) {
      options.level = this.options.zstdLevel;
    }

    this.compressionOptions = options;
  }
}
