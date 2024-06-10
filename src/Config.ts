import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import { FileConfig } from './interfaces';
import { CONFIG_FILE, CONFIG_FOLDER } from './constants';
import { Helpers } from './helpers';

export class Config {
  private readonly _configFile: string;
  private _configContent: FileConfig = {} as FileConfig;

  get configContent(): Readonly<FileConfig> {
    return this._configContent;
  }

  set configContent(value: Readonly<FileConfig>) {
    this._configContent = value;
  }

  /**
   * Creates an instance of Config.
   */
  constructor() {
    this._configFile = path.resolve(process.cwd(), CONFIG_FOLDER, CONFIG_FILE);
    this.setProperty('version', Helpers.getVersion());
  }

  /**
   * Read config (.gzipperconfig).
   */
  async readConfig(): Promise<void> {
    if (await Helpers.checkFileExists(this._configFile)) {
      const response = await Helpers.readFile(this._configFile);
      this._configContent = JSON.parse(response.toString());
    }
  }

  /**
   * set additional data for property to config file (.gzipperconfig).
   */
  setProperty<T extends keyof FileConfig, K extends FileConfig[T]>(
    field: T,
    content: K,
  ): void {
    this._configContent[field] = content;
  }

  /**
   * delete property from config file (.gzipperconfig).
   */
  deleteProperty<T extends keyof FileConfig>(field: T): void {
    delete this._configContent[field];
  }

  /**
   * Init or update config (.gzipperconfig).
   */
  async writeConfig(): Promise<void> {
    await writeFile(
      path.resolve(this._configFile),
      JSON.stringify(this._configContent, null, 2),
    );
  }
}
