import path from 'path';
import fs from 'fs';
import util from 'util';

const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);
const lstat = util.promisify(fs.lstat);
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
const rmdir = util.promisify(fs.rmdir);

export const EMPTY_FOLDER_PATH = path.resolve(
  __dirname,
  './resources/empty_folder',
);
export const COMPRESS_PATH = path.resolve(
  __dirname,
  './resources/folder_to_compress',
);
export const COMPRESS_PATH_TARGET = path.resolve(
  __dirname,
  './resources/compress_target',
);
export const NO_FILES_COMPRESS_PATH = path.resolve(
  __dirname,
  './resources/no_files_to_compress',
);

/**
 * Clear directory, extensions = true (delete all files), extensions = [.js, .ts] (only specific files)
 */
export async function clearDirectory(
  target = COMPRESS_PATH,
  extensions: string[] | boolean,
) {
  try {
    const force = typeof extensions === 'boolean' && extensions;
    const files: string[] = [];
    const filesList = await readdir(target);

    for (const file of filesList) {
      const filePath = path.resolve(target, file);
      const isFile = (await lstat(filePath)).isFile();
      const isDirectory = (await lstat(filePath)).isDirectory();

      if (isDirectory) {
        files.push(...(await clearDirectory(filePath, extensions)));
      } else if (isFile) {
        try {
          if (Array.isArray(extensions) && extensions.length) {
            if (extensions.includes(path.extname(filePath))) {
              await unlink(path.resolve(target, filePath));
              files.push(filePath);
            }
          } else if (force) {
            await unlink(path.resolve(target, filePath));
            files.push(filePath);
          }
        } catch (error) {
          throw error;
        }
      }
    }
    force && (await rmdir(target));
    return files;
  } catch (error) {
    throw error;
  }
}

export async function clear(directory: string, extensions: string[] | boolean) {
  await clearDirectory(directory, extensions);
}

export async function createFolder(target: string) {
  const folderPath = path.resolve(__dirname, target);
  const isExists = await statExists(folderPath);
  if (!isExists) {
    await mkdir(folderPath);
  }
  return folderPath;
}

export async function getFiles(
  target: string,
  filterByExtensions: string[] = [],
) {
  try {
    const files: string[] = [];
    const filesList = await readdir(target);

    for (const file of filesList) {
      const filePath = path.resolve(target, file);
      const isFile = (await lstat(filePath)).isFile();
      const isDirectory = (await lstat(filePath)).isDirectory();

      if (isDirectory) {
        files.push(...(await getFiles(filePath, filterByExtensions)));
      } else if (isFile) {
        if (filterByExtensions.length) {
          filterByExtensions.includes(path.extname(filePath)) &&
            files.push(filePath);
        } else {
          files.push(filePath);
        }
      }
    }
    return files;
  } catch (error) {
    throw new Error(error);
  }
}

function statExists(target: string) {
  return new Promise(async (resolve, reject) => {
    try {
      await stat(target);
      resolve(true);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        resolve(false);
      } else {
        reject(error);
      }
    }
  });
}
