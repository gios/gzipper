import zlib from "zlib";

import { CompressOptions, CompressionOptions } from "../interfaces";
import { Logger } from "../logger/Logger";

export abstract class Compression<T extends CompressionOptions> {
  compressionOptions: T = {} as T;
  abstract ext: string;
  abstract compressionName: string;
  protected readonly options: CompressOptions;
  protected readonly logger: Logger;

  /**
   * Creates an instance of Compression.
   */
  constructor(options: CompressOptions, logger: Logger) {
    this.options = options;
    this.logger = logger;
    this.selectCompression();
  }

  /**
   * Returns a compression instance in closure.
   */
  abstract getCompression(): () => zlib.BrotliCompress | zlib.Gzip;

  /**
   * Returns human-readable compression options info.
   */
  readableOptions(
    keyWrapper: (key: string) => string | undefined = (
      key: string,
    ): string | undefined => key,
  ): string {
    let options = "";

    for (const [key, value] of Object.entries(this.compressionOptions)) {
      options += `${keyWrapper(key)}: ${value}, `;
    }

    return `${this.compressionName} | ${options.slice(0, -2)}`;
  }

  /**
   * Build compression options object [compressionOptions].
   */
  protected selectCompression(): void {
    const options: T = {} as T;

    if (this.options.level !== undefined) {
      options.level = this.options.level;
    }

    if (this.options.memoryLevel !== undefined) {
      options.memLevel = this.options.memoryLevel;
    }

    if (this.options.strategy !== undefined) {
      options.strategy = this.options.strategy;
    }

    this.compressionOptions = options;
  }
}
