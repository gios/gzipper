import path from 'path';
import util from 'util';
import fs from 'fs';
import { describe, beforeEach, afterEach, it, expect, vitest } from "vitest";

import { Compress } from '../../../src/Compress';
import {
  getFiles,
  clear,
  generatePaths,
  GZIPPER_CONFIG_FOLDER,
} from '../../utils';
import { CompressOptions } from '../../../src/interfaces';
import { NO_FILES_MESSAGE } from '../../../src/constants';
import { LogLevel } from '../../../src/logger/LogLevel.enum';
import { Logger } from '../../../src/logger/Logger';
import { CompressionNames } from '../../../src/enums';

const fsLstat = util.promisify(fs.lstat);

describe('CLI Compress', () => {
  let testPath: string;
  let compressTestPath: string;
  let targetFolderTestPath: string;
  let emptyFolderTestPath: string;

  beforeEach(async () => {
    vitest.restoreAllMocks();
    vitest.resetModules();
    [testPath, compressTestPath, targetFolderTestPath, emptyFolderTestPath] =
      await generatePaths();
    const processSpy = vitest.spyOn(global.process, 'cwd');
    processSpy.mockImplementation(() => testPath);
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  async function validateOutputFileFormat(
    options: CompressOptions,
  ): Promise<[Compress, string[], string[]]> {
    const compress = new Compress(
      compressTestPath,
      targetFolderTestPath,
      options,
    );
    const logSpy = vitest.spyOn(Logger, 'log');
    const files = await getFiles(compressTestPath);
    await compress.run();
    const compressedFiles = await getFiles(targetFolderTestPath);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).not.toHaveBeenNthCalledWith(
      2,
      'Default output file format: [filename].[ext].[compressExt]',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(
          `${compressedFiles.length} files have been compressed. (.+)`,
        ),
      ),
      LogLevel.SUCCESS,
    );
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
    expect((compress as any).options.outputFileFormat).toBe(
      options.outputFileFormat,
    );

    return [compress, files, compressedFiles];
  }

  it('should throw an error if no path found', () => {
    try {
      new Compress(null as any, null);
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(`Can't find a path.`);
    }
  });

  it('should throw on compress error', async () => {
    const compress = new Compress(compressTestPath, null);
    const createWorkersSpy = vitest.spyOn(compress, 'createWorkers' as any);
    const logSpy = vitest.spyOn(Logger, 'log');
    const runCompressWorkerSpy = vitest
      .spyOn(compress as any, 'runCompressWorker')
      .mockRejectedValueOnce(new Error('Compressing error.'));

    try {
      await compress.run();
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Compressing error.');
      expect(createWorkersSpy).toHaveBeenCalledTimes(1);
      expect(runCompressWorkerSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        'Compression GZIP | ',
        LogLevel.INFO,
      );
      expect(logSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Error',
          message: 'Compressing error.',
        }),
        LogLevel.ERROR,
      );
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
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(NO_FILES_MESSAGE, LogLevel.WARNING);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('should print message about empty folder', async () => {
    const compress = new Compress(emptyFolderTestPath, null);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(NO_FILES_MESSAGE, LogLevel.WARNING);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(0);
  });

  it('should compress a single file to a certain folder', async () => {
    const file = `${compressTestPath}${path.sep}index.txt`;
    const compress = new Compress(file, targetFolderTestPath);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const compressedFiles = await getFiles(targetFolderTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      'Default output file format: [filename].[ext].[compressExt]',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/\[\d+\] Worker has started./),
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(/1 file has been compressed\. \(.+\)/),
      LogLevel.SUCCESS,
    );
    expect(compressedFiles.length).toBe(1);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(0);
  });

  it('should compress files to a certain folder with existing folder structure', async () => {
    const compress = new Compress(compressTestPath, targetFolderTestPath);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath);
    const compressedFiles = await getFiles(targetFolderTestPath, ['.gz']);

    const filesRelative = files.map((file) =>
      path.relative(compressTestPath, file),
    );
    const compressedRelative = compressedFiles.map((file) =>
      path.relative(targetFolderTestPath, file),
    );

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      'Default output file format: [filename].[ext].[compressExt]',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${files.length} files have been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect(files.length).toBe(compressedFiles.length);
    for (const file of filesRelative) {
      expect(
        compressedRelative.some((compressedFile) => {
          const withoutExtFile = compressedFile.replace(
            path.basename(compressedFile),
            path.parse(path.basename(compressedFile)).name,
          );
          return withoutExtFile === file;
        }),
      ).toBeTruthy();
    }
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(0);
  });

  it('should use default file format artifacts via --output-file-format', async () => {
    const compress = new Compress(compressTestPath, null);
    const logSpy = vitest.spyOn(Logger, 'log');
    const files = await getFiles(compressTestPath);
    await compress.run();
    const compressedFiles = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
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
    expect(Object.keys((compress as any).options).length).toBe(0);
    expect((compress as any).options.outputFileFormat).toBeUndefined();

    for (const [index, compressedFile] of compressedFiles.entries()) {
      const compressedFileName = path.basename(compressedFile, '.gz');
      const fileName = path.basename(files[index]);
      expect(fileName).toBe(compressedFileName);
    }
  });

  it('should set custom file format artifacts (test-[filename]-55-[filename].[compressExt]x.[ext]) via --output-file-format', async () => {
    const options: CompressOptions = {
      outputFileFormat: 'test-[filename]-55-[filename].[compressExt]x.[ext]',
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
      const output = `test-${fileName}-55-${fileName}.${(compress as any).compressionInstances[0].ext
        }x${fileExt}`;
      expect(compressedFilesNames.includes(output)).toBeTruthy();
    }
  });

  it('should set custom file format artifacts ([filename]-[hash]-55.[ext]) via --output-file-format', async () => {
    const options: CompressOptions = {
      outputFileFormat: '[filename]-[hash]-55.[ext]',
    };

    const [, files, compressedFiles] = await validateOutputFileFormat(options);
    const compressedFilesNames = compressedFiles.map((file) =>
      path.basename(file),
    );

    for (const file of files) {
      const fileExt = path.extname(file);
      const fileName = path.basename(file, fileExt);
      expect(
        compressedFilesNames.find((file) =>
          new RegExp(`${fileName}-.*-55${fileExt}`, 'g').test(file),
        ),
      ).toBeTruthy();
    }
  });

  it('should --include specific file extensions for compression (also exclude others)', async () => {
    const options: CompressOptions = {
      include: ['sunny'],
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${files.length} file has been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect(files.length).toBe(1);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('should --exclude file extensions from compression jpeg,jpg', async () => {
    const options: CompressOptions = {
      exclude: ['jpeg', 'jpg'],
    };
    const beforeFiles = (await getFiles(compressTestPath)).filter((file) => {
      const ext = path.extname(file);
      return !(ext === '.jpeg' || ext === '.jpg');
    });
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${files.length} files have been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect(beforeFiles.length).toBe(files.length);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('should --exclude compression extensions', async () => {
    const compress = new Compress(compressTestPath, null);
    await compress.run();
    const filesBefore = await getFiles(compressTestPath, ['.gz']);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${filesAfter.length} files have been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect(filesBefore.length).toBe(filesAfter.length);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(0);
  });

  it('should exclude file sizes smaller than 860 bytes from compression', async () => {
    const THRESHOLD = 860;
    const options: CompressOptions = {
      threshold: THRESHOLD,
    };
    let includedFiles = 0;
    const files = await getFiles(compressTestPath);
    for (const filePath of files) {
      const { size: fileSize } = await fsLstat(filePath);
      if (fileSize < THRESHOLD) {
        continue;
      }
      ++includedFiles;
    }
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const filesGzipped = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${filesGzipped.length} files have been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect(filesGzipped.length).toBe(includedFiles);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('--remove-larger should remove compressed files', async () => {
    const options: CompressOptions = {
      removeLarger: true,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${files.length} files have been compressed. (.+)`),
      ),
      LogLevel.SUCCESS,
    );
    expect(files.length).toBe(6);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('--skip-compressed should skip compressed files', async () => {
    const options: CompressOptions = {
      skipCompressed: true,
    };
    const compress = new Compress(
      compressTestPath,
      targetFolderTestPath,
      options,
    );
    await compress.run();

    const filesBefore = await getFiles(targetFolderTestPath, ['.gz']);

    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(targetFolderTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      'No files for compression.',
      LogLevel.WARNING,
    );
    expect(filesBefore.length).toBe(filesAfter.length);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('--skip-compressed should skip compressed files (same folder)', async () => {
    const options: CompressOptions = {
      skipCompressed: true,
    };
    const compress = new Compress(compressTestPath, null, options);
    await compress.run();

    const filesBefore = await getFiles(compressTestPath, ['.gz']);

    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      'No files for compression.',
      LogLevel.WARNING,
    );
    expect(filesBefore.length).toBe(filesAfter.length);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('--skip-compressed should skip compressed files with appropriate message', async () => {
    const options: CompressOptions = {
      skipCompressed: true,
    };
    const compress = new Compress(compressTestPath, null, options);
    await compress.run();

    const filesBefore = await getFiles(compressTestPath, ['.gz']);

    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    const filesAfter = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | ',
      LogLevel.INFO,
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      'No files for compression.',
      LogLevel.WARNING,
    );
    expect(filesBefore.length).toBe(filesAfter.length);
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(0);
    expect(Object.keys((compress as any).options).length).toBe(1);
  });

  it('--gzip --brotli --deflate should run simultaneously', async () => {
    const options: CompressOptions = {
      gzip: true,
      brotli: true,
      deflate: true,
      gzipMemoryLevel: 1,
      deflateLevel: 3,
      brotliQuality: 2,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();

    const gzipFiles = await getFiles(compressTestPath, ['.gz']);
    const brotliFiles = await getFiles(compressTestPath, ['.br']);
    const deflateFiles = await getFiles(compressTestPath, ['.zz']);

    const gzipInstance = (compress as any).compressionInstances.find(
      (instance: any) => instance.compressionName === CompressionNames.GZIP,
    );

    expect(logSpy).toHaveBeenCalledWith(
      'Compression GZIP | memLevel: 1',
      LogLevel.INFO,
    );
    expect(gzipFiles.length).toBe(21);
    expect(gzipInstance.ext).toBe('gz');
    expect(Object.keys(gzipInstance.compressionOptions).length).toBe(1);

    const brotliInstance = (compress as any).compressionInstances.find(
      (instance: any) => instance.compressionName === CompressionNames.BROTLI,
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Compression BROTLI | quality: 2',
      LogLevel.INFO,
    );
    expect(brotliFiles.length).toBe(21);
    expect(brotliInstance.ext).toBe('br');
    expect(Object.keys(brotliInstance.compressionOptions).length).toBe(1);

    const deflateInstance = (compress as any).compressionInstances.find(
      (instance: any) => instance.compressionName === CompressionNames.DEFLATE,
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Compression DEFLATE | level: 3',
      LogLevel.INFO,
    );
    expect(deflateFiles.length).toBe(21);
    expect(deflateInstance.ext).toBe('zz');
    expect(Object.keys(deflateInstance.compressionOptions).length).toBe(1);

    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(
          `${gzipFiles.length + brotliFiles.length + deflateFiles.length
          } files have been compressed. (.+)`,
        ),
      ),
      LogLevel.SUCCESS,
    );
    expect(Object.keys((compress as any).options).length).toBe(6);
  });
});
