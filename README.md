# Gzipper
[![Build Status](https://travis-ci.org/gios/gzipper.svg?branch=master)](https://travis-ci.org/gios/gzipper)
[![npm version](https://badge.fury.io/js/gzipper.svg)](https://badge.fury.io/js/gzipper)
[![codecov](https://codecov.io/gh/gios/gzipper/branch/master/graph/badge.svg)](https://codecov.io/gh/gios/gzipper)
[![Maintainability](https://api.codeclimate.com/v1/badges/e1336defedcb61e5b513/maintainability)](https://codeclimate.com/github/gios/gzipper/maintainability)

CLI for compressing files using the popular compress algorithms like Brotli and Gzip. Also this module works great with many CLI UI tools (Angular CLI, Vue CLI, create-react-app) and supports few option flags for each algorithm.

There are a couple of options flags such as `gzip-level`, `gzip-strategy`, `gzip-memory-level`, `brotli-param-mode`, `brotli-quality`, `brotli-size-hint` for extending algorithm flexibility. You can enable `verbose` mode for better visual representation which files were compressed and how long it took. Also you can customize your file response output using `output-file-format` command with predefined template `[filename]-[hash]-[filename].[ext]`.

- [Gzipper](#Gzipper)
  - [Install](#Install)
  - [Run script](#Run-script)
  - [Options](#Options)
  - [Contribution](#Contribution)
  - [Requirements](#Requirements)

## Install

`npm i gzipper -g`

or locally to devDependencies

`npm i gzipper -D`

## Run script

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

- compress files to a certain directory `./gzipped`

```
  "scripts": {
    "build": "ng build && gzipper --verbose ./dist ./gzipped"
  }
```

## Options

| Option                                       | ENV                          | Description                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-V, --version`                              |                              | output the version number                                                                                                                                                                                                                                                                                                                                      |
| `-v, --verbose`                              | `GZIPPER_VERBOSE`            | detailed level of logs                                                                                                                                                                                                                                                                                                                                         |
| `-e, --exclude`                              | `GZIPPER_EXCLUDE`            | exclude file extensions from compression                                                                                                                                                                                                                                                                                                                       |
| `-i, --include`                              | `GZIPPER_INCLUDE`            | include file extensions for compression                                                                                                                                                                                                                                                                                                                        |
| `-gl, --gzip-level [level]`                  | `GZIPPER_GZIP_LEVEL`         | gzip compression level -1 (default), 0 (no compression) - 9 (best compression)                                                                                                                                                                                                                                                                                 |
| `-gm, --gzip-memory-level [memoryLevel]`     | `GZIPPER_GZIP_MEMORY_LEVEL`  | amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory)                                                                                                                                                                                                                                                  |
| `-gs, --gzip-strategy [strategy]`            | `GZIPPER_GZIP_STRATEGY`      | compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)                                                                                                                                                                                                                                                                           |
| `--brotli`                                   | `GZIPPER_BROTLI`             | enable brotli compression, Node.js >= v11.7.0                                                                                                                                                                                                                                                                                                                  |
| `-bp, --brotli-param-mode [brotliParamMode]` | `GZIPPER_BROTLI_PARAM_MODE`  | default, text (for UTF-8 text), font (for WOFF 2.0 fonts)                                                                                                                                                                                                                                                                                                      |
| `-bq, --brotli-quality [brotliQuality]`      | `GZIPPER_BROTLI_QUALITY`     | brotli compression quality 11 (default), 0 - 11                                                                                                                                                                                                                                                                                                                |
| `-bs, --brotli-size-hint [brotliSizeHint]`   | `GZIPPER_BROTLI_SIZE_HINT`   | expected input size 0 (default)                                                                                                                                                                                                                                                                                                                                |
| `--output-file-format [outputFileFormat]`    | `GZIPPER_OUTPUT_FILE_FORMAT` | output file format with default artifacts [filename].[ext].[compressExt], where: filename -> name of your file, ext -> file extension, compressExt -> compress extension (.gz, .br, etc), hash -> uniq uuid/v4 hash. Samples: [filename].[compressExt].[ext], test-[filename]-[hash].[compressExt].[ext], [filename]-[hash]-[filename]-tmp.[ext].[compressExt] |
| `-h, --help`                                 |                              | output usage information                                                                                                                                                                                                                                                                                                                                       |

> ENV Variables have higher priority over CLI arguments.

## Contribution

I appreciate every contribution, just fork the repository and send the pull request with your changes.

## Requirements

- Node.js >= 8
