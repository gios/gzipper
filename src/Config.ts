import path from 'path';
import util from 'util';
import fs from 'fs';

import { FileConfig } from './interfaces';
import { CONFIG_FILE } from './constants';

export class Config {
  private readonly nativeFs = {
    writeFile: util.promisify(fs.writeFile),
  };
  private readonly writableContent!: FileConfig;
  private readonly configFile: string;

  get configFilePath(): string {
    return this.configFile;
  }

  /**
   * Creates an instance of Config.
   */
  constructor(target: string) {
    this.configFile = path.resolve(target, '..', CONFIG_FILE);
  }

  /**
   * set additional data to config file (.gzipperconfig).
   */
  setWritableContent<T extends FileConfig[keyof FileConfig]>(
    field: keyof FileConfig,
    content: T | null,
  ): void {
    this.writableContent[field] = content;
  }

  /**
   * Init or update config (.gzipperconfig).
   */
  async writeConfig(): Promise<void> {
    await this.nativeFs.writeFile(
      path.resolve(this.configFile),
      JSON.stringify(this.writableContent || '', null, 2),
    );
  }
}
