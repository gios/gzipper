import fs from 'fs';
import util from 'util';
import sinon from 'sinon';
import path from 'path';

import {
  clear,
  COMPRESS_PATH,
  COMPRESSION_EXTENSIONS,
  GZIPPER_CONFIG_FOLDER,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { Config } from '../../../src/Config';
import { Incremental } from '../../../src/Incremental';
import { CompressOptions } from '../../../src/interfaces';

const fsExists = util.promisify(fs.exists);

describe('CLI Cache -> Purge', () => {
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

  it('should purge cache if exists', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const deleteWritableContentPropertySpy = sinonSandbox.spy(
      (incremental as any).config,
      'deleteProperty',
    );
    const writeConfigSpy = sinonSandbox.spy(
      (incremental as any).config,
      'writeConfig',
    );
    await incremental.cachePurge();
    sinonSandbox.assert.calledOnceWithExactly(
      deleteWritableContentPropertySpy,
      'incremental',
    );
    sinonSandbox.assert.calledOnce(writeConfigSpy);
    const cacheExists = await fsExists(cachePath);
    sinonSandbox.assert.match(cacheExists, false);
  });

  it("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    const deleteWritableContentPropertySpy = sinonSandbox.spy(
      (incremental as any).config,
      'deleteProperty',
    );
    const writeConfigSpy = sinonSandbox.spy(
      (incremental as any).config,
      'writeConfig',
    );
    try {
      await incremental.cachePurge();
    } catch (err) {
      sinonSandbox.assert.match(err, {
        name: 'Error',
        message: 'No cache found.',
      });
    }
    sinonSandbox.assert.notCalled(deleteWritableContentPropertySpy);
    sinonSandbox.assert.notCalled(writeConfigSpy);
  });
});
