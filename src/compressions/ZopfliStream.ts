import { gzip } from "@gfx/zopfli";
import { Transform, TransformCallback } from "node:stream";

import { ZopfliOptions } from "../interfaces";

export class ZopfliStream extends Transform {
  private buffer: Buffer;
  private options: ZopfliOptions;

  constructor(options: ZopfliOptions) {
    super();
    this.buffer = Buffer.alloc(0);
    this.options = options;
  }

  _transform(
    chunk: Buffer,
    _: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    callback();
  }

  _flush(callback: TransformCallback): void {
    const buffer = Buffer.from(this.buffer);
    gzip(buffer, this.options, (err, buffer) => {
      if (err) {
        callback(err);
      } else {
        this.push(buffer);
        callback();
      }
    });
  }
}
