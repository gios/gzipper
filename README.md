# Gzipper

[![Build Status](https://travis-ci.org/gios/gzipper.svg?branch=master)](https://travis-ci.org/gios/gzipper)
[![npm version](https://badge.fury.io/js/gzipper.svg)](https://badge.fury.io/js/gzipper)
[![codecov](https://codecov.io/gh/gios/gzipper/branch/master/graph/badge.svg)](https://codecov.io/gh/gios/gzipper)

A tool for compressing files by means of Brotli and Gzip algorithms, works seamlessly with many CLI UI tools (Angular CLI, Vue CLI, create-react-app).

The flexibility of the algorithms could be extended by many options flags, including the `gzip-level`, `gzip-strategy`, `gzip-memory-level`, `brotli-param-mode`, `brotli-quality`, `brotli-size-hint`. All flags can be declared via ENV variables (ENV variables have higher priority over CLI arguments).

You can enable `verbose` mode for better visual representation, customize your file output using `output-file-format` or compress with `incremental` flag if you have a lot of files that rarely change.

By default `gzipper` compress **all the files** but you could use `include` or `exclude` options for flexibility.

- [Gzipper](#gzipper)
  - [Install](#install)
  - [Usage](#usage)
    - [Gzipper](#gzipper-1)
    - [Compress|c](#compressc)
    - [Cache](#cache)
  - [Examples](#examples)
    - [CLI](#cli)
    - [Node.js Module](#nodejs-module)
  - [Options](#options)
    - [Compress|c](#compressc-1)
      - [--incremental](#--incremental)
      - [-v, --verbose](#-v---verbose)
      - [-e, --exclude <extensions>](#-e---exclude-extensions)
      - [-i, --include <extensions>](#-i---include-extensions)
      - [-t, --threshold <number>](#-t---threshold-number)
      - [--gzip](#--gzip)
      - [--deflate](#--deflate)
      - [--brotli](#--brotli)
      - [--zopfli](#--zopfli)
      - [--gzip-level <number>](#--gzip-level-number)
      - [--gzip-memory-level <number>](#--gzip-memory-level-number)
      - [--gzip-strategy <number>](#--gzip-strategy-number)
      - [--deflate-level <number>](#--deflate-level-number)
      - [--deflate-memory-level <number>](#--deflate-memory-level-number)
      - [--deflate-strategy <number>](#--deflate-strategy-number)
      - [--brotli-param-mode <value>](#--brotli-param-mode-value)
      - [--brotli-quality <number>](#--brotli-quality-number)
      - [--brotli-size-hint <number>](#--brotli-size-hint-number)
      - [--zopfli-num-iterations <number>](#--zopfli-num-iterations-number)
      - [--zopfli-block-splitting](#--zopfli-block-splitting)
      - [--zopfli-block-splitting-last](#--zopfli-block-splitting-last)
      - [--zopfli-block-splitting-max <number>](#--zopfli-block-splitting-max-number)
      - [--output-file-format](#--output-file-format)
      - [--remove-larger](#--remove-larger)
      - [--skip-compressed](#--skip-compressed)
      - [--workers](#--workers)
    - [Cache](#cache-1)
      - [purge](#purge)
      - [size](#size)
  - [Changelog](#changelog)
  - [Contribution](#contribution)
  - [Support](#support)

## Install

- Globally

`npm i gzipper -g`

- Locally to `devDependencies`.

`npm i gzipper -D`

## Usage

### Gzipper

```shell
Usage: gzipper [options] [command]

Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  compress|c [options] <path> [outputPath]  compress selected path and optionally set output directory
  cache                                     manipulations with cache
  help [command]                            display help for command
```

### Compress|c

```shell
Usage: gzipper compress|c [options] <path> [outputPath]

compress selected path and optionally set output directory

Options:
  -v, --verbose                          detailed level of logs
  --incremental                          incremental compression
  -e, --exclude <extensions>             exclude file extensions from compression, example: jpeg,jpg...
  -i, --include <extensions>             include file extensions for compression, example: js,css,html...
  -t, --threshold <number>               exclude assets smaller than this byte size. 0 (default)
  --deflate                              enable deflate compression
  --brotli                               enable brotli compression
  --gzip                                 enable gzip compression
  --zopfli                               enable zopfli compression
  --gzip-level <number>                  gzip compression level 6 (default), 0 (no compression) - 9 (best compression)
  --gzip-memory-level <number>           amount of memory which will be allocated for gzip compression 8 (default), 1 (minimum memory) - 9 (maximum memory)
  --gzip-strategy <number>               gzip compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)
  --deflate-level <number>               deflate compression level 6 (default), 0 (no compression) - 9 (best compression)
  --deflate-memory-level <number>        amount of memory which will be allocated for deflate compression 8 (default), 1 (minimum memory) - 9 (maximum memory)
  --deflate-strategy <number>            deflate compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)
  --brotli-param-mode <value>            default, text (for UTF-8 text), font (for WOFF 2.0 fonts)
  --brotli-quality <number>              brotli compression quality 11 (default), 0 - 11
  --brotli-size-hint <number>            expected input size 0 (default)
  --zopfli-num-iterations <number>       maximum amount of times to rerun forward and backward pass to optimize LZ77 compression cost
  --zopfli-block-splitting               splits the data in multiple deflate blocks with optimal choice for the block boundaries
  --zopfli-block-splitting-last          chooses the optimal block split points only after doing the iterative LZ77 compression
  --zopfli-block-splitting-max <number>  maximum amount of blocks to split into (0 for unlimited, but this can give extreme results that hurt compression on some files)
  --output-file-format <value>           output file format with default artifacts [filename].[ext].[compressExt]
  --remove-larger                        remove compressed files if they larger than uncompressed originals
  --skip-compressed                      skip compressed files if they already exist
  --workers <number>                     numbers of workers which will be spawned, system CPU cores count (default)
  -h, --help                             display help for command
```

### Cache

```shell
Usage: gzipper cache [options] [command]

manipulations with cache

Options:
  -h, --help      display help for command

Commands:
  purge           purge cache storage
  size            size of cached resources
  help [command]  display help for command
```

## Examples

### CLI

- Globally usage

  `gzipper compress [options] <path> [outputPath]`

- Locally usage

  1. Add module to scripts in your package.json and run `compress` command `npm run compress`.

  ```json
    "scripts": {
      "gzipper": "gzipper",
      "compress": "gzipper compress ./src"
    }
  ```

  2. Use `npx` command.

  ```json
    "scripts": {
      "compress": "npx gzipper compress ./src"
    }
  ```

- UI build tools (e.g. Angular CLI)

```json
  "scripts": {
    "build": "ng build && gzipper compress ./src"
  }
```

- Compress files to a certain directory `./dist` (folders structure inside `src` will be saved)

```json
  "scripts": {
    "compress": "gzipper compress ./src ./dist"
  }
```

- Compress files to very deep folder `./very/deep/folder/dist` (all folders will be automatically created if not exist)

```json
  "scripts": {
    "compress": "gzipper compress ./src ./very/deep/folder/dist"
  }
```

- Compress a single file

```json
  "scripts": {
    "compress": "gzipper compress ./src/awesomeness.txt"
  }
```

### Node.js Module

```javascript
const { Compress } = require('gzipper');
const gzip = new Compress('./src', './dist', {
  verbose: true,
  brotli: true,
  deflate: true,
});

try {
  const files = await gzip.run();
  console.info('Compressed files: ', files);
} catch (err) {
  console.error(err);
}
```

## Options

### Compress|c

| Option                                                                        | ENV                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------- |
| [`--incremental`](#--incremental)                                             | `GZIPPER_INCREMENTAL` (0 or 1)                 |
| [`-v, --verbose`](#-v---verbose)                                              | `GZIPPER_VERBOSE` (0 or 1)                     |
| [`-e, --exclude <extensions>`](#-e---exclude-extensions)                      | `GZIPPER_EXCLUDE`                              |
| [`-i, --include <extensions>`](#-i---include-extensions)                      | `GZIPPER_INCLUDE`                              |
| [`-t, --threshold <number>`](#-t---threshold-number)                          | `GZIPPER_THRESHOLD`                            |
| [`--gzip`](#--gzip)                                                           | `GZIPPER_GZIP` (0 or 1)                        |
| [`--deflate`](#--deflate)                                                     | `GZIPPER_DEFLATE` (0 or 1)                     |
| [`--brotli`](#--brotli)                                                       | `GZIPPER_BROTLI` (0 or 1)                      |
| [`--zopfli`](#--zopfli)                                                       | `GZIPPER_ZOPFLI` (0 or 1)                      |
| [`--gzip-level <number>`](#--gzip-level-number)                               | `GZIPPER_GZIP_LEVEL`                           |
| [`--gzip-memory-level <number>`](#--gzip-memory-level-number)                 | `GZIPPER_GZIP_MEMORY_LEVEL`                    |
| [`--gzip-strategy <number>`](#--gzip-strategy-number)                         | `GZIPPER_GZIP_STRATEGY`                        |
| [`--deflate-level <number>`](#--deflate-level-number)                         | `GZIPPER_DEFLATE_LEVEL`                        |
| [`--deflate-memory-level <number>`](#--deflate-memory-level-number)           | `GZIPPER_DEFLATE_MEMORY_LEVEL`                 |
| [`--deflate-strategy <number>`](#--deflate-strategy-number)                   | `GZIPPER_DEFLATE_STRATEGY`                     |
| [`--brotli-param-mode <value>`](#--brotli-param-mode-value)                   | `GZIPPER_BROTLI_PARAM_MODE`                    |
| [`--brotli-quality <number>`](#--brotli-quality-number)                       | `GZIPPER_BROTLI_QUALITY`                       |
| [`--brotli-size-hint <number>`](#--brotli-size-hint-number)                   | `GZIPPER_BROTLI_SIZE_HINT`                     |
| [--zopfli-num-iterations <number>](#--zopfli-num-iterations-number)           | `GZIPPER_ZOPFLI_NUM_ITERATIONS`                |
| [--zopfli-block-splitting](#--zopfli-block-splitting)                         | `GZIPPER_ZOPFLI_BLOCK_SPLITTING` (0 or 1)      |
| [--zopfli-block-splitting-last](#--zopfli-block-splitting-last)               | `GZIPPER_ZOPFLI_BLOCK_SPLITTING_LAST` (0 or 1) |
| [--zopfli-block-splitting-max <number>](#--zopfli-block-splitting-max-number) | `GZIPPER_ZOPFLI_BLOCK_SPLITTING_MAX`           |
| [`--output-file-format <value>`](#--output-file-format)                       | `GZIPPER_OUTPUT_FILE_FORMAT`                   |
| [`--remove-larger`](#--remove-larger)                                         | `GZIPPER_REMOVE_LARGER` (0 or 1)               |
| [`--skip-compressed`](#--skip-compressed)                                     | `GZIPPER_SKIP_COMPRESSED` (0 or 1)             |
| [`--workers`](#--workers)                                                     | `GZIPPER_WORKERS`                              |

> ENV Variables have higher priority over CLI arguments.

#### --incremental

`gzipper c ./src --incremental`

A special type of compression that significantly decreases the time of compression (_on the second run_) if you have a lot of big and rarely updated files. It creates a `.gzipper` folder with pre-compressed files (`cache`) and config that stores all necessary metadata (`.gzipperconfig`).

#### -v, --verbose

`gzipper c ./src --verbose`

Get more information about executed work. (_Could increase time of compression because of gathering additional metrics_)

#### -e, --exclude <extensions>

`gzipper c ./src --exclude jpeg,png,ico`

Exclude file extensions from compression (compression extensions like gz, zz, br, etc. excluded by default), example: jpeg,jpg...

#### -i, --include <extensions>

`gzipper c ./src --include jpeg,png,ico`

Include file extensions for compression(exclude others), example: js,css,html...

#### -t, --threshold <number>

`gzipper c ./src --threshold 900`

Exclude assets smaller than this byte size. 0 (default)

#### --gzip

`gzipper c ./src --gzip`

Enable gzip compression. (default behavior)

#### --deflate

`gzipper c ./src --deflate`

Enable deflate compression.

#### --brotli

`gzipper c ./src --brotli`

Enable brotli compression.

#### --zopfli

`gzipper c ./src --zopfli`

Enable zopfli compression.

#### --gzip-level <number>

`gzipper c ./src --gzip-level 8`

Gzip compression level 6 (default), 0 (no compression) - 9 (best compression)

#### --gzip-memory-level <number>

`gzipper c ./src --gzip-memory-level 2`

Amount of memory that will be allocated for gzip compression 8 (default), 1 (minimum memory) - 9 (maximum memory)

#### --gzip-strategy <number>

`gzipper c ./src --gzip-strategy 3`

Gzip compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)

#### --deflate-level <number>

`gzipper c ./src --deflate-level 8`

Deflate compression level 6 (default), 0 (no compression) - 9 (best compression)

#### --deflate-memory-level <number>

`gzipper c ./src --deflate-memory-level 2`

Amount of memory that will be allocated for deflate compression 8 (default), 1 (minimum memory) - 9 (maximum memory)

#### --deflate-strategy <number>

`gzipper c ./src --deflate-strategy 3`

Deflate compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)

#### --brotli-param-mode <value>

`gzipper c ./src --brotli-param-mode text`

Available values are default, text (for UTF-8 text), font (for WOFF 2.0 fonts), only for `--brotli`

#### --brotli-quality <number>

`gzipper c ./src --brotli-quality 10`

Brotli compression quality 11 (default), 0 - 11, only for `--brotli`

#### --brotli-size-hint <number>

`gzipper c ./src --brotli-size-hint 6`

Expected input size 0 (default), only for `--brotli`

#### --zopfli-num-iterations <number>

`gzipper c ./src --zopfli-num-iterations 15`

Maximum amount of times to rerun forward and backward pass to optimize LZ77 compression cost. Good values: 10, 15 for small files, 5 for files over several MB in size or it will be too slow, only for `--zopfli`

#### --zopfli-block-splitting

`gzipper c ./src --zopfli-block-splitting`

If true, splits the data in multiple deflate blocks with optimal choice for the block boundaries. Block splitting gives better compression, only for `--zopfli`

#### --zopfli-block-splitting-last

`gzipper c ./src --zopfli-block-splitting-last`

If true, chooses the optimal block split points only after doing the iterative LZ77 compression. If false, chooses the block split points first, then does iterative LZ77 on each individual block. Depending on the file, either first or last gives the best compression, only for `--zopfli`

#### --zopfli-block-splitting-max <number>

`gzipper c ./src --zopfli-block-splitting-max 5`

Maximum amount of blocks to split into (0 for unlimited, but this can give extreme results that hurt compression on some files), only for `--zopfli`

#### --output-file-format

Output file format with artifacts, default format: `[filename].[ext].[compressExt]`. Where: `filename` -> name of your file, `ext` -> file extension, `compressExt` -> compress extension (.gz, .br, etc), `hash` -> uniq hash.

_Example:_ Expected project structure.

```
img
  rabbit.jpg
  cat.jpg
js
  main.js
  modules.js
xml
  main.xml
index.js
```

- `gzipper c ./src --output-file-format [filename].[compressExt].[ext]`

```
img
  rabbit.gz.jpg
  cat.gz.jpg
js
  main.gz.js
  modules.gz.js
xml
  main.gz.xml
index.gz.js
```

- `gzipper c ./src --output-file-format test-[filename]-[hash].[compressExt].[ext]`

```
img
  test-rabbit-b4564011-ba7c-4bd6-834d-bf6c7791b7d4.gz.jpg
  test-cat-739c7d7d-53ca-4f8e-912c-bad3b2b515a9.gz.jpg
js
  test-main-4cc35dbd-36f7-4889-9f41-4d93e7a25bef.gz.js
  test-modules-bce90cbd-5bf2-43c2-8b61-33aa1599b704.gz.js
xml
  test-main-a90fa10e-f7a4-4af9-af67-f887bb96f98b.gz.xml
test-index-067c1e2d-0e12-4b57-980b-97c880c24d57.gz.js
```

- `gzipper c ./src --output-file-format [filename]-[hash]-[filename]-tmp.[ext].[compressExt]`

```
img
  rabbit-b4564011-ba7c-4bd6-834d-bf6c7791b7d4-rabbit-tmp.jpg.gz
  cat-739c7d7d-53ca-4f8e-912c-bad3b2b515a9cat-tmp.jpg.gz
js
  main-4cc35dbd-36f7-4889-9f41-4d93e7a25bef-main-tmp.js.gz
  modules-bce90cbd-5bf2-43c2-8b61-33aa1599b704-modules-tmp.js.gz
xml
  main-a90fa10e-f7a4-4af9-af67-f887bb96f98b-main-tmp.xml.gz
index-067c1e2d-0e12-4b57-980b-97c880c24d57-index-tmp.js.gz
```

#### --remove-larger

Removes compressed files that larger than uncompressed originals in your directory.

#### --skip-compressed

Ignores compressed files that have already exist in your directory. Works only with default `--output-file-format`.

#### --workers

Spawn workers for parallel compression, be aware of workers number because every worker creates an additional thread. More info [there](https://nodesource.com/blog/worker-threads-nodejs/).

### Cache

| Command           |
| ----------------- |
| [`purge`](#purge) |
| [`size`](#size)   |

#### purge

`gzipper cache purge`

Removes all pre-compressed files from `cache` that was generated via `--incremental` flag.

#### size

`gzipper cache size`

Returns the size of all pre-compiled files from `cache`.

## Changelog

[CHANGELOG.md](./CHANGELOG.md)

## Contribution

I appreciate every contribution, just fork the repository and send the pull request with your changes.

## Support

- Node.js >= 12
