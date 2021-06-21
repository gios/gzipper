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
import { Logger } from '../../../../src/logger/Logger';

describe('CLI Compress -> Brotli compression', () => {
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

  it('--brotli-param-mode, --brotli-quality, --brotli-size-hint should change brotli configuration', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'text',
      brotliQuality: 10,
      brotliSizeHint: 5,
      threshold: 0,
      workers: 1,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      logSpy.calledWithExactly(
        'Compression BROTLI | brotliParamMode: 1, brotliQuality: 10, brotliSizeHint: 5',
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
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 6);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_TEXT,
    );
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_QUALITY
      ],
      10,
    );
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
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
      workers: 1,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      logSpy.calledWithExactly(
        'Compression BROTLI | brotliParamMode: 0',
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
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 4);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
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
      workers: 1,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      logSpy.calledWithExactly(
        'Compression BROTLI | brotliParamMode: 0',
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
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 4);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
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
      workers: 1,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinonSandbox.spy(Logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.br']);

    assert.ok(
      logSpy.calledWithExactly(
        'Compression BROTLI | brotliParamMode: 2',
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
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 4);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_FONT,
    );
  });
});
