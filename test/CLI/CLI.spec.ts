import { describe, beforeEach, it, vitest, expect } from 'vitest';

import { Index } from '../../src/bin';
import { Compress } from '../../src/Compress';
import { CompressOptions } from '../../src/interfaces';
import { Incremental } from '../../src/Incremental';
import { LogLevel } from '../../src/logger/LogLevel.enum';

describe('Index CLI', () => {
  beforeEach(() => {
    vitest.restoreAllMocks();
    vitest.resetModules();
  });

  it("compress <path> [outputPath] - should exec 'runCompress' with options", async () => {
    const cliArguments = [
      'node.exe',
      'index.js',
      'compress',
      'folder_to_compress',
      'folder_to_compress_out',
      '--verbose',
      '--incremental',
      '--exclude',
      'png,jpg,js',
      '--include',
      'png,wav',
      '--threshold',
      '500',
      '--gzip-level',
      '7',
      '--gzip-memory-level',
      '1',
      '--deflate-strategy',
      '3',
      '--brotli',
      '--deflate',
      '--gzip',
      '--zopfli',
      '--zstd',
      '--brotli-param-mode',
      'text',
      '--brotli-quality',
      '5',
      '--brotli-size-hint',
      '77',
      '--zopfli-block-splitting',
      '--zopfli-block-splitting-max',
      '5',
      '--zstd-level',
      '3',
      '--output-file-format',
      'test-[filename].[ext].[compressExt]',
      '--remove-larger',
      '--skip-compressed',
      '--workers',
      '2',
      '--no-color',
    ];
    const index = new Index();
    index.argv = cliArguments;
    const runCompressSpy = vitest.spyOn(index as never, 'runCompress');
    const filterOptionsSpy = vitest.spyOn(index as never, 'filterOptions');
    const compressRunSpy = vitest
      .spyOn(Compress.prototype, 'run')
      .mockResolvedValueOnce([]);
    await index.exec();
    const request: CompressOptions = {
      verbose: true,
      incremental: true,
      exclude: ['png', 'jpg', 'js'],
      include: ['png', 'wav'],
      threshold: 500,
      brotli: true,
      deflate: true,
      gzip: true,
      zopfli: true,
      zstd: true,
      gzipLevel: 7,
      gzipMemoryLevel: 1,
      gzipStrategy: undefined,
      deflateLevel: undefined,
      deflateMemoryLevel: undefined,
      deflateStrategy: 3,
      brotliParamMode: 'text',
      brotliQuality: 5,
      brotliSizeHint: 77,
      zopfliNumIterations: undefined,
      zopfliBlockSplitting: true,
      zopfliBlockSplittingMax: 5,
      zstdLevel: 3,
      outputFileFormat: 'test-[filename].[ext].[compressExt]',
      removeLarger: true,
      skipCompressed: true,
      workers: 2,
      color: false,
    };
    const response: CompressOptions = {
      verbose: true,
      incremental: true,
      exclude: ['png', 'jpg', 'js'],
      include: ['png', 'wav'],
      threshold: 500,
      gzipLevel: 7,
      gzipMemoryLevel: 1,
      deflateStrategy: 3,
      brotli: true,
      deflate: true,
      gzip: true,
      zopfli: true,
      zstd: true,
      brotliParamMode: 'text',
      brotliQuality: 5,
      brotliSizeHint: 77,
      outputFileFormat: 'test-[filename].[ext].[compressExt]',
      zopfliBlockSplitting: true,
      zopfliBlockSplittingMax: 5,
      zstdLevel: 3,
      removeLarger: true,
      skipCompressed: true,
      workers: 2,
      color: false,
    };
    expect(runCompressSpy).toHaveBeenCalledTimes(1);
    expect(runCompressSpy).toHaveBeenCalledWith(
      'folder_to_compress',
      'folder_to_compress_out',
      request,
    );
    expect(compressRunSpy).toHaveBeenCalledTimes(1);
    expect(filterOptionsSpy).toHaveBeenCalledTimes(1);
    expect(filterOptionsSpy).toHaveBeenCalledWith(request);
    expect(filterOptionsSpy).toHaveReturnedWith(response);
  });

  it("compress <path> [outputPath] - should exec 'runCompress' with overwrite options", async () => {
    const envArguments = {
      GZIPPER_INCREMENTAL: '0',
      GZIPPER_VERBOSE: '0',
      GZIPPER_EXCLUDE: 'py,c',
      GZIPPER_INCLUDE: 'r,rs',
      GZIPPER_THRESHOLD: '800',
      GZIPPER_BROTLI: '0',
      GZIPPER_DEFLATE: '0',
      GZIPPER_GZIP: '0',
      GZIPPER_ZOPFLI: '0',
      GZIPPER_ZSTD: '0',
      GZIPPER_GZIP_LEVEL: '2',
      GZIPPER_GZIP_MEMORY_LEVEL: '2',
      GZIPPER_GZIP_STRATEGY: '4',
      GZIPPER_DEFLATE_LEVEL: '1',
      GZIPPER_DEFLATE_MEMORY_LEVEL: '1',
      GZIPPER_DEFLATE_STRATEGY: '3',
      GZIPPER_BROTLI_PARAM_MODE: 'font',
      GZIPPER_BROTLI_QUALITY: '3',
      GZIPPER_BROTLI_SIZE_HINT: '10',
      GZIPPER_ZOPFLI_NUM_ITERATIONS: '9',
      GZIPPER_ZOPFLI_BLOCK_SPLITTING: '0',
      GZIPPER_ZOPFLI_BLOCK_SPLITTING_LAST: '0',
      GZIPPER_ZOPFLI_BLOCK_SPLITTING_MAX: '14',
      GZIPPER_ZSTD_LEVEL: '2',
      GZIPPER_OUTPUT_FILE_FORMAT: '[filename]-[hash].[ext].[compressExt]',
      GZIPPER_REMOVE_LARGER: '0',
      GZIPPER_SKIP_COMPRESSED: '0',
      GZIPPER_WORKERS: '3',
      GZIPPER_NO_COLOR: '0',
    };
    const cliArguments = [
      'node.exe',
      'index.js',
      'compress',
      'folder_to_compress',
      'folder_to_compress_out',
      '--incremental',
      '--verbose',
      '--exclude',
      'png,jpg,js',
      '--include',
      'png,wav',
      '--threshold',
      '500',
      '--gzip-level',
      '7',
      '--gzip-memory-level',
      '1',
      '--gzip-strategy',
      '3',
      '--deflate-level',
      '2',
      '--deflate-memory-level',
      '2',
      '--deflate-strategy',
      '4',
      '--brotli',
      '--deflate',
      '--gzip',
      '--zopfli',
      '--zstd',
      '--brotli-param-mode',
      'text',
      '--brotli-quality',
      '5',
      '--brotli-size-hint',
      '77',
      '--zopfli-num-iterations',
      '15',
      '--zopfli-block-splitting',
      '--zopfli-block-splitting-max',
      '10',
      '--zstd-level',
      '4',
      '--output-file-format',
      'test-[filename].[ext].[compressExt]',
      '--remove-larger',
      '--skip-compressed',
      '--workers',
      '2',
      '--no-color',
    ];
    const index = new Index();
    index.argv = cliArguments;
    index.env = envArguments;
    const runCompressSpy = vitest.spyOn(index as never, 'runCompress');
    const filterOptionsSpy = vitest.spyOn(index as never, 'filterOptions');
    const compressRunSpy = vitest
      .spyOn(Compress.prototype, 'run')
      .mockResolvedValueOnce([]);
    await index.exec();
    const request: CompressOptions = {
      verbose: false,
      incremental: false,
      exclude: ['py', 'c'],
      include: ['r', 'rs'],
      threshold: 800,
      brotli: false,
      deflate: false,
      gzip: false,
      zopfli: false,
      zstd: false,
      gzipLevel: 2,
      gzipMemoryLevel: 2,
      gzipStrategy: 4,
      deflateLevel: 1,
      deflateMemoryLevel: 1,
      deflateStrategy: 3,
      brotliParamMode: 'font',
      brotliQuality: 3,
      brotliSizeHint: 10,
      zopfliNumIterations: 9,
      zopfliBlockSplitting: false,
      zopfliBlockSplittingMax: 14,
      zstdLevel: 2,
      outputFileFormat: '[filename]-[hash].[ext].[compressExt]',
      removeLarger: false,
      skipCompressed: false,
      workers: 3,
      color: true,
    };
    const response: CompressOptions = {
      incremental: false,
      verbose: false,
      exclude: ['py', 'c'],
      include: ['r', 'rs'],
      threshold: 800,
      gzipLevel: 2,
      gzipMemoryLevel: 2,
      gzipStrategy: 4,
      deflateLevel: 1,
      deflateMemoryLevel: 1,
      deflateStrategy: 3,
      brotli: false,
      deflate: false,
      gzip: false,
      zopfli: false,
      zstd: false,
      brotliParamMode: 'font',
      brotliQuality: 3,
      brotliSizeHint: 10,
      zopfliNumIterations: 9,
      zopfliBlockSplitting: false,
      zopfliBlockSplittingMax: 14,
      zstdLevel: 2,
      outputFileFormat: '[filename]-[hash].[ext].[compressExt]',
      removeLarger: false,
      skipCompressed: false,
      workers: 3,
      color: true,
    };
    expect(runCompressSpy).toHaveBeenCalledTimes(1);
    expect(runCompressSpy).toHaveBeenCalledWith(
      'folder_to_compress',
      'folder_to_compress_out',
      request,
    );
    expect(compressRunSpy).toHaveBeenCalledTimes(1);
    expect(filterOptionsSpy).toHaveBeenCalledTimes(1);
    expect(filterOptionsSpy).toHaveBeenCalledWith(request);
    expect(filterOptionsSpy).toHaveReturnedWith(response);
  });

  it("cache purge should exec 'cachePurge' and throw the SUCCESS message", async () => {
    const cliArguments = ['node.exe', 'index.js', 'cache', 'purge'];
    const index = new Index();
    index.argv = cliArguments;
    const loggerLogSpy = vitest.spyOn(index.logger, 'log');
    const cachePurgeSpy = vitest
      .spyOn(Incremental.prototype, 'cachePurge')
      .mockResolvedValueOnce();
    const cacheSizeSpy = vitest.spyOn(Incremental.prototype, 'cacheSize');
    await index.exec();
    expect(loggerLogSpy).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Cache has been purged, you are free to initialize a new one.',
      LogLevel.SUCCESS,
    );
    expect(cachePurgeSpy).toHaveBeenCalledTimes(1);
    expect(cacheSizeSpy).toHaveBeenCalledTimes(0);
  });

  it("cache size should exec 'cacheSize' and throw the info message", async () => {
    const cliArguments = ['node.exe', 'index.js', 'cache', 'size'];
    const index = new Index();
    index.argv = cliArguments;
    const loggerLogSpy = vitest.spyOn(index.logger, 'log');
    const cachePurgeSpy = vitest.spyOn(Incremental.prototype, 'cachePurge');
    const cacheSizeSpy = vitest
      .spyOn(Incremental.prototype, 'cacheSize')
      .mockResolvedValueOnce(0);
    await index.exec();
    expect(loggerLogSpy).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Cache is empty, initialize a new one with --incremental option.',
      LogLevel.INFO,
    );
    expect(cachePurgeSpy).toHaveBeenCalledTimes(0);
    expect(cacheSizeSpy).toHaveBeenCalledTimes(1);
  });

  it("cache size should exec 'cacheSize', 'readableSize' and throw the info message", async () => {
    const cliArguments = ['node.exe', 'index.js', 'cache', 'size'];
    const index = new Index();
    index.argv = cliArguments;
    const loggerLogSpy = vitest.spyOn(index.logger, 'log');
    const cachePurgeSpy = vitest.spyOn(Incremental.prototype, 'cachePurge');
    const cacheSizeSpy = vitest
      .spyOn(Incremental.prototype, 'cacheSize')
      .mockResolvedValueOnce(12);
    await index.exec();
    expect(loggerLogSpy).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Cache size is 12 B',
      LogLevel.INFO,
    );
    expect(cachePurgeSpy).toHaveBeenCalledTimes(0);
    expect(cacheSizeSpy).toHaveBeenCalledTimes(1);
  });

  it('cache size should throw the error message', async () => {
    const cliArguments = ['node.exe', 'index.js', 'cache', 'size'];
    const index = new Index();
    index.argv = cliArguments;
    const loggerLogSpy = vitest.spyOn(index.logger, 'log');
    const cachePurgeSpy = vitest.spyOn(Incremental.prototype, 'cachePurge');
    const cacheSizeSpy = vitest
      .spyOn(Incremental.prototype, 'cacheSize')
      .mockRejectedValueOnce('Error');
    await index.exec();
    expect(loggerLogSpy).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).toHaveBeenCalledWith('Error', LogLevel.ERROR);
    expect(cachePurgeSpy).toHaveBeenCalledTimes(0);
    expect(cacheSizeSpy).toHaveBeenCalledTimes(1);
  });

  it('cache purge should throw the error message', async () => {
    const cliArguments = ['node.exe', 'index.js', 'cache', 'purge'];
    const index = new Index();
    index.argv = cliArguments;
    const loggerLogSpy = vitest.spyOn(index.logger, 'log');
    const cachePurgeSpy = vitest
      .spyOn(Incremental.prototype, 'cachePurge')
      .mockRejectedValueOnce('Error');
    const cacheSizeSpy = vitest.spyOn(Incremental.prototype, 'cacheSize');
    await index.exec();
    expect(loggerLogSpy).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).toHaveBeenCalledWith('Error', LogLevel.ERROR);
    expect(cachePurgeSpy).toHaveBeenCalledTimes(1);
    expect(cacheSizeSpy).toHaveBeenCalledTimes(0);
  });
});
