import fs from 'fs';
import util from 'util';
import sinon from 'sinon';
import path from 'path';

import {
  clear,
  COMPRESS_PATH,
  COMPRESSION_EXTENSIONS,
  GZIPPER_CONFIG_FOLDER,
  createFolder,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { Config } from '../../../src/Config';
import { Incremental } from '../../../src/Incremental';
import { CompressOptions } from '../../../src/interfaces';

const fsExists = util.promisify(fs.exists);

describe('CLI Cache -> Size', () => {
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

  it('should returns cache size if exists', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const size = await incremental.cacheSize();
    sinonSandbox.assert.match(size, sinon.match.number);
    // !sinonSandbox.assert.match(size, 0);
    const cacheExists = await fsExists(cachePath);
    sinonSandbox.assert.match(cacheExists, true);
  });

  it("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    try {
      await incremental.cacheSize();
    } catch (err) {
      sinonSandbox.assert.match(err, {
        name: 'Error',
        message: 'No cache found.',
      });
    }
  });

  it('should return 0 if cache is empty', async () => {
    const config = new Config();
    const incremental = new Incremental(config);
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');

    await createFolder(cachePath);
    const size = await incremental.cacheSize();
    sinonSandbox.assert.match(size, 0);
  });
});
