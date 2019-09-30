import assert from 'assert';
import sinon from 'sinon';
import zlib from 'zlib';

import { disableBrotli } from '../helpers';
import { Gzipper } from '../../src/Gzipper';
import { COMPRESS_PATH, getFiles, clear } from '../utils';

const describeTest = disableBrotli ? describe.skip : describe;

describeTest('Gzipper -> Brotli compression', () => {
  beforeEach(async () => {
    await clear(COMPRESS_PATH, ['.gz', '.br']);
  });

  it('--brotli should emit error on compress error', () => {
    const createBrotliCompress =
      zlib.createBrotliCompress && zlib.createBrotliCompress.bind({});
    try {
      delete zlib.createBrotliCompress;
      new Gzipper(COMPRESS_PATH, null, { brotli: true, threshold: 0 });
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.strictEqual(
        err.message,
        `Can't use brotli compression, Node.js >= v11.7.0 required.`,
      );
    }
    zlib.createBrotliCompress = createBrotliCompress;
  });

  it('--brotli-param-mode, --brotli-quality, --brotli-size-hint should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'text',
      brotliQuality: 10,
      brotliSizeHint: 5,
      threshold: 0,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      (gzipper as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 5);
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_TEXT,
    );
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_QUALITY
      ],
      10,
    );
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_SIZE_HINT
      ],
      5,
    );
  });

  it('--brotli-param-mode=default should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'default',
      threshold: 0,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      (gzipper as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 3);
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_GENERIC,
    );
  });

  it('wrong value for --brotli-param-mode should change brotli configuration to brotliParamMode=default', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'amigos',
      threshold: 0,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      (gzipper as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 3);
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_GENERIC,
    );
  });

  it('--brotli-param-mode=font should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'font',
      threshold: 0,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const gzipper = new Gzipper(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((gzipper as any).logger, 'success');
    await gzipper.compress();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      (gzipper as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((gzipper as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((gzipper as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((gzipper as any).options).length, 3);
    assert.strictEqual(
      (gzipper as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_FONT,
    );
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, ['.gz', '.br']);
  });
});
