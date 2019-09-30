import assert from 'assert';
import sinon from 'sinon';
import zlib from 'zlib';

import { Gzipper } from '../../../src/Gzipper';
import { COMPRESS_PATH, getFiles, clear } from '../../utils';

describe('CLI Gzipper -> Gzip compression', () => {
  beforeEach(async () => {
    await clear(COMPRESS_PATH, ['.gz', '.br']);
  });

  it('--gzip-level, --gzip-memory-level, --gzip-strategy should change gzip configuration', async () => {
    const options = {
      gzipLevel: 6,
      gzipMemoryLevel: 4,
      gzipStrategy: 2,
      threshold: 0,
    };
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      (gzipper as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'gz');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 4);
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions.gzipLevel,
      6,
    );
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions.gzipMemoryLevel,
      4,
    );
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions.gzipStrategy,
      2,
    );
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, ['.gz', '.br']);
  });
});
