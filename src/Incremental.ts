import fs from 'fs';
import crypto from 'crypto';

export class Incremental {
  readonly fileChecksums = new Map<string, string>();
  /**
   * Create cache config (.gzippercache).
   */
  initCacheConfig() {}

  /**
   * Create cache folder (.gzipper).
   */
  initCacheFolder() {}

  /**
   * Returns file checksum.
   */
  async setFileChecksum(target: string): Promise<string> {
    console.log('AAAA ', target);
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(target);

    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data, 'utf8'));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', error => reject(error));
    });
  }
}
