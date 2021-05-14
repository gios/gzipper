import { BrotliCompression } from './compressions/Brotli';
import { DeflateCompression } from './compressions/Deflate';
import { GzipCompression } from './compressions/Gzip';
import { COMPRESSION_EXTENSIONS } from './constants';
import { CompressOptions } from './interfaces';

export class CompressService {
  private readonly options: CompressOptions;

  constructor(options: CompressOptions) {
    this.options = options;
  }

  /**
   * Return compression instance.
   */
  public getCompressionInstance():
    | BrotliCompression
    | DeflateCompression
    | GzipCompression {
    if (this.options.brotli) {
      return new BrotliCompression(this.options);
    } else if (this.options.deflate) {
      return new DeflateCompression(this.options);
    } else {
      return new GzipCompression(this.options);
    }
  }

  /**
   * Returns if the file extension is valid.
   */
  public isValidFileExtensions(ext: string): boolean {
    if (COMPRESSION_EXTENSIONS.includes(ext)) {
      return false;
    }

    const excludeExtensions = this.options.exclude;
    const includeExtensions = this.options.include;

    if (includeExtensions?.length) {
      return includeExtensions.includes(ext);
    }

    if (excludeExtensions?.length) {
      return !excludeExtensions.includes(ext);
    }

    return true;
  }
}
