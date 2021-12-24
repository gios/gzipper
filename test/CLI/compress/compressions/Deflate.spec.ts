import { Compress } from '../../../../src/Compress';
import {
  COMPRESS_PATH,
  getFiles,
  clear,
  COMPRESSION_EXTENSIONS,
} from '../../../utils';
import { LogLevel } from '../../../../src/logger/LogLevel.enum';
import { Logger } from '../../../../src/logger/Logger';
import { CompressOptions } from '../../../../src/interfaces';

describe('CLI Compress -> Deflate compression', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  it('--level, --memory-level, --strategy should change gzip configuration', async () => {
    const options: CompressOptions = {
      deflate: true,
      deflateLevel: 6,
      deflateMemoryLevel: 4,
      deflateStrategy: 2,
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = jest.spyOn(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.zz']);

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
    expect(Object.keys((compress as any).options).length).toBe(5);
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
