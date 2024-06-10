import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import deepEqual from 'deep-equal';
import { describe, beforeEach, afterEach, it, expect, vitest } from 'vitest';

import {
  clear,
  getFiles,
  GZIPPER_CONFIG_FOLDER,
  generatePaths,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { LogLevel } from '../../../src/logger/LogLevel.enum';
import {
  COMPRESSION_EXTENSIONS,
  INCREMENTAL_ENABLE_MESSAGE,
} from '../../../src/constants';
import {
  FileConfig,
  IncrementalFileValueRevision,
  IncrementalFileValue,
  CompressOptions,
} from '../../../src/interfaces';
import { Logger } from '../../../src/logger/Logger';
import { Helpers } from '../../../src/helpers';

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
    vitest.restoreAllMocks();
    vitest.resetModules();
    [testPath, compressTestPath] = await generatePaths();
    const processSpy = vitest.spyOn(global.process, 'cwd');
    processSpy.mockImplementation(() => testPath);
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  it('should compress files and create .gzipper folder', async () => {
    const options: CompressOptions = { incremental: true };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);
    const exists = await Helpers.checkFileExists(
      path.resolve(process.cwd(), './.gzipper'),
    );
    const instance = compress.compressionInstances[0];

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
    expect(instance.ext).toBe('gz');
    expect(Object.keys(instance.compressionOptions).length).toBe(0);
    expect(Object.keys(compress.options).length).toBe(1);
  });

  it('should generate .gzipperconfig', async () => {
    const options: CompressOptions = { incremental: true };
    const compress = new Compress(compressTestPath, null, options);
    const files = await getFiles(compressTestPath);
    await compress.run();

    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const exists = await Helpers.checkFileExists(configPath);
    const fileConfig = await readFile(configPath);
    const config = JSON.parse(fileConfig.toString());

    expect(exists).toBeTruthy();
    expect(validateConfig(config, files)).toBeTruthy();
  });

  it('should retrieve all files from cache', async () => {
    const options: CompressOptions = { incremental: true };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const compress = new Compress(compressTestPath, null, options);

    await compress.run();
    const configBefore = JSON.parse((await readFile(configPath)).toString());
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    await compress.run();
    const configAfter = JSON.parse((await readFile(configPath)).toString());

    expect(configBefore).toEqual(configAfter);
  });

  it('should update "lastChecksum" and "date" revision if file was changed', async () => {
    const options: CompressOptions = { incremental: true };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const compress = new Compress(compressTestPath, null, options);
    const fileToEdit = path.resolve(compressTestPath, './index.txt');

    await compress.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    const configBefore: FileConfig = JSON.parse(
      (await readFile(configPath)).toString(),
    );
    const fileRevisionsBefore: Partial<IncrementalFileValueRevision>[] =
      getFileRevisions(configBefore, fileToEdit);

    const beforeFileContent = await readFile(fileToEdit);
    await writeFile(fileToEdit, 'New content which breaks checksum.');
    await compress.run();
    const configAfter: FileConfig = JSON.parse(
      (await readFile(configPath)).toString(),
    );
    const fileRevisionsAfter: Partial<IncrementalFileValueRevision>[] =
      getFileRevisions(configAfter, fileToEdit);
    await writeFile(fileToEdit, beforeFileContent);

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

  it('should update hash inside cache folder if file was changed', async () => {
    const options: CompressOptions = { incremental: true };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(compressTestPath, null, options);
    const fileToEdit = path.resolve(compressTestPath, './index.txt');

    await compress.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    const config: FileConfig = JSON.parse(
      (await readFile(configPath)).toString(),
    );
    const fileRevisions = getFileRevisions(config, fileToEdit);
    const hashPath = path.resolve(cachePath, fileRevisions[0].fileId);
    const hashContentBefore = await readFile(hashPath);

    const beforeFileContent = await readFile(fileToEdit);
    await writeFile(fileToEdit, 'New content which breaks checksum.');
    await compress.run();
    await writeFile(fileToEdit, beforeFileContent);
    const hashContentAfter = await readFile(hashPath);

    expect(!hashContentBefore.equals(hashContentAfter)).toBeTruthy();
  });

  it('should add new revision if compress options were changed', async () => {
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const files = await getFiles(compressTestPath);

    const compress1 = new Compress(compressTestPath, null, {
      incremental: true,
    });
    await compress1.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);

    const compress2 = new Compress(compressTestPath, null, {
      incremental: true,
      gzipLevel: 8,
    });
    await compress2.run();
    const configAfter: FileConfig = JSON.parse(
      (await readFile(configPath)).toString(),
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

  it('should update certain revision if file was changed', async () => {
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const fileToEdit = path.resolve(compressTestPath, './index.txt');

    const compress1 = new Compress(compressTestPath, null, {
      incremental: true,
    });
    await compress1.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);

    const compress2 = new Compress(compressTestPath, null, {
      incremental: true,
      gzipLevel: 8,
    });
    await compress2.run();
    await clear(compressTestPath, COMPRESSION_EXTENSIONS);
    const configBefore: FileConfig = JSON.parse(
      (await readFile(configPath)).toString(),
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
    const hashContentBefore = await readFile(hashPath);

    const compress3 = new Compress(compressTestPath, null, {
      incremental: true,
      gzipLevel: 8,
    });
    const beforeFileContent = await readFile(fileToEdit);
    await writeFile(fileToEdit, 'New content which breaks checksum.');
    await compress3.run();
    await writeFile(fileToEdit, beforeFileContent);
    const hashContentAfter = await readFile(hashPath);
    const configAfter: FileConfig = JSON.parse(
      (await readFile(configPath)).toString(),
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
