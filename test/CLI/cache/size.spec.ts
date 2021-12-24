import fs from 'fs';
import util from 'util';
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
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  it('should returns cache size if exists', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const size = await incremental.cacheSize();
    expect(size).toBeGreaterThan(0);
    const cacheExists = await fsExists(cachePath);
    expect(cacheExists).toBeTruthy();
  });

  it("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    expect(incremental.cacheSize()).rejects.toThrowError({
      name: 'Error',
      message: 'No cache found.',
    });
  });

  it('should return 0 if cache is empty', async () => {
    const config = new Config();
    const incremental = new Incremental(config);
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');

    await createFolder(cachePath);
    const size = await incremental.cacheSize();
    expect(size).toBe(0);
  });
});
