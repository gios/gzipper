import sinon from 'sinon';
import assert from 'assert';

import { COMPRESS_PATH } from '../utils';
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

  // describe('compileFolderRecursively', () => {
  //   let sinonSandbox: sinon.SinonSandbox;

  //   beforeEach(() => {
  //     sinonSandbox = sinon.createSandbox();
  //   });

  //   afterEach(() => {
  //     sinonSandbox.restore();
  //     sinon.restore();
  //   });

  //   it("should ignore entity if it's not a file", async () => {
  //     const gzipper = new Gzipper(COMPRESS_PATH, null);
  //     sinonSandbox.stub((gzipper as any).nativeFs, 'readdir').resolves(1);
  //     await (gzipper as any).compileFolderRecursively();
  //   });
  // });
});
