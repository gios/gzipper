import sinon from 'sinon';
import assert from 'assert';
import zlib from 'zlib';
import path from 'path';
import fs from 'fs';
import util from 'util';
import deepEqual from 'deep-equal';

import {
  COMPRESSION_EXTENSIONS,
  COMPRESS_PATH,
  clear,
  getFiles,
  GZIPPER_CONFIG_FOLDER,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { LogLevel } from '../../../src/logger/LogLevel.enum';
import { INCREMENTAL_ENABLE_MESSAGE } from '../../../src/constants';
import {
  FileConfig,
  IncrementalFileValueRevision,
  IncrementalFileValue,
} from '../../../src/interfaces';

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
  let sinonSandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    sinonSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    await clear(GZIPPER_CONFIG_FOLDER, true);
    sinonSandbox.restore();
    sinon.restore();
  });

  it('should compress files and create .gzipper folder', async () => {
    const options = { verbose: true, threshold: 0, incremental: true };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    const exists = await fsExists(path.resolve(process.cwd(), './.gzipper'));
    assert.ok(exists);
    assert.ok(
      logSpy.calledWithExactly(INCREMENTAL_ENABLE_MESSAGE, LogLevel.INFO),
    );
    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        'Default output file format: [filename].[ext].[compressExt]',
        LogLevel.INFO,
      ),
    );
    assert.ok(
      logSpy.calledWithExactly(
        sinon.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(
      logSpy.withArgs(
        sinon.match(
          /File \w+\.\w+ has been compressed \d+\.?\d+ \w+ -> \d+\.?\d+ \w+ \(.+\)/,
        ),
      ).callCount,
      files.length,
    );
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 3);
  });

  it('should generate .gzipperconfig', async () => {
    const options = { threshold: 0, incremental: true };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const files = await getFiles(COMPRESS_PATH);
    await compress.run();

    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const exists = await fsExists(configPath);
    assert.ok(exists);
    const fileConfig = await fsReadFile(configPath);
    const config = JSON.parse(fileConfig.toString());
    assert.ok(validateConfig(config, files));
  });

  it('should retrieve all files from cache', async () => {
    const options = { threshold: 0, incremental: true };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const compress = new Compress(COMPRESS_PATH, null, options);
    const compressFileSpy = sinon.spy(compress as any, 'compressFile');

    await compress.run();
    const configBefore = JSON.parse((await fsReadFile(configPath)).toString());
    assert.ok(
      compressFileSpy.alwaysReturned(Promise.resolve({ isCached: false })),
    );

    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);

    await compress.run();
    const configAfter = JSON.parse((await fsReadFile(configPath)).toString());
    assert.ok(
      compressFileSpy.alwaysReturned(Promise.resolve({ isCached: true })),
    );

    assert.deepStrictEqual(configBefore, configAfter);
  });

  it('should update "lastChecksum" and "date" revision if file was changed', async () => {
    const options = { threshold: 0, incremental: true };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const compress = new Compress(COMPRESS_PATH, null, options);
    const fileToEdit = path.resolve(COMPRESS_PATH, './index.txt');

    await compress.run();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    const configBefore: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsBefore: Partial<IncrementalFileValueRevision>[] = getFileRevisions(
      configBefore,
      fileToEdit,
    );

    const beforeFileContent = await fsReadFile(fileToEdit);
    await fsWriteFile(fileToEdit, 'New content which breaks checksum.');
    await compress.run();
    const configAfter: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsAfter: Partial<IncrementalFileValueRevision>[] = getFileRevisions(
      configAfter,
      fileToEdit,
    );
    await fsWriteFile(fileToEdit, beforeFileContent);

    assert.notStrictEqual(
      fileRevisionsBefore[0]?.lastChecksum,
      fileRevisionsAfter[0]?.lastChecksum,
    );
    assert.notStrictEqual(
      fileRevisionsBefore[0]?.date,
      fileRevisionsAfter[0]?.date,
    );

    delete fileRevisionsBefore[0]?.lastChecksum;
    delete fileRevisionsAfter[0]?.lastChecksum;
    delete fileRevisionsBefore[0]?.date;
    delete fileRevisionsAfter[0]?.date;

    assert.deepStrictEqual(configBefore, configAfter);
  });

  it('should update hash inside cache folder if file was changed', async () => {
    const options = { threshold: 0, incremental: true };
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(COMPRESS_PATH, null, options);
    const fileToEdit = path.resolve(COMPRESS_PATH, './index.txt');

    await compress.run();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
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

    assert.ok(!hashContentBefore.equals(hashContentAfter));
  });

  it('should add new revision if compress options were changed', async () => {
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const files = await getFiles(COMPRESS_PATH);

    const compress1 = new Compress(COMPRESS_PATH, null, {
      threshold: 0,
      incremental: true,
    });
    await compress1.run();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);

    const compress2 = new Compress(COMPRESS_PATH, null, {
      threshold: 0,
      incremental: true,
      level: 8,
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

    assert.ok(revisions);
    assert.strictEqual(files.length * 2, cachedFiles.length);
  });

  it('should update certain revision if file was changed', async () => {
    const configPath = path.resolve(process.cwd(), './.gzipper/.gzipperconfig');
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const fileToEdit = path.resolve(COMPRESS_PATH, './index.txt');

    const compress1 = new Compress(COMPRESS_PATH, null, {
      threshold: 0,
      incremental: true,
    });
    await compress1.run();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);

    const compress2 = new Compress(COMPRESS_PATH, null, {
      threshold: 0,
      incremental: true,
      level: 8,
    });
    await compress2.run();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    const configBefore: FileConfig = JSON.parse(
      (await fsReadFile(configPath)).toString(),
    );
    const fileRevisionsBefore = getFileRevisions(configBefore, fileToEdit);
    assert.strictEqual(fileRevisionsBefore.length, 2);
    const fileRevisionBefore: Partial<IncrementalFileValueRevision> = fileRevisionsBefore.find(
      (revision) => deepEqual(revision.options, { level: 8 }),
    ) as IncrementalFileValueRevision;
    const hashPath = path.resolve(
      cachePath,
      fileRevisionBefore.fileId as string,
    );
    const hashContentBefore = await fsReadFile(hashPath);

    const compress3 = new Compress(COMPRESS_PATH, null, {
      threshold: 0,
      incremental: true,
      level: 8,
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
    assert.strictEqual(fileRevisionsAfter.length, 2);
    const fileRevisionAfter: Partial<IncrementalFileValueRevision> = fileRevisionsAfter.find(
      (revision) => deepEqual(revision.options, { level: 8 }),
    ) as IncrementalFileValueRevision;

    assert.ok(!hashContentBefore.equals(hashContentAfter));
    assert.notStrictEqual(
      fileRevisionBefore.lastChecksum,
      fileRevisionAfter.lastChecksum,
    );
    assert.notStrictEqual(fileRevisionBefore.date, fileRevisionAfter.date);

    delete fileRevisionBefore.lastChecksum;
    delete fileRevisionAfter.lastChecksum;
    delete fileRevisionBefore.date;
    delete fileRevisionAfter.date;

    assert.deepStrictEqual(configBefore, configAfter);
  });
});
