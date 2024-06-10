import zlib from 'node:zlib';

import { Compression } from './Compression';
import { BrotliOptions } from '../interfaces';
import { CompressionExtensions, CompressionNames } from '../enums';

/**
 * Brotli compression
 */
export class BrotliCompression extends Compression<BrotliOptions> {
  readonly compressionName = CompressionNames.BROTLI;
  readonly ext = CompressionExtensions.BROTLI;

  /**
   * Returns brotli compression instance in closure.
   */
  getCompression(): zlib.BrotliCompress {
    return zlib.createBrotliCompress({
      params: this.compressionOptions,
    });
  }

  /**
   * Returns human-readable brotli compression options info.
   */
  readableOptions(): string {
    return super.readableOptions(this.getBrotliOptionName.bind(this));
  }

  /**
   * Build brotli options object [compressionOptions].
   */
  protected selectCompression(): void {
    const options: BrotliOptions = {};

    if (this.options.brotliParamMode !== undefined) {
      switch (this.options.brotliParamMode) {
        case 'text':
          options[zlib.constants.BROTLI_PARAM_MODE] =
            zlib.constants.BROTLI_MODE_TEXT;
          break;

        case 'font':
          options[zlib.constants.BROTLI_PARAM_MODE] =
            zlib.constants.BROTLI_MODE_FONT;
          break;

        case 'default':
        default:
          options[zlib.constants.BROTLI_PARAM_MODE] =
            zlib.constants.BROTLI_MODE_GENERIC;
          break;
      }
    }

    if (this.options.brotliQuality !== undefined) {
      options[zlib.constants.BROTLI_PARAM_QUALITY] = this.options.brotliQuality;
    }

    if (this.options.brotliSizeHint !== undefined) {
      options[zlib.constants.BROTLI_PARAM_SIZE_HINT] =
        this.options.brotliSizeHint;
    }
    this.compressionOptions = options;
  }

  /**
   * Returns human-readable brotli option name.
   */
  protected getBrotliOptionName(index: string): string | undefined {
    switch (parseInt(index)) {
      case zlib.constants.BROTLI_PARAM_MODE:
        return 'paramMode';

      case zlib.constants.BROTLI_PARAM_QUALITY:
        return 'quality';

      case zlib.constants.BROTLI_PARAM_SIZE_HINT:
        return 'sizeHint';
    }
  }
}
