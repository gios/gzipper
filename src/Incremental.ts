import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import util from 'util';
import { v4 } from 'uuid';

import { CACHE_FOLDER, CONFIG_FOLDER } from './constants';
import { Helpers } from './helpers';
import { Cache, FileConfig } from './interfaces';
import { Config } from './Config';

export class Incremental implements Cache {
  readonly cacheFolder: string;
  private readonly nativeFs = {
    readFile: util.promisify(fs.readFile),
    exists: util.promisify(fs.exists),
    unlink: util.promisify(fs.unlink),
    readdir: util.promisify(fs.readdir),
    lstat: util.promisify(fs.lstat),
  };
  private readonly config: Config;
  private fileChecksums = new Map<
    string,
    { checksum: string; fileId: string }
  >();

  /**
   * Creates an instance of Incremental.
   */
  constructor(config: Config) {
    this.config = config;
    this.cacheFolder = path.resolve(process.cwd(), CONFIG_FOLDER, CACHE_FOLDER);
  }

  /**
   * Read config (.gzipperconfig).
   */
  async readConfig(): Promise<void> {
    if (await this.nativeFs.exists(this.config.configFile)) {
      const response = await this.nativeFs.readFile(this.config.configFile);
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
   * purge cache folder.
   */
  async cachePurge(): Promise<void> {
    await this.nativeFs.unlink(this.cacheFolder);
    this.config.deleteWritableContentProperty('incremental');
  }

  /**
   * returns cache size.
   */
  async cacheSize(folderPath = this.cacheFolder, size = 0): Promise<number> {
    const files = await this.nativeFs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.resolve(folderPath, file);
      const fileStat = await this.nativeFs.lstat(filePath);

      if (fileStat.isDirectory()) {
        size += await this.cacheSize(filePath, size);
      } else if (fileStat.isFile()) {
        size += fileStat.size;
      }
    }
    return size;
  }
}
