import sinon from 'sinon';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const fsWriteFile = promisify(fs.writeFile);
const fsUnlink = promisify(fs.unlink);

import { COMPRESS_PATH, RESOURCES_FOLDER_PATH } from '../utils';
import { Gzipper } from '../../src/Gzipper';

describe('Methods Gzipper', () => {
  describe('compress', () => {
    let sinonSandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sinonSandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sinonSandbox.restore();
      sinon.restore();
    });

    it("should log success message when filesCount isn't empty", async () => {
      const gzipper = new Gzipper(COMPRESS_PATH, null);
      const compressionLogFake = sinon.fake();
      const compileFolderRecursively = sinon.fake.resolves(['one']);
      const successSpy = sinonSandbox.spy((gzipper as any).logger, 'success');

      sinonSandbox.replace(
        gzipper,
        'compressionLog' as any,
        compressionLogFake,
      );
      sinonSandbox.replace(
        gzipper,
        'compileFolderRecursively' as any,
        compileFolderRecursively,
      );
      await gzipper.compress();

      const [message] = successSpy.args[0];
      assert.ok(compressionLogFake.calledOnce);
      assert.ok(compileFolderRecursively.calledOnce);
      assert.strictEqual(message, '1 file has been compressed.');
    });
  });

  describe('compileFolderRecursively', () => {
    let sinonSandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sinonSandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sinonSandbox.restore();
      sinon.restore();
    });

    it("should ignore entity if it's not a file", async () => {
      const files = ['one', 'two'];
      const gzipper = new Gzipper(COMPRESS_PATH, null);
      sinonSandbox.stub((gzipper as any).nativeFs, 'readdir').resolves(files);
      sinonSandbox
        .stub((gzipper as any).nativeFs, 'lstat')
        .resolves({ isFile: () => false, isDirectory: () => false });

      const compressFile = sinon.fake();
      sinonSandbox.replace(gzipper, 'compressFile' as any, compressFile);
      await (gzipper as any).compileFolderRecursively(process.cwd());
      assert.ok(compressFile.notCalled);
    });

    it('should print time in seconds if operation takes more than 1000ms', async () => {
      const MESSAGE_VALIDATION = /File one\.js has been compressed \d+\.\d{4}Kb -> \d+\.\d{4}Kb \([1-9]\d*s \d+\.\d+ms\)/;
      const files = ['one.js', 'two.js'];
      const gzipper = new Gzipper(COMPRESS_PATH, null);
      const infoSpy = sinonSandbox.spy((gzipper as any).logger, 'info');
      sinonSandbox.stub((gzipper as any).nativeFs, 'readdir').resolves(files);
      sinonSandbox
        .stub((gzipper as any).nativeFs, 'lstat')
        .resolves({ isFile: () => true, isDirectory: () => false });

      const compressFileStub = sinonSandbox
        .stub(gzipper, 'compressFile' as any)
        .callsFake(async () => {
          return new Promise((resolve): void => {
            setTimeout(
              () => resolve({ beforeSize: 5000, afterSize: 4000 }),
              1100,
            );
          });
        });

      await (gzipper as any).compileFolderRecursively(process.cwd());
      assert.ok(compressFileStub.calledTwice);
      assert.ok(infoSpy.calledTwice);
      const [message] = infoSpy.args[0];
      assert.ok(MESSAGE_VALIDATION.test(message));
    });
  });

  describe('compileFolderRecursively', () => {
    const tmpFilename = 'one.js';
    let sinonSandbox: sinon.SinonSandbox;
    let tmpInputFilePath: string;

    beforeEach(async () => {
      sinonSandbox = sinon.createSandbox();
      tmpInputFilePath = path.join(RESOURCES_FOLDER_PATH, tmpFilename);
      await fsWriteFile(tmpInputFilePath, 'const a = () => null');
    });

    afterEach(async () => {
      sinonSandbox.restore();
      sinon.restore();
      await fsUnlink(tmpInputFilePath);
    });

    it("should throw an error if a file can't be compressed because of size calculation on verbose mode", async () => {
      const errName = 'FAKE_COMPRESSION_ERROR';
      const tmpOutputFilePath = path.join(
        RESOURCES_FOLDER_PATH,
        `${tmpFilename}.gz`,
      );
      await fsWriteFile(tmpInputFilePath, 'const a = () => null');

      const gzipper = new Gzipper(COMPRESS_PATH, null, {
        verbose: true,
        threshold: 0,
      });
      sinonSandbox
        .stub(gzipper, 'getOutputPath' as any)
        .returns(tmpOutputFilePath);
      sinonSandbox.stub((gzipper as any).nativeFs, 'stat').rejects(errName);

      try {
        await (gzipper as any).compressFile(tmpFilename, RESOURCES_FOLDER_PATH);
      } catch (err) {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.name, errName);
      } finally {
        await fsUnlink(tmpOutputFilePath);
      }
    });

    it("should throw an error if a file can't be compressed because of EISDIR exception", async () => {
      const gzipper = new Gzipper(COMPRESS_PATH, null);
      sinonSandbox
        .stub(gzipper, 'getOutputPath' as any)
        .returns(RESOURCES_FOLDER_PATH);

      try {
        await (gzipper as any).compressFile(tmpFilename, RESOURCES_FOLDER_PATH);
      } catch (err) {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.code, 'EISDIR');
      }
    });
  });

  describe('getOutputPath', () => {
    it('should returns finalized output path with prefixes', async () => {
      const gzipper = new Gzipper(COMPRESS_PATH, null, {
        outputFileFormat: 'iron-[hash]-[filename].[compressExt].[ext]',
        threshold: 0,
      });
      const response = (gzipper as any).getOutputPath(
        path.resolve(process.cwd(), 'amigo'),
        'test.js',
      );
      assert.ok(/iron-.+-test\.gz\.js/g.test(response));
    });

    it("should returns default text if artifact wasn't found", async () => {
      const gzipper = new Gzipper(COMPRESS_PATH, null, {
        outputFileFormat: 'iron-[hash]-[filename].[compressExt].[ext].[wrong]',
        threshold: 0,
      });
      (gzipper as any).outputFileFormatRegexp = /(\[filename\]*)|(\[hash\]*)|(\[compressExt\]*)|(\[ext\]*)|(\[wrong\]*)/g;
      const response = (gzipper as any).getOutputPath(
        path.resolve(process.cwd(), 'amigo'),
        'test.js',
      );
      assert.ok(/iron-.+-test\.gz\.js.\[wrong\]/g.test(response));
    });
  });
});
