import path from 'path';
import util from 'util';
import fs from 'fs';

import { ConfigValueOf, FileConfig } from './interfaces';
import { CONFIG_FILE, CONFIG_FOLDER } from './constants';
import { Helpers } from './helpers';

export class Config {
  private readonly nativeFs = {
    writeFile: util.promisify(fs.writeFile),
  };
  private readonly _configFile: string;
  private _writableContent: FileConfig = {} as FileConfig;

  get configFile(): string {
    return this._configFile;
  }

  set writableContent(value: FileConfig) {
    this._writableContent = value;
  }

  /**
   * Creates an instance of Config.
   */
  constructor() {
    this._configFile = path.resolve(process.cwd(), CONFIG_FOLDER, CONFIG_FILE);
    this.setWritableContentProperty('version', Helpers.getVersion());
  }

  /**
   * overridden valueOf method.
   */
  valueOf(): ConfigValueOf {
    return {
      writableContent: this._writableContent,
    };
  }

  /**
   * set additional data for property to config file (.gzipperconfig).
   */
  setWritableContentProperty<
    T extends keyof FileConfig,
    K extends FileConfig[T]
  >(field: T, content: K): void {
    this._writableContent[field] = content;
  }

  /**
   * delete property from config file (.gzipperconfig).
   */
  deleteWritableContentProperty<T extends keyof FileConfig>(field: T): void {
    delete this._writableContent[field];
  }

  /**
   * Init or update config (.gzipperconfig).
   */
  async writeConfig(): Promise<void> {
    await this.nativeFs.writeFile(
      path.resolve(this._configFile),
      JSON.stringify(this._writableContent, null, 2),
    );
  }
}
