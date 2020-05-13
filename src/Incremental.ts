import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import util from 'util';
import { v4 } from 'uuid';

import { CACHE_FOLDER, CONFIG_FOLDER } from './constants';
import { Helpers } from './helpers';
import { Purge, FileConfig } from './interfaces';
import { Config } from './Config';

export class Incremental implements Purge {
  private readonly nativeFs = {
    writeFile: util.promisify(fs.writeFile),
    readFile: util.promisify(fs.readFile),
    exists: util.promisify(fs.exists),
    unlink: util.promisify(fs.unlink),
  };
  private readonly target: string;
  private readonly cacheFolder: string;
  private readonly config: Config;
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
  constructor(target: string, config: Config) {
    this.target = target;
    this.config = config;
    this.cacheFolder = path.resolve(
      this.target,
      '..',
      CONFIG_FOLDER,
      CACHE_FOLDER,
    );
  }

  /**
   * Read config (.gzipperconfig).
   */
  async readConfig(): Promise<void> {
    if (await this.nativeFs.exists(this.config.configFilePath)) {
      const response = await this.nativeFs.readFile(this.config.configFilePath);
      const data: FileConfig = JSON.parse(response.toString());
      if (data.incremental) {
        this.fileChecksums = new Map(Object.entries(data.incremental.files));
      }
    }
  }

  /**
   * update config (.gzipperconfig).
   */
  async updateConfig(): Promise<void> {
    this.config.setWritableContentProperty('incremental', {
      files: Helpers.mapToJSON(this.fileChecksums),
    });
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
          this.fileChecksums.set(target, { checksum, fileId: v4() });
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
   * purge cache folder and configuration.
   */
  async purge(): Promise<void> {
    await this.nativeFs.unlink(this.cacheFolder);
    this.config.deleteWritableContentProperty('incremental');
  }

  /**
   * returns cache size.
   */
  async cacheSize(): Promise<string> {
    return 'under development';
  }
}
