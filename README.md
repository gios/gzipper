# Gzipper

[![Build Status](https://travis-ci.org/gios/gzipper.svg?branch=master)](https://travis-ci.org/gios/gzipper)
[![npm version](https://badge.fury.io/js/gzipper.svg)](https://badge.fury.io/js/gzipper)
[![codecov](https://codecov.io/gh/gios/gzipper/branch/master/graph/badge.svg)](https://codecov.io/gh/gios/gzipper)

CLI for compressing files using the popular compress algorithms like Brotli and Gzip. Also this module works great with many CLI UI tools (Angular CLI, Vue CLI, create-react-app) and supports few option flags for each algorithm.

There are a couple of options flags such as `gzip-level`, `gzip-strategy`, `gzip-memory-level`, `brotli-param-mode`, `brotli-quality`, `brotli-size-hint` for extending algorithm flexibility. All flags can be declared via ENV variables (ENV variables have higher priority over CLI arguments).

You can enable `verbose` mode for better visual representation which files were compressed and how long it took. Also you can customize your file output using `output-file-format` command with predefined template `[filename]-[hash]-[filename].[ext]`.

- [Gzipper](#gzipper)
  - [Install](#install)
  - [Run as CLI](#run-as-cli)
  - [Run as module](#run-as-module)
  - [Options](#options)
    - [Option Examples](#option-examples)
      - [output-file-format](#output-file-format)
  - [Contribution](#contribution)
  - [Requirements](#requirements)

## Install

`npm i gzipper -g`

or locally to devDependencies

`npm i gzipper -D`

## Run as CLI

Globally usage.

`gzipper [options] <path> [outputPath]`

Locally usage.

- add to scripts in your package.json

```
  "scripts": {
    ...
    "gzipper": "gzipper"
  }
```

- or use with `npx` command if module was installed to dependencies or devDependencies

```
  "scripts": {
    "compress": "npx gzipper --verbose ./dist"
  }
```

- use gzipper with your build commands (e.g. Angular CLI)

```
  "scripts": {
    "build": "ng build && gzipper --verbose ./dist"
  }
```

- compress files to a certain directory `./gzipped` (folders structure inside `dist` will be saved)

```
  "scripts": {
    "build": "ng build && gzipper --verbose ./dist ./gzipped"
  }
```

- even compress files to a very deep folder `./very/deep/folder` (all folders will be automatically created if not exist)

```
  "scripts": {
    "build": "ng build && gzipper --verbose ./dist ./very/deep/folder"
  }
```

- compress a single file

```
  "scripts": {
    "build": "ng build && gzipper --verbose ./dist/awesomeness.txt"
  }
```

## Run as module

```javascript
const { Gzipper } = require('gzipper');
const gzipper = new Gzipper(target, outputPath, options?);
await gzipper.compress();
```

## Options

| Option                                                         | ENV                                                               | Description                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-V, --version`                                                |                                                                   | output the version number                                                                                                                                                                                                                                                    |
| `-v, --verbose`                                                | `GZIPPER_VERBOSE` (0 or 1)                                        | detailed level of logs                                                                                                                                                                                                                                                       |
| `-e, --exclude <extensions>`                                   | `GZIPPER_EXCLUDE`                                                 | exclude file extensions from compression, example: jpeg,jpg...                                                                                                                                                                                                               |
| `-i, --include <extensions>`                                   | `GZIPPER_INCLUDE`                                                 | include file extensions for compression, example: js,css,html...                                                                                                                                                                                                             |
| `-t, --threshold <number>`                                     | `GZIPPER_THRESHOLD`                                               | exclude assets smaller than this byte size. 0 (default)                                                                                                                                                                                                                      |
| `--gzip-level <number>`(deprecated) or `--level`               | `GZIPPER_GZIP_LEVEL`(deprecated) or `GZIPPER_LEVEL`               | compression level 6 (default), 0 (no compression) - 9 (best compression)                                                                                                                                                                                                     |
| `--gzip-memory-level <number>`(deprecated) or `--memory-level` | `GZIPPER_GZIP_MEMORY_LEVEL`(deprecated) or `GZIPPER_MEMORY_LEVEL` | amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory)                                                                                                                                                                |
| `--gzip-strategy <number>`(deprecated) or `--strategy`         | `GZIPPER_GZIP_STRATEGY`(deprecated) or `GZIPPER_STRATEGY`         | compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)                                                                                                                                                                                         |
| `--deflate`                                                    | `GZIPPER_DEFLATE` (0 or 1)                                        | enable deflate compression                                                                                                                                                                                                                                                   |
| `--brotli`                                                     | `GZIPPER_BROTLI` (0 or 1)                                         | enable brotli compression, Node.js >= v11.7.0                                                                                                                                                                                                                                |
| `--brotli-param-mode <value>`                                  | `GZIPPER_BROTLI_PARAM_MODE`                                       | default, text (for UTF-8 text), font (for WOFF 2.0 fonts), only for `--brotli`                                                                                                                                                                                               |
| `--brotli-quality <number>`                                    | `GZIPPER_BROTLI_QUALITY`                                          | brotli compression quality 11 (default), 0 - 11, only for `--brotli`                                                                                                                                                                                                         |
| `--brotli-size-hint <number>`                                  | `GZIPPER_BROTLI_SIZE_HINT`                                        | expected input size 0 (default), only for `--brotli`                                                                                                                                                                                                                         |
| `--output-file-format <value>`                                 | `GZIPPER_OUTPUT_FILE_FORMAT`                                      | output file format with artifacts, default format: `[filename].[ext].[compressExt]`. Where: `filename` -> name of your file, `ext` -> file extension, `compressExt` -> compress extension (.gz, .br, etc), `hash` -> uniq uuid/v4 hash. [More examples](#output-file-format) |
| `-h, --help`                                                   |                                                                   | output usage information                                                                                                                                                                                                                                                     |

> ENV Variables have higher priority over CLI arguments.

### Option Examples

#### output-file-format

Example of folder structure:

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

- `--output-file-format [filename].[compressExt].[ext]`

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

- `--output-file-format test-[filename]-[hash].[compressExt].[ext]`

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

- `--output-file-format [filename]-[hash]-[filename]-tmp.[ext].[compressExt]`

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

## Contribution

I appreciate every contribution, just fork the repository and send the pull request with your changes.

## Requirements

- Node.js >= 10
