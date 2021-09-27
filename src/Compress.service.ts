import { BrotliCompression } from './compressions/Brotli';
import { DeflateCompression } from './compressions/Deflate';
import { GzipCompression } from './compressions/Gzip';
import { COMPRESSION_EXTENSIONS } from './constants';
import { CompressionType, CompressOptions } from './interfaces';

export class CompressService {
  private readonly options: CompressOptions;

  /**
   * Creates an instance of CompressService.
   */
  constructor(options: CompressOptions) {
    this.options = options;
  }

  /**
   * Return compression instances.
   */
  public getCompressionInstances(): CompressionType[] {
    const instances: CompressionType[] = [];
    if (this.options.brotli) {
      instances.push(new BrotliCompression(this.options));
    } else if (this.options.deflate) {
      instances.push(new DeflateCompression(this.options));
    } else if (this.options.gzip) {
      instances.push(new GzipCompression(this.options));
    } else {
      instances.push(new GzipCompression(this.options));
    }
    return instances;
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
