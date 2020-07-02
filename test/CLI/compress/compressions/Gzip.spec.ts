import assert from 'assert';
import sinon from 'sinon';
import zlib from 'zlib';

import { Compress } from '../../../../src/Compress';
import {
  COMPRESS_PATH,
  getFiles,
  clear,
  COMPRESSION_EXTENSIONS,
} from '../../../utils';
import { LogLevel } from '../../../../src/logger/LogLevel.enum';

describe('CLI Compress -> Gzip compression', () => {
  beforeEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  it('--level, --memory-level, --strategy should change gzip configuration with --verbose', async () => {
    const options = {
      level: 6,
      memoryLevel: 4,
      strategy: 2,
      threshold: 0,
      verbose: true,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      logSpy.calledWithExactly(
        'Compression GZIP | level: 6, memLevel: 4, strategy: 2',
        LogLevel.INFO,
      ),
    );
    assert.ok(
      logSpy.calledWithExactly(
        'Default output file format: [filename].[ext].[compressExt]',
        LogLevel.INFO,
      ),
    );
    assert.ok(
      logSpy.calledWithExactly(
        sinon.match(
          new RegExp(`${files.length} files have been compressed\. \(.+\)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual(
      logSpy.withArgs(
        sinon.match(
          /File \w+\.\w+ has been compressed \d+\.?\d+ \w+ -> \d+\.?\d+ \w+ \(.+\)/,
        ),
      ).callCount,
      files.length,
    );
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 5);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions.level,
      6,
    );
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions.memLevel,
      4,
    );
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions.strategy,
      2,
    );
  });
});
