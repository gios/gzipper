import fs from 'fs';
import util from 'util';
import path from 'path';
import { describe, beforeEach, afterEach, it, expect, vitest } from "vitest";

import { clear, GZIPPER_CONFIG_FOLDER, generatePaths } from '../../utils';
import { Compress } from '../../../src/Compress';
import { Config } from '../../../src/Config';
import { Incremental } from '../../../src/Incremental';
import { CompressOptions } from '../../../src/interfaces';

const fsExists = util.promisify(fs.exists);

describe('CLI Cache -> Purge', () => {
  let testPath: string;
  let compressTestPath: string;

  beforeEach(async () => {
    vitest.restoreAllMocks();
    vitest.resetModules();
    [testPath, compressTestPath] = await generatePaths();
    const processSpy = vitest.spyOn(global.process, 'cwd');
    processSpy.mockImplementation(() => testPath);
  });

  afterEach(async () => {
    await clear(testPath, true);
    await clear(GZIPPER_CONFIG_FOLDER, true);
  });

  it('should purge cache if exists', async () => {
    const options: CompressOptions = { incremental: true };
    const cachePath = path.resolve(process.cwd(), './.gzipper/cache');
    const compress = new Compress(compressTestPath, null, options);
    await compress.run();
    const config = new Config();
    const incremental = new Incremental(config);

    const deleteWritableContentPropertySpy = vitest.spyOn(
      (incremental as any).config,
      'deleteProperty',
    );
    const writeConfigSpy = vitest.spyOn(
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

  it("should throw error if cache doesn't exists", async () => {
    const config = new Config();
    const incremental = new Incremental(config);

    const deleteWritableContentPropertySpy = vitest.spyOn(
      (incremental as any).config,
      'deleteProperty',
    );
    const writeConfigSpy = vitest.spyOn(
      (incremental as any).config,
      'writeConfig',
    );

    await expect(incremental.cachePurge()).rejects.toThrow('No cache found.');
    expect(deleteWritableContentPropertySpy).toHaveBeenCalledTimes(0);
    expect(writeConfigSpy).toHaveBeenCalledTimes(0);
  });
});
