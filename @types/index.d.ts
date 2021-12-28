declare module 'simple-zstd' {
  import { Transform } from 'stream';
  import { Zlib } from 'zlib';

  interface ZSTDCompress extends Transform, Zlib {}
  export const ZSTDCompress: (level: number | undefined) => ZSTDCompress;
}
