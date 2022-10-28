# Gzipper

[![Support Ukraine Badge](https://bit.ly/support-ukraine-now)](https://github.com/support-ukraine/support-ukraine)
[![Build Status](https://travis-ci.org/gios/gzipper.svg?branch=master)](https://travis-ci.org/gios/gzipper)
[![npm version](https://badge.fury.io/js/gzipper.svg)](https://badge.fury.io/js/gzipper)
[![codecov](https://codecov.io/gh/gios/gzipper/branch/master/graph/badge.svg)](https://codecov.io/gh/gios/gzipper)

A tool for compressing files by means of
[Deflate](https://wikiless.org/wiki/DEFLATE),
[Brotli](https://wikiless.org/wiki/Brotli),
[gzip](https://wikiless.org/wiki/Gzip),
[Zopfli](https://wikiless.org/wiki/Zopfli) and
[zstd](https://wikiless.org/wiki/Zstd) algorithms,
works seamlessly with many CLI UI tools (Angular CLI, Vue CLI, create-react-app).

The flexibility of the algorithms could be extended by many options,
including the [`--gzip-level`](#--gzip-level-number),
[`--gzip-strategy`](#--gzip-strategy-number),
[`--gzip-memory-level`](#--gzip-memory-level-number),
[`--brotli-param-mode`](#--brotli-param-mode-value),
[`--brotli-quality`](#--brotli-quality-number),
[`--brotli-size-hint`](#--brotli-size-hint-number).
All options can be declared via ENV variables (ENV variables have higher priority over CLI arguments).

You can enable [`--verbose`](#-v---verbose) mode for better visual representation,
customize your file output using [`--output-file-format`](#--output-file-format-value)
or compress with [`--incremental`](#--incremental) option if you have a lot of files that rarely change.

By default `gzipper` compress **all the files** but you could use
[`--include`](#-i---include-extensions) or [`--exclude`](#-e---exclude-extensions) options for flexibility.

- [Gzipper](#gzipper)
  - [Install](#install)
  - [Usage](#usage)
    - [`gzipper`](#gzipper-1)
    - [`compress|c`](#compressc)
    - [`cache`](#cache)
  - [Examples](#examples)
    - [CLI](#cli)
    - [Node.js Module](#nodejs-module)
  - [Options](#options)
    - [`compress|c`](#compressc-1)
      - [`--incremental`](#--incremental)
      - [`-v`, `--verbose`](#-v---verbose)
      - [`-e`, `--exclude <extensions>`](#-e---exclude-extensions)
      - [`-i`, `--include <extensions>`](#-i---include-extensions)
      - [`-t`, `--threshold <number>`](#-t---threshold-number)
      - [`--gzip`](#--gzip)
      - [`--deflate`](#--deflate)
      - [`--brotli`](#--brotli)
      - [`--zopfli`](#--zopfli)
      - [`--zstd`](#--zstd)
      - [`--gzip-level <number>`](#--gzip-level-number)
      - [`--gzip-memory-level <number>`](#--gzip-memory-level-number)
      - [`--gzip-strategy <number>`](#--gzip-strategy-number)
      - [`--deflate-level <number>`](#--deflate-level-number)
      - [`--deflate-memory-level <number>`](#--deflate-memory-level-number)
      - [`--deflate-strategy <number>`](#--deflate-strategy-number)
      - [`--brotli-param-mode <value>`](#--brotli-param-mode-value)
      - [`--brotli-quality <number>`](#--brotli-quality-number)
      - [`--brotli-size-hint <number>`](#--brotli-size-hint-number)
      - [`--zopfli-num-iterations <number>`](#--zopfli-num-iterations-number)
      - [`--zopfli-block-splitting`](#--zopfli-block-splitting)
      - [`--zopfli-block-splitting-max <number>`](#--zopfli-block-splitting-max-number)
      - [`--zstd-level <number>`](#--zstd-level-number)
      - [`--output-file-format <value>`](#--output-file-format-value)
      - [`--remove-larger`](#--remove-larger)
      - [`--skip-compressed`](#--skip-compressed)
      - [`--workers <number>`](#--workers-number)
      - [`--no-color`](#--no-color)
    - [`cache`](#cache-1)
      - [`purge`](#purge)
      - [`size`](#size)
  - [Changelog](#changelog)
  - [Contribution](#contribution)
  - [Support](#support)
  - [Prerequisites](#prerequisites)

## Install

- Globally

  `npm i gzipper -g`

- Locally to `devDependencies`.

  `npm i gzipper -D`

## Usage

### `gzipper`

```sh
Usage: gzipper [options] [command]

Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  compress|c [options] <path> [outputPath]  compress selected path and optionally set output directory
  cache                                     manipulations with cache
  help [command]                            display help for command
```

### `compress|c`

```sh
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
  --zstd                                 enable zstd compression
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
  --zopfli-block-splitting-max <number>  maximum amount of blocks to split into (0 for unlimited, but this can give extreme results that hurt compression on some files)
  --zstd-level <number>                  zstd compression level 1 (default), 5 (best compression)
  --output-file-format <value>           output file format with default artifacts [filename].[ext].[compressExt]
  --remove-larger                        remove compressed files if they larger than uncompressed originals
  --skip-compressed                      skip compressed files if they already exist
  --workers <number>                     numbers of workers which will be spawned, system CPU cores count (default)
  --no-color                             disable logger colorful messages
  -h, --help                             display help for command
```

### `cache`

```sh
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

  1. Add module to scripts in your package.json and run `compress` command `npm run compress`

      ```json
        "scripts": {
          "gzipper": "gzipper",
          "compress": "gzipper compress ./src"
        }
      ```

  2. Use `npx` command

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

### `compress|c`

| CLI argument                                                                    | ENV variable                                  |
| ------------------------------------------------------------------------------- | --------------------------------------------- |
| [`--incremental`](#--incremental)                                               | `GZIPPER_INCREMENTAL` (`0` or `1`)            |
| [`-v`, `--verbose`](#-v---verbose)                                              | `GZIPPER_VERBOSE` (`0` or `1`)                |
| [`-e`, `--exclude <extensions>`](#-e---exclude-extensions)                      | `GZIPPER_EXCLUDE`                             |
| [`-i`, `--include <extensions>`](#-i---include-extensions)                      | `GZIPPER_INCLUDE`                             |
| [`-t`, `--threshold <number>`](#-t---threshold-number)                          | `GZIPPER_THRESHOLD`                           |
| [`--gzip`](#--gzip)                                                             | `GZIPPER_GZIP` (`0` or `1`)                   |
| [`--deflate`](#--deflate)                                                       | `GZIPPER_DEFLATE` (`0` or `1`)                |
| [`--brotli`](#--brotli)                                                         | `GZIPPER_BROTLI` (`0` or `1`)                 |
| [`--zopfli`](#--zopfli)                                                         | `GZIPPER_ZOPFLI` (`0` or `1`)                 |
| [`--zstd`](#--zstd)                                                             | `GZIPPER_ZSTD` (`0` or `1`)                   |
| [`--gzip-level <number>`](#--gzip-level-number)                                 | `GZIPPER_GZIP_LEVEL`                          |
| [`--gzip-memory-level <number>`](#--gzip-memory-level-number)                   | `GZIPPER_GZIP_MEMORY_LEVEL`                   |
| [`--gzip-strategy <number>`](#--gzip-strategy-number)                           | `GZIPPER_GZIP_STRATEGY`                       |
| [`--deflate-level <number>`](#--deflate-level-number)                           | `GZIPPER_DEFLATE_LEVEL`                       |
| [`--deflate-memory-level <number>`](#--deflate-memory-level-number)             | `GZIPPER_DEFLATE_MEMORY_LEVEL`                |
| [`--deflate-strategy <number>`](#--deflate-strategy-number)                     | `GZIPPER_DEFLATE_STRATEGY`                    |
| [`--brotli-param-mode <value>`](#--brotli-param-mode-value)                     | `GZIPPER_BROTLI_PARAM_MODE`                   |
| [`--brotli-quality <number>`](#--brotli-quality-number)                         | `GZIPPER_BROTLI_QUALITY`                      |
| [`--brotli-size-hint <number>`](#--brotli-size-hint-number)                     | `GZIPPER_BROTLI_SIZE_HINT`                    |
| [`--zopfli-num-iterations <number>`](#--zopfli-num-iterations-number)           | `GZIPPER_ZOPFLI_NUM_ITERATIONS`               |
| [`--zopfli-block-splitting`](#--zopfli-block-splitting)                         | `GZIPPER_ZOPFLI_BLOCK_SPLITTING` (`0` or `1`) |
| [`--zopfli-block-splitting-max <number>`](#--zopfli-block-splitting-max-number) | `GZIPPER_ZOPFLI_BLOCK_SPLITTING_MAX`          |
| [`--zstd-level <number>`](#--zstd-level-number)                                 | `GZIPPER_ZSTD_LEVEL`                          |
| [`--output-file-format <value>`](#--output-file-format-value)                   | `GZIPPER_OUTPUT_FILE_FORMAT`                  |
| [`--remove-larger`](#--remove-larger)                                           | `GZIPPER_REMOVE_LARGER` (`0` or `1`)          |
| [`--skip-compressed`](#--skip-compressed)                                       | `GZIPPER_SKIP_COMPRESSED` (`0` or `1`)        |
| [`--workers <number>`](#--workers-number)                                       | `GZIPPER_WORKERS`                             |
| [`--no-color`](#--no-color)                                                     | `GZIPPER_NO_COLOR` or `NO_COLOR` (`0` or `1`) |

> ENV variables have higher priority over CLI arguments.

#### `--incremental`

`gzipper c ./src --incremental`

A special type of compression that significantly decreases the time of compression
_(on the second run)_ if you have a lot of big and rarely updated files.
It creates a `.gzipper` folder with pre-compressed files (`cache`) and
config that stores all necessary metadata (`.gzipperconfig`).

#### `-v`, `--verbose`

`gzipper c ./src --verbose`

Get more information about executed work.
_(Could increase time of compression because of gathering additional metrics)_

#### `-e`, `--exclude <extensions>`

`gzipper c ./src --exclude jpeg,jpg,png,ico`

Exclude file extensions from compression.
Compression extensions `br`, `gz`, `zz` and `zst` are
[excluded by default](https://github.com/gios/gzipper/blob/master/src/enums.ts#L9).

#### `-i`, `--include <extensions>`

`gzipper c ./src --include js,css,html`

Include file extensions for compression (exclude others).

#### `-t`, `--threshold <number>`

`gzipper c ./src --threshold 900`

Exclude assets smaller than this byte size. Default is `0` byte.

#### `--gzip`

`gzipper c ./src --gzip`

Enable [gzip](https://wikiless.org/wiki/Gzip) compression. (default behavior)

#### `--deflate`

`gzipper c ./src --deflate`

Enable [Deflate](https://wikiless.org/wiki/DEFLATE) compression.

#### `--brotli`

`gzipper c ./src --brotli`

Enable [Brotli](https://wikiless.org/wiki/Brotli) compression.

#### `--zopfli`

`gzipper c ./src --zopfli`

Enable [Zopfli](https://wikiless.org/wiki/Zopfli) compression.

#### `--zstd`

`gzipper c ./src --zstd`

Enable [Zstandard](https://wikiless.org/wiki/Zstd) compression.

#### `--gzip-level <number>`

`gzipper c ./src --gzip-level 8`

gzip compression level:
`6` (default), `0` (no compression) - `9` (best compression).
Only for [`--gzip`](#--gzip).

#### `--gzip-memory-level <number>`

`gzipper c ./src --gzip-memory-level 2`

Amount of memory that will be allocated for gzip compression:
`8` (default), `1` (minimum memory) - `9` (maximum memory).
Only for [`--gzip`](#--gzip).

#### `--gzip-strategy <number>`

`gzipper c ./src --gzip-strategy 3`

gzip compression strategy:
`0` (default), `1` (filtered), `2` (huffman only), `3` (RLE), `4` (fixed).
Only for [`--gzip`](#--gzip).

#### `--deflate-level <number>`

`gzipper c ./src --deflate-level 8`

Deflate compression level:
`6` (default), `0` (no compression) - `9` (best compression).
Only for [`--deflate`](#--deflate).

#### `--deflate-memory-level <number>`

`gzipper c ./src --deflate-memory-level 2`

Amount of memory that will be allocated for deflate compression:
`8` (default), `1` (minimum memory) - `9` (maximum memory).
Only for [`--deflate`](#--deflate).

#### `--deflate-strategy <number>`

`gzipper c ./src --deflate-strategy 3`

Deflate compression strategy:
`0` (default), `1` (filtered), `2` (huffman only), `3` (RLE), `4` (fixed).
Only for [`--deflate`](#--deflate).

#### `--brotli-param-mode <value>`

`gzipper c ./src --brotli-param-mode text`

Available values are:
`text` (for UTF-8 text, default) and `font` (for WOFF 2.0 fonts).
Only for [`--brotli`](#--brotli).

#### `--brotli-quality <number>`

`gzipper c ./src --brotli-quality 10`

Brotli compression quality: `11` (default), `0` - `11`.
Only for [`--brotli`](#--brotli).

#### `--brotli-size-hint <number>`

`gzipper c ./src --brotli-size-hint 6`

Estimated total input size for all files to compress:
`0` (default, which means that the size is unknown).
Only for [`--brotli`](#--brotli).

#### `--zopfli-num-iterations <number>`

`gzipper c ./src --zopfli-num-iterations 15`

Maximum amount of times to rerun forward and backward pass to optimize LZ77 compression cost.
Good values: `10`, `15` for small files, `5` for files over several MB in size or it will be too slow.
Only for [`--zopfli`](#--zopfli).

#### `--zopfli-block-splitting`

`gzipper c ./src --zopfli-block-splitting`

If true, splits the data in multiple deflate blocks with optimal choice for the block boundaries.
Block splitting gives better compression. Only for [`--zopfli`](#--zopfli).

#### `--zopfli-block-splitting-max <number>`

`gzipper c ./src --zopfli-block-splitting-max 5`

Maximum amount of blocks to split into.
`0` for unlimited, but this can give extreme results that hurt compression on some files.
Only for [`--zopfli`](#--zopfli).

#### `--zstd-level <number>`

`gzipper c ./src --zstd-level 8`

Zstd compression level: `1` (default), `5` (best compression).
Only for [`--zstd`](#--zstd).

#### `--output-file-format <value>`

Output file format with artifacts, default format: `[filename].[ext].[compressExt]`.
Where: `filename` -> name of your file, `ext` -> file extension,
`compressExt` -> compress extension (.gz, .br, etc), `hash` -> uniq hash.

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
    rabbit.jpg
    rabbit.gz.jpg
    cat.jpg
    cat.gz.jpg
  js
    main.js
    main.gz.js
    modules.js
    modules.gz.js
  xml
    main.xml
    main.gz.xml
  index.js
  index.gz.js
  ```

- `gzipper c ./src --output-file-format test-[filename]-[hash].[compressExt].[ext]`

  ```
  img
    rabbit.jpg
    cat.jpg
    test-rabbit-b4564011-ba7c-4bd6-834d-bf6c7791b7d4.gz.jpg
    test-cat-739c7d7d-53ca-4f8e-912c-bad3b2b515a9.gz.jpg
  js
    main.js
    modules.js
    test-main-4cc35dbd-36f7-4889-9f41-4d93e7a25bef.gz.js
    test-modules-bce90cbd-5bf2-43c2-8b61-33aa1599b704.gz.js
  xml
    main.xml
    test-main-a90fa10e-f7a4-4af9-af67-f887bb96f98b.gz.xml
  index.js
  test-index-067c1e2d-0e12-4b57-980b-97c880c24d57.gz.js
  ```

- `gzipper c ./src --output-file-format [filename]-[hash]-[filename]-tmp.[ext].[compressExt]`

  ```
  img
    rabbit.jpg
    rabbit-b4564011-ba7c-4bd6-834d-bf6c7791b7d4-rabbit-tmp.jpg.gz
    cat.jpg
    cat-739c7d7d-53ca-4f8e-912c-bad3b2b515a9cat-tmp.jpg.gz
  js
    main.js
    main-4cc35dbd-36f7-4889-9f41-4d93e7a25bef-main-tmp.js.gz
    modules.js
    modules-bce90cbd-5bf2-43c2-8b61-33aa1599b704-modules-tmp.js.gz
  xml
    main.xml
    main-a90fa10e-f7a4-4af9-af67-f887bb96f98b-main-tmp.xml.gz
  index.js
  index-067c1e2d-0e12-4b57-980b-97c880c24d57-index-tmp.js.gz
  ```

#### `--remove-larger`

Removes compressed files larger than uncompressed originals in your directory.

#### `--skip-compressed`

Ignores compressed files that have already exist in your directory.
Only with default [`--output-file-format`](#--output-file-format-value).

#### `--workers <number>`

Spawn workers for parallel compression.
Be aware of workers number because every worker creates an additional thread.
More info at [nodesource.com](https://nodesource.com/blog/worker-threads-nodejs/).

#### `--no-color`

Disable logger colorful messages.

### `cache`

| Command           |
| ----------------- |
| [`purge`](#purge) |
| [`size`](#size)   |

#### `purge`

`gzipper cache purge`

Removes all pre-compressed files from `cache` that was generated via [`--incremental`](#--incremental) argument.

#### `size`

`gzipper cache size`

Returns the size of all pre-compiled files from `cache`.

## Changelog

[CHANGELOG.md](./CHANGELOG.md)

## Contribution

I appreciate every contribution, just fork the repository and send the pull request with your changes.

## Support

- Node.js >= 14

## Prerequisites

If you want to use [`--zstd`](#--zstd) compression,
you have to make sure that the appropriate library
is installed and available at your environment:

```sh
where zstd.exe   # Windows
command -v zstd  # MacOS/Linux
```

If you didn't find executable `zstd` you have to install this manually:

* MacOS using Brew

  ```sh
  brew install zstd   # zstd only
  brew install zlib   # whole library
  ```

* Windows Subsystem for Linux (WSL), Ubuntu, Debian... using APT

  ```sh
  sudo apt install zstd
  ```
