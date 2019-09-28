import assert from 'assert';
import sinon from 'sinon';
import zlib from 'zlib';
import path from 'path';

import { Gzipper } from '../src/Gzipper';
import { VALID_EXTENSIONS } from '../src/constants';
import {
  EMPTY_FOLDER_PATH,
  COMPRESS_PATH,
  NO_FILES_COMPRESS_PATH,
  COMPRESS_PATH_TARGET,
  getFiles,
  createFolder,
  clear,
} from './utils';
import { IOptions } from '../src/interfaces';

describe('Gzipper', () => {
  beforeEach(async () => {
    await createFolder(EMPTY_FOLDER_PATH);
    await createFolder(COMPRESS_PATH_TARGET);
    await clear(COMPRESS_PATH, ['.gz', '.br']);
  });

  it('should throw an error if no path found', () => {
    try {
      new Gzipper(null, null);
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, `Can't find a path.`);
    }
  });

  it('should throw on compress error', async () => {
    const gzipper = new Gzipper(COMPRESS_PATH, null);
    const compileFolderRecursivelySpy = sinon.spy(
      gzipper,
      'compileFolderRecursively' as any,
    );
    const errorSpy = sinon.spy((gzipper as any).logger, 'error');
    sinon
      .stub(gzipper, 'compressFile' as any)
      .rejects(new Error('Compressing error.'));

    try {
      await gzipper.compress();
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.message, 'Compressing error.');
      assert.ok(compileFolderRecursivelySpy.calledWithExactly(COMPRESS_PATH));
      assert.ok(
        errorSpy.calledOnceWithExactly(sinon.match.instanceOf(Error), true),
      );
    }
  });

  it('should print message about appropriate files', async () => {
    const gzipper = new Gzipper(NO_FILES_COMPRESS_PATH, null);
    const noFilesWarnSpy = sinon.spy((gzipper as any).logger, 'warn');
    await gzipper.compress();
    const responseMessage = `we couldn't find any appropriate files. valid extensions are: ${VALID_EXTENSIONS.join(
      ', ',
    )}`;

    assert.ok(noFilesWarnSpy.calledWithExactly(responseMessage, true));
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 0);
  });

  it('should print message about empty folder', async () => {
    const gzipper = new Gzipper(EMPTY_FOLDER_PATH, null);
    const noFilesWarnSpy = sinon.spy((gzipper as any).logger, 'warn');
    await gzipper.compress();
    const responseMessage = `we couldn't find any appropriate files. valid extensions are: ${VALID_EXTENSIONS.join(
      ', ',
    )}`;

    assert.ok(noFilesWarnSpy.calledWithExactly(responseMessage, true));
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 0);
  });

  it('--verbose should print logs to console and use default configuration', async () => {
    const options = { verbose: true, threshold: 0 };
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    const loggerInfoSpy = sinon.spy((gzipper as any).logger, 'info');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.strictEqual(loggerInfoSpy.callCount, files.length + 1);
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 2);
  });

  it('should compress files to a certain folder with existing folder structure', async () => {
    const gzipper = new Gzipper(COMPRESS_PATH, COMPRESS_PATH_TARGET);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH);
    const compressedFiles = await getFiles(COMPRESS_PATH_TARGET, ['.gz']);

    const filesRelative = files.map(file => path.relative(COMPRESS_PATH, file));
    const compressedRelative = compressedFiles.map(file =>
      path.relative(COMPRESS_PATH_TARGET, file),
    );

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.strictEqual(files.length, compressedFiles.length);
    for (const file of filesRelative) {
      assert.ok(
        compressedRelative.some(compressedFile => {
          const withoutExtFile = compressedFile.replace(
            path.basename(compressedFile),
            path.parse(path.basename(compressedFile)).name,
          );
          return withoutExtFile === file;
        }),
      );
    }
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 0);
  });

  it('getOutputPath should returns correct file path', () => {
    const gzipper = new Gzipper(COMPRESS_PATH, null);
    const target = '/the/elder/scrolls/';
    const file = 'skyrim.js';

    let outputFilePath = (gzipper as any).getOutputPath(target, file);
    assert.strictEqual(
      outputFilePath,
      '/the/elder/scrolls/skyrim.js.gz'.split('/').join(path.sep),
    );

    (gzipper as any).options.outputFileFormat =
      'test[filename].[compressExt].[ext]';
    outputFilePath = (gzipper as any).getOutputPath(target, file);
    assert.strictEqual(
      outputFilePath,
      '/the/elder/scrolls/testskyrim.gz.js'.split('/').join(path.sep),
    );

    (gzipper as any).options.outputFileFormat = '[filename]-test.[compressExt]';
    outputFilePath = (gzipper as any).getOutputPath(target, file);
    assert.strictEqual(
      outputFilePath,
      '/the/elder/scrolls/skyrim-test.gz'.split('/').join(path.sep),
    );

    (gzipper as any).options.outputFileFormat =
      '[filename]-[hash]-[filename]-test.[compressExt].[ext]';
    outputFilePath = (gzipper as any).getOutputPath(target, file);
    const execHash = /(?<=skyrim-)(.*)(?=-skyrim)/.exec(
      outputFilePath,
    ) as RegExpExecArray;
    assert.strictEqual(
      outputFilePath,
      `/the/elder/scrolls/skyrim-${execHash[0]}-skyrim-test.gz.js`
        .split('/')
        .join(path.sep),
    );
  });

  it('should use default file format artifacts via --output-file-format and print to console via --verbose flag', async () => {
    const options = { verbose: true, threshold: 0 };
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    const loggerInfoSpy = sinon.spy((gzipper as any).logger, 'info');
    const getOutputPathSpy = sinon.spy(gzipper, 'getOutputPath' as any);
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      loggerInfoSpy.calledWithExactly(
        `Use default output file format [filename].[ext].[compressExt]`,
      ),
    );
    assert.strictEqual(loggerInfoSpy.callCount, files.length + 1);
    assert.strictEqual(getOutputPathSpy.callCount, files.length);
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 2);
    assert.strictEqual((gzipper as any).options.outputFileFormat, undefined);

    for (let index = 0; index < getOutputPathSpy.callCount; index++) {
      const call = getOutputPathSpy.getCall(index);
      const [fullPath, filename] = call.args;
      assert.strictEqual(
        call.returnValue,
        path.join(
          fullPath,
          `${filename}.${(gzipper as any).compressionInstance.ext}`,
        ),
      );
    }
  });

  async function validateOutputFileFormat(
    options: IOptions,
    outputFileFormat: string,
  ): Promise<[Gzipper, sinon.SinonSpy]> {
    const gzipper = new Gzipper(COMPRESS_PATH, COMPRESS_PATH_TARGET, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    const loggerInfoSpy = sinon.spy((gzipper as any).logger, 'info');
    const getOutputPathSpy = sinon.spy(gzipper, 'getOutputPath' as any);
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH_TARGET);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      loggerInfoSpy.neverCalledWithMatch(
        `Use default output file format [filename].[ext].[compressExt]`,
      ),
    );
    assert.strictEqual(getOutputPathSpy.callCount, files.length);
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 3);
    assert.strictEqual(
      (gzipper as any).options.outputFileFormat,
      outputFileFormat,
    );

    return [gzipper, getOutputPathSpy];
  }

  it('should set custom file format artifacts (test-[filename]-55-[filename].[compressExt]x.[ext]) via --output-file-format', async () => {
    const options = {
      outputFileFormat: 'test-[filename]-55-[filename].[compressExt]x.[ext]',
      verbose: true,
      threshold: 0,
    };

    const [gzipper, getOutputPathSpy] = await validateOutputFileFormat(
      options,
      options.outputFileFormat,
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
            (gzipper as any).compressionInstance.ext
          }x.${ext}`,
        ),
      );
    }
  });

  it('should set custom file format artifacts ([filename]-[hash]-55.[ext]) via --output-file-format', async () => {
    const options = {
      outputFileFormat: '[filename]-[hash]-55.[ext]',
      verbose: true,
      threshold: 0,
    };

    const [, getOutputPathSpy] = await validateOutputFileFormat(
      options,
      options.outputFileFormat,
    );

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

  it('should include only specific file extensions for compression', async () => {
    const options = {
      include: 'js,css,html',
      verbose: true,
      threshold: 0,
    };
    const INCLUDED_FILES_COUNT = 9;
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    const loggerInfoSpy = sinon.spy((gzipper as any).logger, 'info');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );

    assert.strictEqual(loggerInfoSpy.callCount, INCLUDED_FILES_COUNT + 1);
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 3);
  });

  it('should exclude file extensions from compression jpeg,jpg', async () => {
    const options = {
      exclude: 'jpeg,jpg',
      verbose: true,
      threshold: 0,
    };
    const EXCLUDED_FILES_COUNT = 2;
    const beforeFiles = await getFiles(COMPRESS_PATH);
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    const loggerInfoSpy = sinon.spy((gzipper as any).logger, 'info');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.strictEqual(
      loggerInfoSpy.callCount,
      beforeFiles.length - EXCLUDED_FILES_COUNT + 1,
    );
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 3);
  });

  it('should exclude file sizes smaller than 860 bytes from compression', async () => {
    const options = {
      threshold: 860,
      verbose: true,
    };
    const INCLUDED_FILES_COUNT = 4;
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    const loggerInfoSpy = sinon.spy((gzipper as any).logger, 'info');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.strictEqual(loggerInfoSpy.callCount, INCLUDED_FILES_COUNT + 1);
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      0,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 2);
  });

  afterEach(async () => {
    await clear(EMPTY_FOLDER_PATH, true);
    await clear(COMPRESS_PATH_TARGET, true);
    await clear(COMPRESS_PATH, ['.gz', '.br']);
  });
});
