import sinon from 'sinon';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const fsWriteFile = promisify(fs.writeFile);
const fsUnlink = promisify(fs.unlink);

import { COMPRESS_PATH, RESOURCES_FOLDER_PATH } from '../utils';
import { Compress } from '../../src/Compress';
import { LogLevel } from '../../src/logger/LogLevel.enum';

describe('Methods Compress', () => {
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
      const compress = new Compress(COMPRESS_PATH, null);
      const compressionLogFake = sinon.fake();
      const compressFolderRecursively = sinon.fake.resolves(['one']);
      const logSpy = sinon.spy((compress as any).logger, 'log');

      sinonSandbox.replace(
        compress,
        'compressionLog' as any,
        compressionLogFake,
      );
      sinonSandbox.replace(
        compress,
        'compressFolderRecursively' as any,
        compressFolderRecursively,
      );
      await compress.run();

      const [message, level] = logSpy.args[0];
      assert.ok(compressionLogFake.calledOnce);
      assert.ok(compressFolderRecursively.calledOnce);
      assert.ok(/1 file has been compressed. (.+)/.test(message));
      assert.strictEqual(level, LogLevel.SUCCESS);
    });
  });

  describe('compressFolderRecursively', () => {
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
      const compress = new Compress(COMPRESS_PATH, null);
      sinonSandbox.stub((compress as any).nativeFs, 'readdir').resolves(files);
      sinonSandbox
        .stub((compress as any).nativeFs, 'lstat')
        .resolves({ isFile: () => false, isDirectory: () => false });

      const compressFile = sinon.fake();
      sinonSandbox.replace(compress, 'compressFile' as any, compressFile);
      await (compress as any).compressFolderRecursively(process.cwd());
      assert.ok(compressFile.notCalled);
    });

    it('should print time in seconds if operation takes more than 1000ms', async () => {
      const MESSAGE_VALIDATION = /File amigo\.js has been compressed \d+\.?\d+ \w+ -> \d+\.?\d+ \w+ \([1-9]\d*s \d+\.\d+ms\)/;
      const compress = new Compress(COMPRESS_PATH, null);
      const message = (compress as any).getCompressedFileMsg(
        'amigo.js',
        {
          beforeSize: 100,
          afterSize: 99,
          isCached: false,
        },
        [10, 999],
      );
      assert.ok(MESSAGE_VALIDATION.test(message));
    });
  });

  describe('compressFolderRecursively', () => {
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

    it("should throw an error if a file can't be compressed because of size calculation", async () => {
      const errName = 'FAKE_COMPRESSION_ERROR';
      const tmpOutputFilePath = path.join(
        RESOURCES_FOLDER_PATH,
        `${tmpFilename}.gz`,
      );
      await fsWriteFile(tmpInputFilePath, 'const a = () => null');

      const compress = new Compress(COMPRESS_PATH, null, {
        threshold: 0,
      });
      sinonSandbox
        .stub(compress, 'getOutputPath' as any)
        .returns(tmpOutputFilePath);
      sinonSandbox.stub((compress as any).nativeFs, 'lstat').rejects(errName);

      try {
        await (compress as any).compressFile(
          tmpFilename,
          RESOURCES_FOLDER_PATH,
        );
      } catch (err) {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.name, errName);
      } finally {
        await fsUnlink(tmpOutputFilePath);
      }
    });

    it("should throw an error if a file can't be compressed because of EISDIR exception", async () => {
      const compress = new Compress(COMPRESS_PATH, null);
      sinonSandbox
        .stub(compress, 'getOutputPath' as any)
        .returns(RESOURCES_FOLDER_PATH);

      try {
        await (compress as any).compressFile(
          tmpFilename,
          RESOURCES_FOLDER_PATH,
        );
      } catch (err) {
        assert.ok(err instanceof Error);
        assert.strictEqual((err as any).code, 'EISDIR');
      }
    });
  });

  describe('getOutputPath', () => {
    it('should returns correct file path', () => {
      const compress = new Compress(COMPRESS_PATH, null);
      const target = '/the/elder/scrolls/';
      const file = 'skyrim.js';

      let outputFilePath = (compress as any).getOutputPath(target, file);
      assert.strictEqual(
        outputFilePath,
        '/the/elder/scrolls/skyrim.js.gz'.split('/').join(path.sep),
      );

      (compress as any).options.outputFileFormat =
        'test[filename].[compressExt].[ext]';
      outputFilePath = (compress as any).getOutputPath(target, file);
      assert.strictEqual(
        outputFilePath,
        '/the/elder/scrolls/testskyrim.gz.js'.split('/').join(path.sep),
      );

      (compress as any).options.outputFileFormat =
        '[filename]-test.[compressExt]';
      outputFilePath = (compress as any).getOutputPath(target, file);
      assert.strictEqual(
        outputFilePath,
        '/the/elder/scrolls/skyrim-test.gz'.split('/').join(path.sep),
      );

      (compress as any).options.outputFileFormat =
        '[filename]-[hash]-[filename]-test.[compressExt].[ext]';
      outputFilePath = (compress as any).getOutputPath(target, file);
      const execHash = /(?<=skyrim-)(.*)(?=-skyrim)/.exec(
        outputFilePath,
      ) as RegExpExecArray;
      assert.strictEqual(
        outputFilePath,
        `/the/elder/scrolls/skyrim-${execHash[0]}-skyrim-test.gz.js`
          .split('/')
          .join(path.sep),
      );
    });

    it('should returns finalized output path with prefixes', async () => {
      const compress = new Compress(COMPRESS_PATH, null, {
        outputFileFormat: 'iron-[hash]-[filename].[compressExt].[ext]',
        threshold: 0,
      });
      const response = (compress as any).getOutputPath(
        path.resolve(process.cwd(), 'amigo'),
        'test.js',
      );
      assert.ok(/iron-.+-test\.gz\.js/g.test(response));
    });

    it("should returns default text if artifact wasn't found", async () => {
      const compress = new Compress(COMPRESS_PATH, null, {
        outputFileFormat: 'iron-[hash]-[filename].[compressExt].[ext].[wrong]',
        threshold: 0,
      });
      (compress as any).outputFileFormatRegexp = /(\[filename\]*)|(\[hash\]*)|(\[compressExt\]*)|(\[ext\]*)|(\[wrong\]*)/g;
      const response = (compress as any).getOutputPath(
        path.resolve(process.cwd(), 'amigo'),
        'test.js',
      );
      assert.ok(/iron-.+-test\.gz\.js.\[wrong\]/g.test(response));
    });
  });
});
