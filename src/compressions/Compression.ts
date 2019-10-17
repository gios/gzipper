import zlib from 'zlib';

import {
  GlobalOptions,
  CompressionOptions,
  BrotliOptions,
} from '../interfaces';
import { Logger } from '../Logger';

export abstract class Compression {
  public abstract ext: string;
  public abstract compressionName: string;
  protected readonly options: GlobalOptions;
  protected readonly logger: Logger;
  protected compressionOptions: CompressionOptions | BrotliOptions = {};
  /**
   * Creates an instance of Compression.
   */
  constructor(options: GlobalOptions, logger: Logger) {
    this.options = options;
    this.logger = logger;
    this.selectCompression();
  }

  /**
   * Returns a compression instance in closure.
   */
  public abstract getCompression(): () => zlib.BrotliCompress | zlib.Gzip;

  /**
   * Build compression options object [compressionOptions].
   */
  public selectCompression(): void {
    const options: CompressionOptions = {};

    if (this.options.gzipLevel !== undefined) {
      options.level = this.options.level;
    }

    if (this.options.gzipMemoryLevel !== undefined) {
      options.memLevel = this.options.memoryLevel;
    }

    if (this.options.gzipStrategy !== undefined) {
      options.strategy = this.options.strategy;
    }

    this.compressionOptions = options;
  }

  /**
   * Returns human-readable compression options info.
   */
  public readableOptions(): string {
    let options = '';

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${this.keyTransformWrapper(key)}: ${value}, `;
    }

    return `${this.compressionName} -> ${options.slice(0, -2)}`;
  }

  /**
   * Function which transforms key for [readableOptions] into readable string.
   */
  protected keyTransformWrapper(key: string): string | undefined {
    return key;
  }
}
