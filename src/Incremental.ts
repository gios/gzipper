import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import util from 'util';
import { v4 } from 'uuid';
import deepEqual from 'deep-equal';

import { CACHE_FOLDER, CONFIG_FOLDER } from './constants';
import { Helpers } from './helpers';
import {
  Cache,
  FileConfig,
  IncrementalFileValue,
  IncrementalValueOf,
} from './interfaces';
import { Config } from './Config';

export class Incremental implements Cache {
  private readonly nativeFs = {
    exists: util.promisify(fs.exists),
    unlink: util.promisify(fs.unlink),
    readdir: util.promisify(fs.readdir),
    lstat: util.promisify(fs.lstat),
    rmdir: util.promisify(fs.rmdir),
  };
  private readonly config: Config;
  private readonly _cacheFolder: string;
  private _filePaths = new Map<string, IncrementalFileValue>();

  get cacheFolder(): string {
    return this._cacheFolder;
  }

  set filePaths(value: Record<string, IncrementalFileValue>) {
    this._filePaths = new Map(Object.entries(value));
  }

  /**
   * Creates an instance of Incremental.
   */
  constructor(config: Config) {
    this.config = config;
    this._cacheFolder = path.resolve(
      process.cwd(),
      CONFIG_FOLDER,
      CACHE_FOLDER,
    );
  }

  /**
   * overridden valueOf method.
   */
  valueOf(): IncrementalValueOf {
    return {
      config: this.config.valueOf(),
      filePaths: Object.fromEntries(this._filePaths),
    };
  }

  /**
   * Read config (.gzipperconfig).
   */
  async readConfig(): Promise<void> {
    if (await this.nativeFs.exists(this.config.configFile)) {
      const response = await Helpers.readFile(this.config.configFile);
      const data: FileConfig = JSON.parse(response.toString());
      if (data.incremental) {
        this._filePaths = new Map(Object.entries(data.incremental.files));
      }
    }
  }

  /**
   * update config (.gzipperconfig).
   */
  async updateConfig(): Promise<void> {
    this.config.setWritableContentProperty('incremental', {
      files: Helpers.mapToJSON(this._filePaths),
    });
  }

  /**
   * Create cache folder (.gzipper).
   */
  async initCacheFolder(): Promise<void> {
    if (!(await this.nativeFs.exists(this._cacheFolder))) {
      await Helpers.createFolders(this._cacheFolder);
    }
  }

  /**
   * Returns file incremental info and save checksum and options to `filePath` (if file is changed or newly created).
   */
  setFile(
    target: string,
    checksum: string,
    compressOptions: IncrementalFileValue['revisions'][number]['options'],
  ): {
    isChanged: boolean;
    fileId: string;
  } {
    const filePath = this._filePaths.get(target);
    const selectedRevision = filePath?.revisions.find((revision) =>
      deepEqual(revision.options, compressOptions),
    );

    if (!filePath) {
      const fileId = v4();
      this._filePaths.set(target, {
        revisions: [
          {
            lastChecksum: checksum,
            fileId,
            date: new Date(),
            options: compressOptions,
          },
        ],
      });

      return {
        isChanged: true,
        fileId,
      };
    }

    if (!selectedRevision) {
      const fileId = v4();
      this._filePaths.set(target, {
        revisions: filePath.revisions.concat({
          lastChecksum: checksum,
          fileId,
          date: new Date(),
          options: compressOptions,
        }),
      });

      return {
        isChanged: true,
        fileId,
      };
    }

    if (selectedRevision.lastChecksum !== checksum) {
      this._filePaths.set(target, {
        revisions: filePath.revisions.map((revision) => {
          return revision.fileId === selectedRevision.fileId
            ? { ...revision, date: new Date(), lastChecksum: checksum }
            : revision;
        }),
      });

      return {
        isChanged: true,
        fileId: selectedRevision.fileId,
      };
    }

    return {
      isChanged: false,
      fileId: selectedRevision.fileId,
    };
  }

  /**
   * Returns file checksum.
   */
  async getFileChecksum(target: string): Promise<string> {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(target);

    return new Promise((resolve, reject) => {
      stream.on('data', (data: string) => hash.update(data, 'utf8'));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Purge cache folder.
   */
  async cachePurge(): Promise<void> {
    if (!(await this.nativeFs.exists(this._cacheFolder))) {
      throw new Error('No cache found.');
    }

    const recursiveRemove = async (
      folderPath = this._cacheFolder,
    ): Promise<void> => {
      const files = await this.nativeFs.readdir(folderPath);

      for (const file of files) {
        const filePath = path.resolve(folderPath, file);
        const isDirectory = (await this.nativeFs.lstat(filePath)).isDirectory();

        if (isDirectory) {
          await recursiveRemove(filePath);
        } else {
          await this.nativeFs.unlink(filePath);
        }
      }

      await this.nativeFs.rmdir(folderPath);
    };

    await recursiveRemove();
    this.config.deleteWritableContentProperty('incremental');
    await this.config.writeConfig();
  }

  /**
   * Returns cache size.
   */
  async cacheSize(folderPath = this._cacheFolder, size = 0): Promise<number> {
    if (!(await this.nativeFs.exists(this._cacheFolder))) {
      throw new Error('No cache found.');
    }

    const files = await this.nativeFs.readdir(folderPath);

    if (!files.length) {
      return 0;
    }

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
