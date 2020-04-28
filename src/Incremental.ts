import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import util from 'util';
import uuid from 'uuid/v4';

import { CACHE_FOLDER, CACHE_FILE } from './constants';
import { Helpers } from './helpers';

export class Incremental {
  private readonly nativeFs = {
    writeFile: util.promisify(fs.writeFile),
    readFile: util.promisify(fs.readFile),
    exists: util.promisify(fs.exists),
  };
  private readonly target: string;
  private readonly cacheFolder: string;
  private readonly cacheFile: string;
  private fileChecksums = new Map<
    string,
    { checksum: string; fileId: string }
  >();

  /**
   * Creates an instance of Incremental.
   */
  constructor(target: string) {
    this.target = target;
    this.cacheFolder = path.resolve(this.target, '..', CACHE_FOLDER);
    this.cacheFile = path.resolve(this.target, '..', CACHE_FILE);
  }

  /**
   * Read cache config (.gzippercache).
   */
  async readCacheConfig(): Promise<void> {
    if (await this.nativeFs.exists(this.cacheFile)) {
      const response = await this.nativeFs.readFile(this.cacheFile);
      const data = JSON.parse(response.toString());
      this.fileChecksums = new Map(Object.entries(data.files));
    }
  }

  /**
   * Create cache config (.gzippercache).
   */
  async initCacheConfig(): Promise<void> {
    const writable = {
      destination: this.target,
      files: Helpers.mapToJSON(this.fileChecksums),
    };
    await this.nativeFs.writeFile(
      path.resolve(this.cacheFile),
      JSON.stringify(writable, null, 2),
    );
  }

  /**
   * Create cache folder (.gzipper).
   */
  async initCacheFolder(): Promise<void> {
    await Helpers.createFolders(path.resolve(this.cacheFolder));
  }

  /**
   * Returns file checksum.
   */
  async setFileChecksum(
    target: string,
  ): Promise<{ isChanged: boolean; fileId?: string }> {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(target);

    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data, 'utf8'));
      stream.on('end', () => {
        const checksum = hash.digest('hex');
        const isChanged = this.fileChecksums.get(target)?.checksum !== checksum;
        if (isChanged) {
          this.fileChecksums.set(target, { checksum, fileId: uuid() });
        }
        resolve({
          isChanged,
          fileId: this.fileChecksums.get(target)?.fileId,
        });
      });
      stream.on('error', error => reject(error));
    });
  }
}
