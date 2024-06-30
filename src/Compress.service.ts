import { BrotliCompression } from './compressions/Brotli.js';
import { DeflateCompression } from './compressions/Deflate.js';
import { GzipCompression } from './compressions/Gzip.js';
import { ZopfliCompression } from './compressions/Zopfli.js';
import { ZstdCompression } from './compressions/Zstd.js';
import { COMPRESSION_EXTENSIONS } from './constants.js';
import { CompressionExtensions } from './enums.js';
import { CompressionType, CompressOptions } from './interfaces.js';

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
  getCompressionInstances(): CompressionType[] {
    const instances: CompressionType[] = [];
    if (this.options.brotli) {
      instances.push(new BrotliCompression(this.options));
    }

    if (this.options.deflate) {
      instances.push(new DeflateCompression(this.options));
    }

    if (this.options.zopfli) {
      instances.push(new ZopfliCompression(this.options));
    }

    if (this.options.zstd) {
      instances.push(new ZstdCompression(this.options));
    }

    if (this.options.gzip || !instances.length) {
      instances.push(new GzipCompression(this.options));
    }
    return instances;
  }

  /**
   * Returns if the file extension is valid.
   */
  isValidFileExtensions(ext: CompressionExtensions): boolean {
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
