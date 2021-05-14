export const OUTPUT_FILE_FORMAT_REGEXP = /(\[filename\]*)|(\[hash\]*)|(\[compressExt\]*)|(\[ext\]*)/g;
export const NO_FILES_MESSAGE = 'No files for compression.';
export const WORKER_STARTED = 'Worker has started.';
export const NO_PATH_MESSAGE = `Can't find a path.`;
export const INCREMENTAL_ENABLE_MESSAGE =
  'Incremental compression has been enabled.';
export const DEFAULT_OUTPUT_FORMAT_MESSAGE =
  'Default output file format: [filename].[ext].[compressExt]';
export const CONFIG_FOLDER = '.gzipper';
export const CACHE_FOLDER = 'cache';
export const CONFIG_FILE = '.gzipperconfig';
export const COMPRESSION_EXTENSIONS = ['gz', 'zz', 'br'];
