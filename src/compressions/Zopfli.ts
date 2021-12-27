import zopfli from 'node-zopfli';

import { Compression } from './Compression';
import { CompressOptions, ZopfliOptions } from '../interfaces';
import { CompressionExtensions, CompressionNames } from '../enums';

/**
 * Zopfli compression
 */
export class ZopfliCompression extends Compression<ZopfliOptions> {
  readonly compressionName = CompressionNames.ZOPFLI;
  readonly ext = CompressionExtensions.GZIP;
  /**
   * Creates an instance of ZopfliCompression
   */
  constructor(options: CompressOptions) {
    super(options);
  }

  /**
   * Returns zopfli compression instance in closure.
   */
  getCompression(): () => zopfli {
    return (): zopfli => new zopfli('gzip', this.compressionOptions);
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

    if (this.options.zopfliBlockSplittingLast !== undefined) {
      options.blocksplittinglast = this.options.zopfliBlockSplittingLast;
    }

    if (this.options.zopfliBlockSplittingMax !== undefined) {
      options.blocksplittingmax = this.options.zopfliBlockSplittingMax;
    }

    this.compressionOptions = options;
  }
}
