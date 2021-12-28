import { Compression } from './Compression';
import { CompressOptions, ZstdOptions } from '../interfaces';
import { CompressionExtensions, CompressionNames } from '../enums';

/**
 * Zstd compression
 */
export class ZstdCompression extends Compression<ZstdOptions> {
  readonly compressionName = CompressionNames.ZSTD;
  readonly ext = CompressionExtensions.ZSTD;
  /**
   * Creates an instance of ZstdCompression.
   */
  constructor(options: CompressOptions) {
    super(options);
  }

  /**
   * Returns zstd compression instance in closure.
   */
  getCompression(): () => any {
    return (): any => null;
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
