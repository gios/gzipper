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
import { ZopfliCompression } from '../../../../src/compressions/Zopfli';

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
    const logSpy = vitest.spyOn(compress.logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.gz']);
    const instance = compress.compressionInstances[0] as ZopfliCompression;

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Compression ZOPFLI | numiterations: 15, blocksplitting: true, blocksplittingmax: 10',
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
    expect(instance.ext).toBe('gz');
    expect(Object.keys(instance.compressionOptions).length).toBe(3);
    expect(Object.keys(compress.options).length).toBe(4);
    expect(instance.compressionOptions.numiterations).toBe(15);
    expect(instance.compressionOptions.blocksplitting).toBeTruthy();
    expect(instance.compressionOptions.blocksplittingmax).toBe(10);
  });
}, 10000);
