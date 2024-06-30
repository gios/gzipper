import { createReadStream, readFileSync } from 'node:fs';
import { mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import os from 'node:os';

/**
 * Create folders by path.
 */
export async function createFolders(target: string): Promise<void> {
  await mkdir(target, { recursive: true });
}

/**
 * Convert Map to JSON.
 */
export function mapToJSON<K extends string, V>(map: Map<K, V>): Record<K, V> {
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
export function getVersion(): string {
  const file = readFileSync(
    resolve(import.meta.dirname, '../package.json'),
    'utf-8',
  );
  return JSON.parse(file).version;
}

/**
 * Converts a long string of bytes into a readable format e.g KB, MB, GB, TB, YB
 */
export function readableSize(bytes: number): string {
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  return `${Number((bytes / Math.pow(1024, i)).toFixed(2)).toString()} ${
    sizes[i] || 'b'
  }`;
}

/**
 * returns readable format from hrtime.
 */
export function readableHrtime(hrTime: [number, number]): string {
  const [seconds, nanoseconds] = hrTime;
  return `${seconds ? seconds + 's ' : ''}${nanoseconds / 1e6}ms`;
}

/**
 * Read file via readable stream.
 */
export async function readFile(file: string): Promise<string> {
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
export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Returns number of CPU cores.
 */
export function getCPUs(): number {
  return os.cpus().length;
}

/**
 * Filter object by predicate.
 */
export function filterObject<T>(
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
export function getLogColor(
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
export async function checkFileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
