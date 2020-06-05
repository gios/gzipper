import zlib from 'zlib';

import { Compression } from './Compression';
import { Logger } from '../logger/Logger';
import { CompressOptions, BrotliOptions } from '../interfaces';

/**
 * Brotli compression
 */
export class BrotliCompression extends Compression<BrotliOptions> {
  readonly compressionName = 'BROTLI';
  readonly ext = 'br';
  /**
   * Creates an instance of BrotliCompression
   */
  constructor(options: CompressOptions, logger: Logger) {
    super(options, logger);
    this.availability();
  }

  /**
   * Returns brotli compression instance in closure.
   */
  getCompression(): () => zlib.BrotliCompress {
    return (): zlib.BrotliCompress =>
      zlib.createBrotliCompress({
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
        case 'default':
          options[zlib.constants.BROTLI_PARAM_MODE] =
            zlib.constants.BROTLI_MODE_GENERIC;
          break;

        case 'text':
          options[zlib.constants.BROTLI_PARAM_MODE] =
            zlib.constants.BROTLI_MODE_TEXT;
          break;

        case 'font':
          options[zlib.constants.BROTLI_PARAM_MODE] =
            zlib.constants.BROTLI_MODE_FONT;
          break;

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
      options[
        zlib.constants.BROTLI_PARAM_SIZE_HINT
      ] = this.options.brotliSizeHint;
    }
    this.compressionOptions = options;
  }

  /**
   * Returns human-readable brotli option name.
   */
  protected getBrotliOptionName(index: string): string | undefined {
    switch (parseInt(index)) {
      case zlib.constants.BROTLI_PARAM_MODE:
        return 'brotliParamMode';

      case zlib.constants.BROTLI_PARAM_QUALITY:
        return 'brotliQuality';

      case zlib.constants.BROTLI_PARAM_SIZE_HINT:
        return 'brotliSizeHint';
    }
  }

  /**
   * Check if brotli compression is exists on current Node.js version.
   */
  private availability(): void {
    if (typeof zlib.createBrotliCompress !== 'function') {
      const message = `Can't use brotli compression, Node.js >= v11.7.0 required.`;
      this.logger.error(message);
      throw new Error(message);
    }
  }
}
