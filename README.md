# Gzipper
[![Build Status](https://travis-ci.org/gios/gzipper.svg?branch=master)](https://travis-ci.org/gios/gzipper)

CLI for compressing files.
- [Gzipper](#gzipper)
  - [Install](#install)
  - [Run script](#run-script)
  - [Options](#options)
  - [Contribution](#contribution)
  - [Requirements](#requirements)

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

| Option                                       | ENV                         | Description                                                                                                   |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `-V, --version`                              |                             | output the version number                                                                                     |
| `-v, --verbose`                              | `GZIPPER_VERBOSE`           | detailed level of logs                                                                                        |
| `-gl, --gzip-level [level]`                  | `GZIPPER_GZIP_LEVEL`        | gzip compression level -1 (default), 0 (no compression) - 9 (best compression)                                |
| `-gm, --gzip-memory-level [memoryLevel]`     | `GZIPPER_GZIP_MEMORY_LEVEL` | amount of memory which will be allocated for compression 8 (default), 1 (minimum memory) - 9 (maximum memory) |
| `-gs, --gzip-strategy [strategy]`            | `GZIPPER_GZIP_STRATEGY`     | compression strategy 0 (default), 1 (filtered), 2 (huffman only), 3 (RLE), 4 (fixed)                          |
| `--brotli`                                   | `GZIPPER_BROTLI`            | enable brotli compression, Node.js >= v11.7.0                                                                 |
| `-bp, --brotli-param-mode [brotliParamMode]` | `GZIPPER_BROTLI_PARAM_MODE` | default, text (for UTF-8 text), font (for WOFF 2.0 fonts)                                                     |
| `-bq, --brotli-quality [brotliQuality]`      | `GZIPPER_BROTLI_QUALITY`    | brotli compression quality 11 (default), 0 - 11                                                               |
| `-bs, --brotli-size-hint [brotliSizeHint]`   | `GZIPPER_BROTLI_SIZE_HINT`  | expected input size 0 (default)                                                                               |
| `-h, --help`                                 |                             | output usage information                                                                                      |

## Contribution

I appreciate every contribution, just fork the repository and send the pull request with your changes.

## Requirements

- Node.js >= 8
