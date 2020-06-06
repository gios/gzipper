import assert from "assert";
import sinon from "sinon";
import zlib from "zlib";

import { Compress } from "../../../../src/Compress";
import {
  COMPRESS_PATH,
  getFiles,
  clear,
  COMPRESSION_EXTENSIONS,
} from "../../../utils";

describe("CLI Compress -> Gzip compression", () => {
  beforeEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  afterEach(async () => {
    await clear(COMPRESS_PATH, COMPRESSION_EXTENSIONS);
  });

  it("--level, --memory-level, --strategy should change gzip configuration", async () => {
    const options = {
      level: 6,
      memoryLevel: 4,
      strategy: 2,
      threshold: 0,
    };
    const compress = new Compress(COMPRESS_PATH, null, options);
    const loggerSuccessSpy = sinon.spy((compress as any).logger, "success");
    await compress.run();
    const files = await getFiles(COMPRESS_PATH, [".gz"]);

    assert.ok(
      loggerSuccessSpy.calledOnceWithExactly(
        `${files.length} files have been compressed.`,
        true,
      ),
    );
    assert.ok(
      (compress as any).createCompression() instanceof (zlib as any).Gzip,
    );
    assert.strictEqual((compress as any).compressionInstance.ext, "gz");
    assert.strictEqual(
      Object.keys((compress as any).compressionInstance.compressionOptions)
        .length,
      3,
    );
    assert.strictEqual(Object.keys((compress as any).options).length, 4);
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions.level,
      6,
    );
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions.memLevel,
      4,
    );
    assert.strictEqual(
      (compress as any).compressionInstance.compressionOptions.strategy,
      2,
    );
  });
});
