import fs from 'fs';
import util from 'util';
import sinon from 'sinon';
import path from 'path';
import assert from 'assert';

import {
  clear,
  COMPRESS_PATH,
  COMPRESSION_EXTENSIONS,
  GZIPPER_CONFIG_FOLDER,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { Config } from '../../../src/Config';
import { Incremental } from '../../../src/Incremental';

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
    const options = { threshold: 0, incremental: true };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const size = await incremental.cacheSize();
    assert.ok(size);
    const cacheExists = await fsExists(cachePath);
    assert.ok(cacheExists);
  });

  it("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    assert.rejects(async () => await incremental.cacheSize(), {
      name: 'Error',
      message: 'No cache found.',
    });
  });
});
