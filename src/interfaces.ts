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
  removeLarger?: boolean;
  skipCompressed?: boolean;
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
  isSkipped: boolean;
  removeCompressed: boolean;
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
  revisions: IncrementalFileValueRevision[];
}

export interface IncrementalFileValueRevision {
  lastChecksum: string;
  fileId: string;
  date: Date;
  options: CompressionOptions | BrotliOptions;
}

export interface IncrementalConfig {
  files: Record<string, IncrementalFileValue>;
}
