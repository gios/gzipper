import { describe, beforeEach, afterEach, it, expect, vitest } from 'vitest';

import { Compress } from '../../../../src/Compress';
import {
  getFiles,
  clear,
  generatePaths,
  GZIPPER_CONFIG_FOLDER,
} from '../../../utils';
import { LogLevel } from '../../../../src/logger/LogLevel.enum';
import { Logger } from '../../../../src/logger/Logger';
import { CompressOptions } from '../../../../src/interfaces';
import { ZstdCompression } from '../../../../src/compressions/Zstd';

describe('CLI Compress -> Zstd compression', () => {
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

  it('--zstd-level <number> should change zstd configuration', async () => {
    const options: CompressOptions = {
      zstd: true,
      zstdLevel: 3,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.zst']);
    const instance = compress.compressionInstances[0] as ZstdCompression;

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression ZSTD | level: 3',
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
    expect(instance.ext).toBe('zst');
    expect(Object.keys(instance.compressionOptions).length).toBe(1);
    expect(Object.keys(compress.options).length).toBe(2);
    expect(instance.compressionOptions.level).toBe(3);
  });
});
