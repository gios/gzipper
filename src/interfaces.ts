import zlib from 'zlib';

import { BrotliCompression } from './compressions/Brotli';
import { DeflateCompression } from './compressions/Deflate';
import { GzipCompression } from './compressions/Gzip';
import { ZopfliCompression } from './compressions/Zopfli';
import { ZstdCompression } from './compressions/Zstd';

export interface CompressOptions {
  verbose?: boolean;
  incremental?: boolean;
  exclude?: string[];
  include?: string[];
  threshold?: number;
  gzip?: boolean;
  deflate?: boolean;
  brotli?: boolean;
  zopfli?: boolean;
  zstd?: boolean;
  gzipLevel?: number;
  gzipMemoryLevel?: number;
  gzipStrategy?: number;
  deflateLevel?: number;
  deflateMemoryLevel?: number;
  deflateStrategy?: number;
  brotliParamMode?: string;
  brotliQuality?: number;
  brotliSizeHint?: number;
  zopfliNumIterations?: number;
  zopfliBlockSplitting?: boolean;
  zopfliBlockSplittingMax?: number;
  zstdLevel?: number;
  outputFileFormat?: string;
  removeLarger?: boolean;
  skipCompressed?: boolean;
  workers?: number;
  color?: boolean;
}

export type CompressionOptions = {
  level?: number;
  memoryLevel?: number;
  strategy?: number;
} & zlib.ZlibOptions;

export type CompressionType =
  | BrotliCompression
  | DeflateCompression
  | GzipCompression
  | ZopfliCompression
  | ZstdCompression;

export type BrotliOptions = { [key: number]: number };

export type ZstdOptions = {
  level?: number;
};

export type ZopfliOptions = {
  numiterations?: number;
  blocksplitting?: boolean;
  blocksplittingmax?: number;
};

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
  compressionType: string;
  options: CompressionOptions | BrotliOptions;
}

export interface IncrementalConfig {
  files: Record<string, IncrementalFileValue>;
}

export interface WorkerMessage {
  files: string[];
  filePaths: Record<string, IncrementalFileValue>;
}
