declare module 'node-zstd' {
  import { Transform } from 'stream';
  import { Zlib } from 'zlib';

  interface Options {
    level?: number | undefined;
  }
  interface Zstd extends Transform, Zlib {}

  export function compressStream(options?: Options): Zstd;
}
