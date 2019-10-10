export interface GlobalOptions {
  verbose?: boolean;
  exclude?: string[];
  include?: string[];
  threshold: number;
  gzipLevel?: number;
  gzipMemoryLevel?: number;
  gzipStrategy?: number;
  brotli?: boolean;
  brotliParamMode?: string;
  brotliQuality?: number;
  brotliSizeHint?: number;
  outputFileFormat?: string;
}
