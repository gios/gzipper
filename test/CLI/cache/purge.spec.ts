import fs from 'fs';
import util from 'util';
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
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  test('should purge cache if exists', async () => {
    const options: CompressOptions = { incremental: true, workers: 1 };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(COMPRESS_PATH, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const deleteWritableContentPropertySpy = jest.spyOn(
      (incremental as any).config,
      'deleteProperty',
    );
    const writeConfigSpy = jest.spyOn(
      (incremental as any).config,
      'writeConfig',
    );
    await incremental.cachePurge();
    expect(deleteWritableContentPropertySpy).toHaveBeenCalledTimes(1);
    expect(deleteWritableContentPropertySpy).toHaveBeenCalledWith(
      'incremental',
    );
    expect(writeConfigSpy).toHaveBeenCalledTimes(1);
    const cacheExists = await fsExists(cachePath);
    expect(cacheExists).toBeFalsy();
  });

  test("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    const deleteWritableContentPropertySpy = jest.spyOn(
      (incremental as any).config,
      'deleteProperty',
    );
    const writeConfigSpy = jest.spyOn(
      (incremental as any).config,
      'writeConfig',
    );

    expect(incremental.cachePurge()).rejects.toThrowError({
      name: 'Error',
      message: 'No cache found.',
    });
    expect(deleteWritableContentPropertySpy).toHaveBeenCalledTimes(0);
    expect(writeConfigSpy).toHaveBeenCalledTimes(0);
  });
});
