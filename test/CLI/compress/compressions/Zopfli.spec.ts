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

describe('CLI Compress -> Zopfli compression', () => {
  let testPath: string;
  let compressTestPath: string;

  beforeEach(async () => {
    vitest.restoreAllMocks();
    vitest.resetModules();
    [testPath, compressTestPath] = await generatePaths({
      excludeBig: true,
    });
    const processSpy = vitest.spyOn(global.process, 'cwd');
    processSpy.mockImplementation(() => testPath);
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  it('--zopfli-num-iterations, --zopfli-block-splitting, --zopfli-block-splitting-max <number> should change zopfli configuration', async () => {
    const options: CompressOptions = {
      zopfli: true,
      zopfliNumIterations: 15,
      zopfliBlockSplitting: true,
      zopfliBlockSplittingMax: 10,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = vitest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression ZOPFLI | numiterations: 15, blocksplitting: true, blocksplittingmax: 10',
      LogLevel.INFO
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      'Default output file format: [filename].[ext].[compressExt]',
      LogLevel.INFO
    );
    expect(logSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`${files.length} files have been compressed. (.+)`)
      ),
      LogLevel.SUCCESS
    );
    expect((compress as any).compressionInstances[0].ext).toBe('gz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length
    ).toBe(3);
    expect(Object.keys((compress as any).options).length).toBe(4);
    expect(
      (compress as any).compressionInstances[0].compressionOptions.numiterations
    ).toBe(15);
    expect(
      (compress as any).compressionInstances[0].compressionOptions
        .blocksplitting
    ).toBeTruthy();
    expect(
      (compress as any).compressionInstances[0].compressionOptions
        .blocksplittingmax
    ).toBe(10);
  });
}, 10000);
