import fs from 'fs';
import util from 'util';
import path from 'path';

import {
  clear,
  GZIPPER_CONFIG_FOLDER,
  createFolder,
  generatePaths,
} from '../../utils';
import { Compress } from '../../../src/Compress';
import { Config } from '../../../src/Config';
import { Incremental } from '../../../src/Incremental';
import { CompressOptions } from '../../../src/interfaces';

const fsExists = util.promisify(fs.exists);

describe('CLI Cache -> Size', () => {
  let testPath: string;
  let compressTestPath: string;

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.resetModules();
    [testPath, compressTestPath] = await generatePaths();
    const processSpy = jest.spyOn(global.process, 'cwd');
    processSpy.mockImplementation(() => testPath);
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  test('should returns cache size if exists', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(compressTestPath, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const size = await incremental.cacheSize();
    expect(size).toBeGreaterThan(0);
    const cacheExists = await fsExists(cachePath);
    expect(cacheExists).toBeTruthy();
  });

  test("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    await expect(incremental.cacheSize()).rejects.toThrowError({
      name: 'Error',
      message: 'No cache found.',
    });
  });

  test('should return 0 if cache is empty', async () => {
    const config = new Config();
    const incremental = new Incremental(config);
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');

    await createFolder(cachePath);
    const size = await incremental.cacheSize();
    expect(size).toBe(0);
  });
});
