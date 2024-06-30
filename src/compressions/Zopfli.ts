import { Compression } from './Compression.js';
import { ZopfliOptions } from '../interfaces.js';
import { CompressionExtensions, CompressionNames } from '../enums.js';
import { ZopfliStream } from './ZopfliStream.js';

/**
 * Zopfli compression
 */
export class ZopfliCompression extends Compression<ZopfliOptions> {
  readonly compressionName = CompressionNames.ZOPFLI;
  readonly ext = CompressionExtensions.GZIP;

  /**
   * Returns zopfli compression instance in closure.
   */
  getCompression(): ZopfliStream {
    return new ZopfliStream(this.compressionOptions);
  }

  /**
   * Build zopfli compression options object.
   */
  protected selectCompression(): void {
    const options: ZopfliOptions = {};

    if (this.options.zopfliNumIterations !== undefined) {
      options.numiterations = this.options.zopfliNumIterations;
    }

    if (this.options.zopfliBlockSplitting !== undefined) {
      options.blocksplitting = this.options.zopfliBlockSplitting;
    }

    if (this.options.zopfliBlockSplittingMax !== undefined) {
      options.blocksplittingmax = this.options.zopfliBlockSplittingMax;
    }

    this.compressionOptions = options;
  }
}
