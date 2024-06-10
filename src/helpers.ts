import { createReadStream } from 'node:fs';
import { mkdir, access } from 'node:fs/promises';
import os from 'node:os';

import * as pack from '../package.json';

export class Helpers {
  /**
   * Create folders by path.
   */
  static async createFolders(target: string): Promise<void> {
    await mkdir(target, { recursive: true });
  }

  /**
   * Convert Map to JSON.
   */
  static mapToJSON<K extends string, V>(map: Map<K, V>): Record<K, V> {
    return Array.from(map).reduce(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {} as Record<K, V>,
    );
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
  static readableSize(bytes: number): string {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return `${Number((bytes / Math.pow(1024, i)).toFixed(2)).toString()} ${
      sizes[i] || 'b'
    }`;
  }

  /**
   * returns readable format from hrtime.
   */
  static readableHrtime(hrTime: [number, number]): string {
    const [seconds, nanoseconds] = hrTime;
    return `${seconds ? seconds + 's ' : ''}${nanoseconds / 1e6}ms`;
  }

  /**
   * Read file via readable stream.
   */
  static async readFile(file: string): Promise<string> {
    let data = '';
    const stream = createReadStream(file, { encoding: 'utf8' });

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => (data += chunk));
      stream.on('end', () => resolve(data));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * Splits array into equal chunks.
   */
  static chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  /**
   * Returns number of CPU cores.
   */
  static getCPUs(): number {
    return os.cpus().length;
  }

  /**
   * Filter object by predicate.
   */
  static filterObject<T>(
    obj: T,
    predicate: (key: string, item: T[Extract<keyof T, string>]) => boolean,
  ): T {
    const result = {} as T;

    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        predicate(key, obj[key])
      ) {
        result[key] = obj[key];
      }
    }

    return result;
  }

  /**
   * Returns color option based on GZIPPER_NO_COLOR and NO_COLOR vars.
   */
  static getLogColor(
    defaultValue = true,
    env: NodeJS.ProcessEnv = process.env,
  ): boolean {
    return !(env.GZIPPER_NO_COLOR
      ? !!parseInt(env.GZIPPER_NO_COLOR as string)
      : env.NO_COLOR
        ? !!parseInt(env.NO_COLOR as string)
        : !defaultValue);
  }

  /**
   * Returns true if file exists, otherwise false.
   */
  static async checkFileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
