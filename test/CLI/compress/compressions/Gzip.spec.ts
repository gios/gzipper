import { describe, beforeEach, afterEach, it, expect, vitest } from "vitest";

import { Compress } from '../../../../src/Compress';
import {
  getFiles,
  clear,
  GZIPPER_CONFIG_FOLDER,
  generatePaths,
} from '../../../utils';
import { LogLevel } from '../../../../src/logger/LogLevel.enum';
import { Logger } from '../../../../src/logger/Logger';
import { CompressOptions } from '../../../../src/interfaces';

describe('CLI Compress -> Gzip compression', () => {
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

  it('--level, --memory-level, --strategy should change gzip configuration', async () => {
    const options: CompressOptions = {
      gzipLevel: 6,
      gzipMemoryLevel: 4,
      gzipStrategy: 2,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression GZIP | level: 6, memLevel: 4, strategy: 2',
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
    ).toBe(3);
    expect(Object.keys((compress as any).options).length).toBe(3);
    expect(
      (compress as any).compressionInstances[0].compressionOptions.level,
    ).toBe(6);
    expect(
      (compress as any).compressionInstances[0].compressionOptions.memLevel,
    ).toBe(4);
    expect(
      (compress as any).compressionInstances[0].compressionOptions.strategy,
    ).toBe(2);
  });
});
