import fs from 'fs';
import util from 'util';

import * as pack from '../package.json';

export class Helpers {
  private static readonly nativeFs = {
    mkdir: util.promisify(fs.mkdir),
  };

  /**
   * Create folders by path.
   */
  static async createFolders(target: string): Promise<void> {
    await this.nativeFs.mkdir(target, { recursive: true });
  }

  /**
   * Convert Map to JSON.
   */
  static mapToJSON<K extends string, V>(map: Map<K, V>): Record<K, V> {
    return Array.from(map).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<K, V>);
  }

  /**
   * Returns package version.
   */
  static getVersion(): string {
    return pack.version;
  }

  /**
   * Converts a long string of bytes into a readable format e.g KB, MB, GB, TB, YB
   */
  static readableBytes(bytes: number): string {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return `${Number(
      (bytes / Math.pow(1024, i)).toFixed(2),
    ).toString()} ${sizes[i] || 'b'}`;
  }
}