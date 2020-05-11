import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import util from 'util';
import uuid from 'uuid/v4';

import { CACHE_FOLDER, CONFIG_FILE } from './constants';
import { Helpers } from './helpers';
import { Purge, FileConfig } from './interfaces';

export class Incremental implements Purge {
  private readonly nativeFs = {
    writeFile: util.promisify(fs.writeFile),
    readFile: util.promisify(fs.readFile),
    exists: util.promisify(fs.exists),
    unlink: util.promisify(fs.unlink),
  };
  private readonly target: string;
  private readonly cacheFolder: string;
  private readonly configFile: string;
  private fileChecksums = new Map<
    string,
    { checksum: string; fileId: string }
  >();

  get cacheFolderPath(): string {
    return this.cacheFolder;
  }

  /**
   * Creates an instance of Incremental.
   */
  constructor(target: string) {
    this.target = target;
    this.cacheFolder = path.resolve(this.target, '..', CACHE_FOLDER);
    this.configFile = path.resolve(this.target, '..', CONFIG_FILE);
  }

  /**
   * Read config (.gzipperconfig).
   */
  async readConfig(): Promise<void> {
    if (await this.nativeFs.exists(this.configFile)) {
      const response = await this.nativeFs.readFile(this.configFile);
      const data: FileConfig = JSON.parse(response.toString());
      this.fileChecksums = new Map(Object.entries(data.incremental.files));
    }
  }

  /**
   * Create config (.gzipperconfig).
   */
  async initConfig(): Promise<void> {
    const writable = {
      incremental: {
        files: Helpers.mapToJSON(this.fileChecksums),
      },
    };
    await this.nativeFs.writeFile(
      path.resolve(this.configFile),
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

  /**
   * purge cache folder and configuration
   */
  async purge(): Promise<void> {
    await this.nativeFs.unlink(this.cacheFolder);
    const response = await this.nativeFs.readFile(this.configFile);
    const data: FileConfig = JSON.parse(response.toString());
    delete data.incremental;
    await this.nativeFs.writeFile(
      path.resolve(this.configFile),
      JSON.stringify(data, null, 2),
    );
  }
}
