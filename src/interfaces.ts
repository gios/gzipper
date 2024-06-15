import zlib from 'node:zlib';

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

export type GenericCompressionOptions = {
  level?: number;
  memoryLevel?: number;
  strategy?: number;
} & zlib.ZlibOptions;

export type BrotliOptions = Record<number, number>;

export interface ZstdOptions {
  level?: number;
}

export interface ZopfliOptions {
  numiterations?: number;
  blocksplitting?: boolean;
  blocksplittingmax?: number;
}

export type CompressionOptions =
  | GenericCompressionOptions
  | BrotliOptions
  | ZstdOptions
  | ZopfliOptions;

export type CompressionType =
  | BrotliCompression
  | DeflateCompression
  | GzipCompression
  | ZopfliCompression
  | ZstdCompression;

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
  version?: string;
}

export interface IncrementalFileValue {
  revisions: IncrementalFileValueRevision[];
}

export interface IncrementalFileValueRevision {
  lastChecksum: string;
  fileId: string;
  date: Date;
  compressionType: string;
  options: CompressionOptions;
}

export interface IncrementalConfig {
  files: Record<string, IncrementalFileValue>;
}

export interface WorkerMessage {
  files: string[];
  filePaths: Record<string, IncrementalFileValue>;
}
