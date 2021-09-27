import assert from 'assert';
import sinon from 'sinon';
import path from 'path';
import util from 'util';
import fs from 'fs';

import { Compress } from '../../../src/Compress';
import {
  EMPTY_FOLDER_PATH,
  COMPRESS_PATH,
  COMPRESS_PATH_TARGET,
  getFiles,
  createFolder,
  clear,
  COMPRESSION_EXTENSIONS,
} from '../../utils';
import { CompressOptions } from '../../../src/interfaces';
import { NO_FILES_MESSAGE } from '../../../src/constants';
import { LogLevel } from '../../../src/logger/LogLevel.enum';
import { Logger } from '../../../src/logger/Logger';

const fsLstat = util.promisify(fs.lstat);

describe('CLI Compress', () => {
  let sinonSandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    await createFolder(EMPTY_FOLDER_PATH);
    await createFolder(COMPRESS_PATH_TARGET);
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    sinonSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    await clear(EMPTY_FOLDER_PATH, true);
    await clear(COMPRESS_PATH_TARGET, true);
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    sinonSandbox.restore();
    sinon.restore();
  });

  async function validateOutputFileFormat(
    options: CompressOptions,
  ): Promise<[Compress, string[], string[]]> {
    const compress = new Compress(COMPRESS_PATH, COMPRESS_PATH_TARGET, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    const files = await getFiles(COMPRESS_PATH);
    await compress.run();
    const compressedFiles = await getFiles(COMPRESS_PATH_TARGET);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.neverCalledWith(
        'Default output file format: [filename].[ext].[compressExt]',
        LogLevel.INFO,
      ),
    );
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(
            `${compressedFiles.length} files have been compressed. (.+)`,
          ),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
    assert.strictEqual(
      (compress as any).options.outputFileFormat,
      options.outputFileFormat,
    );

    return [compress, files, compressedFiles];
  }

  it('should throw an error if no path found', () => {
    try {
      new Compress(null as any, null);
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, `Can't find a path.`);
    }
  });

  it('should throw on compress error', async () => {
    const compress = new Compress(COMPRESS_PATH, null, {
      workers: 1,
    });
    const createWorkersSpy = sinonSandbox.spy(compress, 'createWorkers' as any);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    sinonSandbox
      .stub(compress, 'runCompressWorker' as any)
      .rejects(new Error('Compressing error.'));

    try {
      await compress.run();
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, 'Compressing error.');
      assert.ok(createWorkersSpy.calledOnce);
      assert.ok(
        logSpy.calledWithExactly(
          sinonSandbox.match.instanceOf(Error),
          LogLevel.ERROR,
        ),
      );
      assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    }
  });

  it('should print message about appropriate files', async () => {
    const options: CompressOptions = {
      exclude: [
        'js',
        'css',
        'html',
        'png',
        'jpg',
        'jpeg',
        'webp',
        'svg',
        'json',
        'csv',
        'txt',
        'xml',
        'ico',
        'md',
        'gif',
        'sunny',
      ],
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(logSpy.calledWithExactly(NO_FILES_MESSAGE, LogLevel.WARNING));
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should print message about empty folder', async () => {
    const compress = new Compress(EMPTY_FOLDER_PATH, null, {
      workers: 1,
    });
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(logSpy.calledWithExactly(NO_FILES_MESSAGE, LogLevel.WARNING));
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 1);
  });

  it('should compress a single file to a certain folder', async () => {
    const file = `${COMPRESS_PATH}${path.sep}index.txt`;
    const compress = new Compress(file, COMPRESS_PATH_TARGET, {
      workers: 1,
    });
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const compressedFiles = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        'Default output file format: [filename].[ext].[compressExt]',
        LogLevel.INFO,
      ),
    );
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(/1 file has been compressed\. \(.+\)/),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(compressedFiles.length, 1);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 1);
  });

  it('should compress files to a certain folder with existing folder structure', async () => {
    const compress = new Compress(COMPRESS_PATH, COMPRESS_PATH_TARGET, {
      workers: 1,
    });
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH);
    const compressedFiles = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    const filesRelative = files.map((file) =>
      path.relative(COMPRESS_PATH, file),
    );
    const compressedRelative = compressedFiles.map((file) =>
      path.relative(COMPRESS_PATH_TARGET, file),
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
        sinonSandbox.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(files.length, compressedFiles.length);
    for (const file of filesRelative) {
      assert.ok(
        compressedRelative.some((compressedFile) => {
          const withoutExtFile = compressedFile.replace(
            path.basename(compressedFile),
            path.parse(path.basename(compressedFile)).name,
          );
          return withoutExtFile === file;
        }),
      );
    }
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 1);
  });

  it('should use default file format artifacts via --output-file-format', async () => {
    const options: CompressOptions = { workers: 1 };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    const files = await getFiles(COMPRESS_PATH);
    await compress.run();
    const compressedFiles = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        'Default output file format: [filename].[ext].[compressExt]',
        LogLevel.INFO,
      ),
    );
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(
            `${compressedFiles.length} files have been compressed. (.+)`,
          ),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 1);
    assert.strictEqual((compress as any).options.outputFileFormat, undefined);

    for (const [index, compressedFile] of compressedFiles.entries()) {
      const compressedFileName = path.basename(compressedFile, '.gz');
      const fileName = path.basename(files[index]);
      assert.strictEqual(fileName, compressedFileName);
    }
  });

  it('should set custom file format artifacts (test-[filename]-55-[filename].[compressExt]x.[ext]) via --output-file-format', async () => {
    const options: CompressOptions = {
      outputFileFormat: 'test-[filename]-55-[filename].[compressExt]x.[ext]',
      workers: 1,
    };

    const [compress, files, compressedFiles] = await validateOutputFileFormat(
      options,
    );
    const compressedFilesNames = compressedFiles.map((file) =>
      path.basename(file),
    );

    for (const file of files) {
      const fileExt = path.extname(file);
      const fileName = path.basename(file, fileExt);
      const output = `test-${fileName}-55-${fileName}.${
        (compress as any).compressionInstance.ext
      }x${fileExt}`;
      assert.ok(compressedFilesNames.includes(output));
    }
  });

  it('should set custom file format artifacts ([filename]-[hash]-55.[ext]) via --output-file-format', async () => {
    const options: CompressOptions = {
      outputFileFormat: '[filename]-[hash]-55.[ext]',
      workers: 1,
    };

    const [, files, compressedFiles] = await validateOutputFileFormat(options);
    const compressedFilesNames = compressedFiles.map((file) =>
      path.basename(file),
    );

    for (const file of files) {
      const fileExt = path.extname(file);
      const fileName = path.basename(file, fileExt);
      assert.ok(
        compressedFilesNames.find((file) =>
          new RegExp(`${fileName}-.*-55${fileExt}`, 'g').test(file),
        ),
      );
    }
  });

  it('should --include specific file extensions for compression (also exclude others)', async () => {
    const options: CompressOptions = {
      include: ['sunny'],
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(`${files.length} file has been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(files.length, 1);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should --exclude file extensions from compression jpeg,jpg', async () => {
    const options: CompressOptions = {
      exclude: ['jpeg', 'jpg'],
      workers: 1,
    };
    const beforeFiles = (await getFiles(COMPRESS_PATH)).filter((file) => {
      const ext = path.extname(file);
      return !(ext === '.jpeg' || ext === '.jpg');
    });
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(beforeFiles.length, files.length);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should --exclude compression extensions', async () => {
    const options: CompressOptions = {
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();
    const filesBefore = await getFiles(COMPRESS_PATH, ['.gz']);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(`${filesAfter.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(filesBefore.length, filesAfter.length);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 1);
  });

  it('should exclude file sizes smaller than 860 bytes from compression', async () => {
    const THRESHOLD = 860;
    const options: CompressOptions = {
      threshold: THRESHOLD,
      workers: 1,
    };
    let includedFiles = 0;
    const files = await getFiles(COMPRESS_PATH);
    for (const filePath of files) {
      const { size: fileSize } = await fsLstat(filePath);
      if (fileSize < THRESHOLD) {
        continue;
      }
      ++includedFiles;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const filesGzipped = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(`${filesGzipped.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(filesGzipped.length, includedFiles);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('--remove-larger should remove compressed files', async () => {
    const options: CompressOptions = {
      removeLarger: true,
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(files.length, 6);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('--skip-compressed should skip compressed files', async () => {
    const options: CompressOptions = {
      skipCompressed: true,
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, COMPRESS_PATH_TARGET, options);
    await compress.run();

    const filesBefore = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly('No files for compression.', LogLevel.WARNING),
    );
    assert.strictEqual(filesBefore.length, filesAfter.length);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('--skip-compressed should skip compressed files (same folder)', async () => {
    const options: CompressOptions = {
      skipCompressed: true,
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();

    const filesBefore = await getFiles(COMPRESS_PATH, ['.gz']);

    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly('No files for compression.', LogLevel.WARNING),
    );
    assert.strictEqual(filesBefore.length, filesAfter.length);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('--skip-compressed should skip compressed files with appropriate message', async () => {
    const options: CompressOptions = {
      skipCompressed: true,
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();

    const filesBefore = await getFiles(COMPRESS_PATH, ['.gz']);

    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly('No files for compression.', LogLevel.WARNING),
    );
    assert.strictEqual(filesBefore.length, filesAfter.length);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it.only('--brotli --deflate --gzip should run simultaneously', async () => {
    const options: CompressOptions = {
      workers: 1,
      gzip: true,
      brotli: true,
      deflate: true,
      gzipMemoryLevel: 1,
      deflateLevel: 3,
      brotliQuality: 2,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz', '.br', '.zz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinonSandbox.match(
          new RegExp(`${files.length} file has been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(files.length, 1);
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 6);
  });
});
