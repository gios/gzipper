import { BrotliCompression } from './compressions/Brotli';
import { DeflateCompression } from './compressions/Deflate';
import { GzipCompression } from './compressions/Gzip';
import { ZopfliCompression } from './compressions/Zopfli';
import { ZstdCompression } from './compressions/Zstd';
import { COMPRESSION_EXTENSIONS } from './constants';
import { CompressionExtensions } from './enums';
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
  public isValidFileExtensions(ext: CompressionExtensions): boolean {
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
