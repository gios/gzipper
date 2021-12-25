import path from 'path';
import fs from 'fs';
import util from 'util';
import deepEqual from 'deep-equal';

import {
  clear,
  getFiles,
  GZIPPER_CONFIG_FOLDER,
  generatePaths,
  COMPRESSION_EXTENSIONS,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { LogLevel } from '../../../src/logger/LogLevel.enum';
import { INCREMENTAL_ENABLE_MESSAGE } from '../../../src/constants';
import {
  FileConfig,
  IncrementalFileValueRevision,
  IncrementalFileValue,
  CompressOptions,
} from '../../../src/interfaces';
import { Logger } from '../../../src/logger/Logger';

const fsExists = util.promisify(fs.exists);
const fsReadFile = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);

function getFileRevisions(
  config: FileConfig,
  filePath: string,
): IncrementalFileValueRevision[] {
  return config.incremental?.files[filePath].revisions || [];
}

function validateConfig(config: FileConfig, files: string[]): boolean {
  const version = config.version;
  const incremental = config.incremental;

  if (version && incremental) {
    const hasFiles = Object.keys(incremental.files).length === files.length;
    const hasRevisions = Object.values(incremental.files).every(
      (file) => file.revisions.length,
    );
    const hasRevisionConfig = Object.values(incremental.files)
      .map((file) => file.revisions)
      .every((revisions) =>
        revisions.every(
          (revision) =>
            revision.date &&
            revision.lastChecksum &&
            revision.fileId &&
            revision.options,
        ),
      );
    return hasFiles && hasRevisions && hasRevisionConfig;
  }

  return false;
}

describe('CLI Compress -> Incremental', () => {
  let testPath: string;
  let compressTestPath: string;

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.resetModules();
    [testPath, compressTestPath] = await generatePaths();
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  test('should compress files and create .gzipper folder', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = jest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);

    const exists = await fsExists(path.resolve(process.cwd(), './.gzipper'));
    expect(exists).toBeTruthy();
    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      INCREMENTAL_ENABLE_MESSAGE,
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      3,
      'Default output file format: [filename].[ext].[compressExt]',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${files.length} files have been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(2);
  });

  test('should generate .gzipperconfig', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const compress = new Compress(compressTestPath, null, options);
    const files = await getFiles(compressTestPath);
    await compress.run();

    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const exists = await fsExists(configPath);
    expect(exists).toBeTruthy();
    const fileConfig = await fsReadFile(configPath);
    const config = JSON.parse(fileConfig.toString());
    expect(validateConfig(config, files)).toBeTruthy();
  });

  test('should retrieve all files from cache', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const compress = new Compress(compressTestPath, null, options);

    await compress.run();
    const configBefore = JSON.parse((await fsReadFile(configPath)).toString());
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    await compress.run();
    const configAfter = JSON.parse((await fsReadFile(configPath)).toString());

    expect(configBefore).toEqual(configAfter);
  });

  test('should update "lastChecksum" and "date" revision if file was changed', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const compress = new Compress(compressTestPath, null, options);
    const fileToEdit = path.resolve(compressTestPath, './index.txt');

    await compress.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    const configBefore: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsBefore: Partial<IncrementalFileValueRevision>[] =
      getFileRevisions(configBefore, fileToEdit);

    const beforeFileContent = await fsReadFile(fileToEdit);
    await fsWriteFile(fileToEdit, 'New content which breaks checksum.');
    await compress.run();
    const configAfter: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsAfter: Partial<IncrementalFileValueRevision>[] =
      getFileRevisions(configAfter, fileToEdit);
    await fsWriteFile(fileToEdit, beforeFileContent);

    expect(fileRevisionsBefore[0]?.lastChecksum).not.toBe(
      fileRevisionsAfter[0]?.lastChecksum,
    );
    expect(fileRevisionsBefore[0]?.date).not.toBe(fileRevisionsAfter[0]?.date);

    delete fileRevisionsBefore[0]?.lastChecksum;
    delete fileRevisionsAfter[0]?.lastChecksum;
    delete fileRevisionsBefore[0]?.date;
    delete fileRevisionsAfter[0]?.date;

    expect(configBefore).toEqual(configAfter);
  });

  test('should update hash inside cache folder if file was changed', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(compressTestPath, null, options);
    const fileToEdit = path.resolve(compressTestPath, './index.txt');

    await compress.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    const config: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisions = getFileRevisions(config, fileToEdit);
    const hashPath = path.resolve(cachePath, fileRevisions[0].fileId);
    const hashContentBefore = await fsReadFile(hashPath);

    const beforeFileContent = await fsReadFile(fileToEdit);
    await fsWriteFile(fileToEdit, 'New content which breaks checksum.');
    await compress.run();
    await fsWriteFile(fileToEdit, beforeFileContent);
    const hashContentAfter = await fsReadFile(hashPath);

    expect(!hashContentBefore.equals(hashContentAfter)).toBeTruthy();
  });

  test('should add new revision if compress options were changed', async () => {
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const files = await getFiles(compressTestPath);

    const compress1 = new Compress(compressTestPath, null, {
      incremental: true,
      workers: 1,
    });
    await compress1.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);

    const compress2 = new Compress(compressTestPath, null, {
      incremental: true,
      gzipLevel: 8,
      workers: 1,
    });
    await compress2.run();
    const configAfter: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const revisions = Object.values(
      configAfter.incremental?.files as Record<string, IncrementalFileValue>,
    ).every(
      (file) =>
        file.revisions.length === 2 &&
        deepEqual(file.revisions[1].options, { level: 8 }),
    );
    const cachedFiles = await getFiles(cachePath);

    expect(revisions).toBeTruthy();
    expect(files.length * 2).toBe(cachedFiles.length);
  });

  test('should update certain revision if file was changed', async () => {
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const fileToEdit = path.resolve(compressTestPath, './index.txt');

    const compress1 = new Compress(compressTestPath, null, {
      incremental: true,
      workers: 1,
    });
    await compress1.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);

    const compress2 = new Compress(compressTestPath, null, {
      incremental: true,
      gzipLevel: 8,
      workers: 1,
    });
    await compress2.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    const configBefore: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsBefore = getFileRevisions(configBefore, fileToEdit);
    expect(fileRevisionsBefore.length).toBe(2);
    const fileRevisionBefore: Partial<IncrementalFileValueRevision> =
      fileRevisionsBefore.find((revision) =>
        deepEqual(revision.options, { level: 8 }),
      ) as IncrementalFileValueRevision;
    const hashPath = path.resolve(
      cachePath,
      fileRevisionBefore.fileId as string,
    );
    const hashContentBefore = await fsReadFile(hashPath);

    const compress3 = new Compress(compressTestPath, null, {
      incremental: true,
      gzipLevel: 8,
      workers: 1,
    });
    const beforeFileContent = await fsReadFile(fileToEdit);
    await fsWriteFile(fileToEdit, 'New content which breaks checksum.');
    await compress3.run();
    await fsWriteFile(fileToEdit, beforeFileContent);
    const hashContentAfter = await fsReadFile(hashPath);
    const configAfter: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsAfter = getFileRevisions(configAfter, fileToEdit);
    expect(fileRevisionsAfter.length).toBe(2);
    const fileRevisionAfter: Partial<IncrementalFileValueRevision> =
      fileRevisionsAfter.find((revision) =>
        deepEqual(revision.options, { level: 8 }),
      ) as IncrementalFileValueRevision;

    expect(!hashContentBefore.equals(hashContentAfter)).toBeTruthy();
    expect(fileRevisionBefore.lastChecksum).not.toBe(
      fileRevisionAfter.lastChecksum,
    );
    expect(fileRevisionBefore.date).not.toBe(fileRevisionAfter.date);

    delete fileRevisionBefore.lastChecksum;
    delete fileRevisionAfter.lastChecksum;
    delete fileRevisionBefore.date;
    delete fileRevisionAfter.date;

    expect(configBefore).toEqual(configAfter);
  });
});
