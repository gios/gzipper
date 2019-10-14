import zlib from 'zlib';

import { Compression } from './Compression';
import { GlobalOptions } from '../interfaces';
import { Logger } from '../Logger';

type GzipOptions = {
  gzipLevel?: number;
  gzipMemoryLevel?: number;
  gzipStrategy?: number;
} & zlib.ZlibOptions;

/**
 * Gzip
 */
export class GzipCompression extends Compression {
  public readonly ext = 'gz';
  private compressionOptions: GzipOptions = {};
  /**
   * Creates an instance of GzipCompression.
   */
  constructor(options: GlobalOptions, logger: Logger) {
    super(options, logger);
    this.selectCompression();
  }

  /**
   * Returns human-readable gzip compression options info.
   */
  public readableOptions(): string {
    let options = '';

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${key}: ${value}, `;
    }

    return `GZIP -> ${options.slice(0, -2)}`;
  }

  /**
   * Returns gzip compression instance in closure.
   */
  public getCompression(): () => zlib.Gzip {
    return (): zlib.Gzip =>
      zlib.createGzip({
        level: this.compressionOptions.gzipLevel,
        memLevel: this.compressionOptions.gzipMemoryLevel,
        strategy: this.compressionOptions.gzipStrategy,
      });
  }

  /**
   * Build gzip options object [compressionOptions].
   */
  private selectCompression(): void {
    const options: GzipOptions = {};

    if (this.options.gzipLevel !== undefined) {
      options.gzipLevel = this.options.gzipLevel;
    }

    if (this.options.gzipMemoryLevel !== undefined) {
      options.gzipMemoryLevel = this.options.gzipMemoryLevel;
    }

    if (this.options.gzipStrategy !== undefined) {
      options.gzipStrategy = this.options.gzipStrategy;
    }
    this.compressionOptions = options;
  }
}
