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

describe('CLI Compress -> Brotli compression', () => {
  beforeEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  it('--brotli-param-mode, --brotli-quality, --brotli-size-hint should change brotli configuration with --verbose', async () => {
    const options = {
      brotli: true,
      brotliParamMode: 'text',
      brotliQuality: 10,
      brotliSizeHint: 5,
      threshold: 0,
      verbose: true,
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
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
        sinon.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
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
      (compress as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
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
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
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
        sinon.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.ok(
      (compress as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 3);
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
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
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
        sinon.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.ok(
      (compress as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 3);
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
    };
    if (typeof zlib.createBrotliCompress !== 'function') {
      return;
    }
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
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
        sinon.match(
          new RegExp(`${files.length} files have been compressed. (.+)`),
        ),
        LogLevel.SUCCESS,
      ),
    );
    assert.ok(
      (compress as any).createCompression() instanceof
        (zlib as any).BrotliCompress,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, 'br');
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      1,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 3);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions[
        zlib.constants.BROTLI_PARAM_MODE
      ],
      zlib.constants.BROTLI_MODE_FONT,
    );
  });
});
