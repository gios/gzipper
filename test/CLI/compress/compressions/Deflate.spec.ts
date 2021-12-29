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

describe('CLI Compress -> Deflate compression', () => {
  let testPath: string;
  let compressTestPath: string;

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.resetModules();
    [testPath, compressTestPath] = await generatePaths();
    const processSpy = jest.spyOn(global.process, 'cwd');
    processSpy.mockImplementation(() => testPath);
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  test('--level, --memory-level, --strategy should change deflate configuration', async () => {
    const options: CompressOptions = {
      deflate: true,
      deflateLevel: 6,
      deflateMemoryLevel: 4,
      deflateStrategy: 2,
    };
    const compress = new Compress(compressTestPath, null, options);
    const logSpy = jest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(compressTestPath, ['.zz']);

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
    expect((compress as any).compressionInstances[0].ext).toBe('zz');
    expect(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
    ).toBe(3);
    expect(Object.keys((compress as any).options).length).toBe(4);
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
