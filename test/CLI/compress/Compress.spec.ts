import assert from 'assert';
import sinon from 'sinon';
import zlib from 'zlib';
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

const fsLstat = util.promisify(fs.lstat);

async function validateOutputPathOptions(
  options: CompressOptions,
): Promise<[Compress, sinon.SinonSpy]> {
  const compress = new Compress(COMPRESS_PATH, COMPRESS_PATH_TARGET, options);
  const logSpy = sinon.spy((compress as any).logger, 'log');
  const getOutputPathSpy = sinon.spy(compress, 'getOutputPath' as any);
  await compress.run();
  const files = await getFiles(COMPRESS_PATH_TARGET);

  assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
  assert.ok(
    logSpy.neverCalledWith(
      'Default output file format: [filename].[ext].[compressExt]',
      LogLevel.INFO,
    ),
  );
  assert.ok(
    logSpy.calledWithExactly(
      sinon.match(
        new RegExp(`${files.length} files have been compressed\. \(.+\)`),
      ),
      LogLevel.SUCCESS,
    ),
  );
  assert.strictEqual(getOutputPathSpy.callCount, files.length);
  assert.ok(
    (compress as any).createCompression() instanceof (zlib as any).Gzip,
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

  return [compress, getOutputPathSpy];
}

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

  it('should throw an error if no path found', () => {
    try {
      new Compress(null as any, null);
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, `Can't find a path.`);
    }
  });

  it('should throw on compress error', async () => {
    const compress = new Compress(COMPRESS_PATH, null);
    const compileFolderRecursivelySpy = sinon.spy(
      compress,
      'compileFolderRecursively' as any,
    );
    const logSpy = sinon.spy((compress as any).logger, 'log');
    sinonSandbox
      .stub(compress, 'compressFile' as any)
      .rejects(new Error('Compressing error.'));

    try {
      await compress.run();
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, 'Compressing error.');
      assert.ok(compileFolderRecursivelySpy.calledWithExactly(COMPRESS_PATH));
      assert.ok(
        logSpy.calledWithExactly(sinon.match.instanceOf(Error), LogLevel.ERROR),
      );
      assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    }
  });

  it('should print message about appropriate files', async () => {
    const options = {
      threshold: 0,
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
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(logSpy.calledWithExactly(NO_FILES_MESSAGE, LogLevel.WARNING));
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should print message about empty folder', async () => {
    const compress = new Compress(EMPTY_FOLDER_PATH, null);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(logSpy.calledWithExactly(NO_FILES_MESSAGE, LogLevel.WARNING));
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 0);
  });

  it('--verbose should print logs to console and use default configuration', async () => {
    const options = { verbose: true, threshold: 0 };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

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
          new RegExp(`${files.length} files have been compressed\. \(.+\)`),
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
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should compress a single file to a certain folder', async () => {
    const file = `${COMPRESS_PATH}${path.sep}index.txt`;
    const compress = new Compress(file, COMPRESS_PATH_TARGET);
    const logSpy = sinon.spy((compress as any).logger, 'log');
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
        sinon.match(/1 file has been compressed\. \(.+\)/),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(compressedFiles.length, 1);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 0);
  });

  it('should compress files to a certain folder with existing folder structure', async () => {
    const compress = new Compress(COMPRESS_PATH, COMPRESS_PATH_TARGET);
    const logSpy = sinon.spy((compress as any).logger, 'log');
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
        sinon.match(
          new RegExp(`${files.length} files have been compressed\. \(.+\)`),
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
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 0);
  });

  it('should use default file format artifacts via --output-file-format and print to console via --verbose flag', async () => {
    const options = { verbose: true, threshold: 0 };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    const getOutputPathSpy = sinon.spy(compress, 'getOutputPath' as any);
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

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
          new RegExp(`${files.length} files have been compressed\. \(.+\)`),
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
    assert.strictEqual(getOutputPathSpy.callCount, files.length);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
    assert.strictEqual((compress as any).options.outputFileFormat, undefined);

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index);
      const [fullPath, filename] = call.args;
      assert.strictEqual(
        call.returnValue,
        path.join(
          fullPath,
          `${filename}.${(compress as any).compressionInstance.ext}`,
        ),
      );
    }
  });

  it('should set custom file format artifacts (test-[filename]-55-[filename].[compressExt]x.[ext]) via --output-file-format', async () => {
    const options = {
      outputFileFormat: 'test-[filename]-55-[filename].[compressExt]x.[ext]',
      threshold: 0,
    };

    const [compress, getOutputPathSpy] = await validateOutputPathOptions(
      options,
    );

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index);
      const [fullPath, file] = call.args;
      const filename = path.parse(file).name;
      const ext = path.extname(file).slice(1);
      assert.strictEqual(
        call.returnValue,
        path.join(
          fullPath,
          `test-${filename}-55-${filename}.${
            (compress as any).compressionInstance.ext
          }x.${ext}`,
        ),
      );
    }
  });

  it('should set custom file format artifacts ([filename]-[hash]-55.[ext]) via --output-file-format', async () => {
    const options = {
      outputFileFormat: '[filename]-[hash]-55.[ext]',
      threshold: 0,
    };

    const [, getOutputPathSpy] = await validateOutputPathOptions(options);

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index);
      const [fullPath, file] = call.args;
      const filename = path.parse(file).name;
      const ext = path.extname(file).slice(1);
      const execHash = new RegExp(`(?<=${filename}-)(.*)(?=-55)`, 'g').exec(
        call.returnValue,
      ) as RegExpExecArray;
      assert.strictEqual(
        call.returnValue,
        path.join(fullPath, `${filename}-${execHash[0]}-55.${ext}`),
      );
    }
  });

  it('should include specific file extensions for compression (also exclude others)', async () => {
    const options = {
      include: ['sunny'],
      threshold: 0,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinon.match(
          new RegExp(`${files.length} file has been compressed\. \(.+\)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(files.length, 1);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should exclude file extensions from compression jpeg,jpg', async () => {
    const options = {
      exclude: ['jpeg', 'jpg'],
      threshold: 0,
    };
    const beforeFiles = (await getFiles(COMPRESS_PATH)).filter((file) => {
      const ext = path.extname(file);
      return !(ext === '.jpeg' || ext === '.jpg');
    });
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinon.match(
          new RegExp(`${files.length} files have been compressed\. \(.+\)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(beforeFiles.length, files.length);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('should exclude file sizes smaller than 860 bytes from compression', async () => {
    const THRESHOLD = 860;
    const options = {
      threshold: THRESHOLD,
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
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const filesGzipped = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinon.match(
          new RegExp(
            `${filesGzipped.length} files have been compressed\. \(.+\)`,
          ),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(filesGzipped.length, includedFiles);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 1);
  });

  it('--remove-larger should remove compressed files', async () => {
    const options = {
      removeLarger: true,
      threshold: 0,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly(
        sinon.match(
          new RegExp(`${files.length} files have been compressed\. \(.+\)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(files.length, 6);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });

  it('--skip-compressed should skip compressed files', async () => {
    const options = {
      skipCompressed: true,
      threshold: 0,
    };
    const compress = new Compress(COMPRESS_PATH, COMPRESS_PATH_TARGET, options);
    await compress.run();

    const filesBefore = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
    assert.ok(
      logSpy.calledWithExactly('No files for compression.', LogLevel.WARNING),
    );
    assert.strictEqual(filesBefore.length, filesAfter.length);
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 2);
  });
});
