import zlib from 'zlib';

import { Compression } from './Compression';
import { Logger } from '../Logger';
import { GlobalOptions } from '../interfaces';

type BrotliOptions = { [key: number]: number };

/**
 * Brotli
 */
export class BrotliCompression extends Compression {
  public readonly ext = 'br';
  private compressionOptions: BrotliOptions = {};
  /**
   * Creates an instance of BrotliCompression
   */
  constructor(options: GlobalOptions, logger: Logger) {
    super(options, logger);
    this.availability();
    this.selectCompression();
  }

  /**
   * Returns human-readable brotli compression options info.
   */
  public readableOptions(): string {
    let options = '';

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${this.getBrotliOptionName(parseInt(key))}: ${value}, `;
    }

    return `BROTLI -> ${options.slice(0, -2)}`;
  }

  /**
   * Returns brotli compression instance in closure.
   */
  public getCompression(): () => zlib.BrotliCompress {
    return (): zlib.BrotliCompress =>
      zlib.createBrotliCompress({
        params: this.compressionOptions,
      });
  }

  /**
   * Build brotli options object [compressionOptions].
   */
  private selectCompression(): void {
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
  private getBrotliOptionName(
    index: number,
  ): 'brotliParamMode' | 'brotliQuality' | 'brotliSizeHint' | undefined {
    switch (index) {
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
      this.logger.error(message, true);
      throw new Error(message);
    }
  }
}
