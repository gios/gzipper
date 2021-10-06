import assert from 'assert';
import sinon from 'sinon';

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
  let sinonSandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    sinonSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    sinonSandbox.restore();
    sinon.restore();
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
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.zz']);

    assert.ok(
      logSpy.calledWithExactly(
        'Compression DEFLATE | level: 6, memLevel: 4, strategy: 2',
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
        sinonSandbox.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.strictEqual((compress as any).compressionInstances[0].ext, 'zz');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstances[0].compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 5);
    assert.strictEqual(
      (compress as any).compressionInstances[0].compressionOptions.level,
      6,
    );
    assert.strictEqual(
      (compress as any).compressionInstances[0].compressionOptions.memLevel,
      4,
    );
    assert.strictEqual(
      (compress as any).compressionInstances[0].compressionOptions.strategy,
      2,
    );
  });
});
