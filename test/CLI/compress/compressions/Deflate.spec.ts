import { describe, beforeEach, afterEach, it, expect, vitest } from 'vitest';

import { Compress } from '../../../../src/Compress';
import {
  getFiles,
  clear,
  generatePaths,
  GZIPPER_CONFIG_FOLDER,
} from '../../../utils';
import { LogLevel } from '../../../../src/logger/LogLevel.enum';
import { CompressOptions } from '../../../../src/interfaces';
import { DeflateCompression } from '../../../../src/compressions/Deflate';

describe('CLI Compress -> Deflate compression', () => {
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

  it('--level, --memory-level, --strategy should change deflate configuration', async () => {
    const options: CompressOptions = {
      deflate: true,
      deflateLevel: 6,
      deflateMemoryLevel: 4,
      deflateStrategy: 2,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(compress.logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.zz']);
    const instance = compress.compressionInstances[0] as DeflateCompression;

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression DEFLATE | level: 6, memLevel: 4, strategy: 2',
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
    expect(instance.ext).toBe('zz');
    expect(Object.keys(instance.compressionOptions).length).toBe(3);
    expect(Object.keys(compress.options).length).toBe(4);
    expect(instance.compressionOptions.level).toBe(6);
    expect(instance.compressionOptions.memLevel).toBe(4);
    expect(instance.compressionOptions.strategy).toBe(2);
  });
});
