import stream from 'stream';

import { CompressOptions, CompressionOptions } from '../interfaces.js';

export abstract class Compression<T extends CompressionOptions> {
  compressionOptions: T = {} as T;
  abstract ext: string;
  abstract compressionName: string;
  protected readonly options: CompressOptions;

  /**
   * Creates an instance of Compression.
   */
  constructor(options: CompressOptions) {
    this.options = options;
    this.selectCompression();
  }

  /**
   * Returns a compression instance in closure.
   */
  abstract getCompression(): stream.Transform | Promise<stream.Transform>;

  /**
   * Build compression options object [compressionOptions].
   */
  protected abstract selectCompression(): void;

  /**
   * Returns human-readable compression options info.
   */
  readableOptions(
    keyWrapper: (key: string) => string | undefined = (
      key: string,
    ): string | undefined => key,
  ): string {
    let options = '';

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${keyWrapper(key)}: ${value}, `;
    }

    return `${this.compressionName} | ${options.slice(0, -2)}`;
  }
}
