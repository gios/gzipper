import sinon from 'sinon';
import assert from 'assert';
import zlib from 'zlib';
import path from 'path';
import fs from 'fs';
import util from 'util';

import {
  COMPRESSION_EXTENSIONS,
  COMPRESS_PATH,
  clear,
  getFiles,
  GZIPPER_CONFIG_FOLDER,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { LogLevel } from '../../../src/logger/LogLevel.enum';
import { INCREMENTAL_ENABLE_MESSAGE } from '../../../src/constants';

const fsExists = util.promisify(fs.exists);

describe('CLI Compress -> Incremental', () => {
  let sinonSandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    sinonSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    await clear(GZIPPER_CONFIG_FOLDER, true);
    sinonSandbox.restore();
    sinon.restore();
  });

  it('should compile files and create .gzipper folder', async () => {
    const options = { verbose: true, threshold: 0, incremental: true };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const logSpy = sinon.spy((compress as any).logger, 'log');
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, ['.gz']);

    const exists = await fsExists(path.resolve(process.cwd(), './.gzipper'));
    assert.ok(exists);
    assert.ok(
      logSpy.calledWithExactly(INCREMENTAL_ENABLE_MESSAGE, LogLevel.INFO),
    );
    assert.ok(logSpy.calledWithExactly('Compression GZIP | ', LogLevel.INFO));
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
      0,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 3);
  });
});
