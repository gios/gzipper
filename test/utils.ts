import path from 'path';
import fs from 'fs';
import util from 'util';
import { v4 } from 'uuid';

const unlink = util.promisify(fs.unlink);
const copyFile = util.promisify(fs.copyFile);
const mkdir = util.promisify(fs.mkdir);
const lstat = util.promisify(fs.lstat);
const exists = util.promisify(fs.exists);
const readdir = util.promisify(fs.readdir);
const rmdir = util.promisify(fs.rmdir);

interface GeneratePathsOptions {
  excludeBig: boolean;
}

export const RESOURCES_FOLDER_PATH = path.resolve(__dirname, './resources');
export const TEST_FOLDER_PATH = path.resolve(__dirname, './tmp-test-folder');
export const GZIPPER_CONFIG_FOLDER = path.resolve(process.cwd(), './.gzipper');
export const COMPRESS_PATH = path.resolve(
  RESOURCES_FOLDER_PATH,
  './folder_to_compress',
);
const BIG_FILE_NAME = './big.js';

function filterByExtension(extensions: string[], ext: string): boolean {
  return !!extensions.find((fileExtension) => {
    if (fileExtension.startsWith('!')) {
      return fileExtension.slice(1) !== ext;
    }
    return fileExtension === ext;
  });
}

export async function generatePaths(
  options: GeneratePathsOptions = {
    excludeBig: false,
  },
): Promise<string[]> {
  const tmpDir = path.resolve(TEST_FOLDER_PATH, `./tmp-${v4()}`);
  const compressPath = path.resolve(tmpDir, `./tmp-compress-${v4()}`);
  const emptyFolderPath = path.resolve(tmpDir, `./tmp-empty-folder-${v4()}`);
  const compressTargetPath = path.resolve(
    tmpDir,
    `./tmp-compress-target-${v4()}`,
  );
  await copyFolder(COMPRESS_PATH, compressPath);
  options.excludeBig && unlink(path.resolve(compressPath, BIG_FILE_NAME));
  await createFolder(compressTargetPath);
  await createFolder(emptyFolderPath);
  return [tmpDir, compressPath, compressTargetPath, emptyFolderPath];
}

export async function clearDirectory(
  target = COMPRESS_PATH,
  extensions: string[] | boolean,
): Promise<string[]> {
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
      if (Array.isArray(extensions) && extensions.length) {
        if (extensions.includes(path.extname(filePath).slice(1))) {
          await unlink(path.resolve(target, filePath));
          files.push(filePath);
        }
      } else if (force) {
        await unlink(path.resolve(target, filePath));
        files.push(filePath);
      }
    }
  }
  force && (await rmdir(target));
  return files;
}

/**
 * Clear directory, extensions = true (delete all files), extensions = [js, ts] (only specific files)
 */
export async function clear(
  directory: string,
  extensions: string[] | boolean,
): Promise<void> {
  if (await exists(directory)) {
    await clearDirectory(directory, extensions);
  }
}

export async function createFolder(target: string): Promise<string> {
  const folderPath = path.resolve(__dirname, target);
  const isExists = await exists(folderPath);
  if (!isExists) {
    await mkdir(folderPath, { recursive: true });
  }
  return folderPath;
}

export async function getFiles(
  target: string,
  extensions: string[] = [],
): Promise<string[]> {
  const files: string[] = [];
  const filesList = await readdir(target);

  for (const file of filesList) {
    const filePath = path.resolve(target, file);
    const isFile = (await lstat(filePath)).isFile();
    const isDirectory = (await lstat(filePath)).isDirectory();

    if (isDirectory) {
      files.push(...(await getFiles(filePath, extensions)));
    } else if (isFile) {
      if (extensions.length) {
        filterByExtension(extensions, path.extname(filePath)) &&
          files.push(filePath);
      } else {
        files.push(filePath);
      }
    }
  }
  return files;
}

export async function copyFolder(
  target: string,
  destination: string,
): Promise<void> {
  const filesList = await readdir(target);

  for (const file of filesList) {
    const targetFilePath = path.resolve(target, file);
    const destinationFilePath = path.resolve(destination, file);
    const isFile = (await lstat(targetFilePath)).isFile();
    const isDirectory = (await lstat(targetFilePath)).isDirectory();

    if (isDirectory) {
      await createFolder(destinationFilePath);
      await copyFolder(targetFilePath, destinationFilePath);
    } else if (isFile) {
      await copyFile(targetFilePath, destinationFilePath);
    }
  }
}
