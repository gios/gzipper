import zlib from 'zlib';

export interface CompressOptions {
  verbose?: boolean;
  incremental?: boolean;
  exclude?: string[];
  include?: string[];
  threshold: number;
  level?: number;
  memoryLevel?: number;
  strategy?: number;
  deflate?: boolean;
  brotli?: boolean;
  brotliParamMode?: string;
  brotliQuality?: number;
  brotliSizeHint?: number;
  outputFileFormat?: string;
  [key: string]: unknown;
}

export type CompressionOptions = {
  level?: number;
  memoryLevel?: number;
  strategy?: number;
} & zlib.ZlibOptions;

export type BrotliOptions = { [key: number]: number };

export interface CompressedFile {
  beforeSize: number;
  afterSize: number;
  isCached: boolean;
}

export interface Cache {
  cachePurge(): Promise<void>;
  cacheSize(): Promise<number>;
}

export interface FileConfig {
  incremental?: IncrementalConfig;
  version: string;
}

export interface IncrementalFileValue {
  checksum: string;
  fileId: string;
  options: CompressionOptions | BrotliOptions;
}

export interface IncrementalConfig {
  files: {
    [path: string]: IncrementalFileValue;
  };
}
