# gzipper

CLI for compressing files.

## How to use:

### Install globally the package.

`npm i gzipper -g`

or locally to devDependencies

`npm i gzipper -D`

### Run script from global scope or from your package.json as a script;

Globally usage.

`gzipper [options] <path> [outputPath]`

Locally usage.

- add to scripts property in your package.json

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

### Options:

- `-V, --version` output the version number
- `-v, --verbose` detailed level of logs
- `-gl, --gzip-level` gzip compression level 0 (no compression) - 9 (best compression)
- `-gm, --gzip-memory-level` amount of memory which will be allocated for compression 1 (minimum memory) - 9 (maximum memory)
- `-gs, --gzip-strategy` compression strategy 1 (filtered) - 2 (huffman only) - 3 (RLE) - 4 (fixed)
- `--brotli` enable brotli compression
- `-bp, --brotli-param-mode` default, text (for UTF-8 text), font (for WOFF 2.0 fonts)
- `-bq, --brotli-quality` brotli compression quality 11 (default), 0 - 11
- `-bs, --brotli-size-hint` expected input size 0 (default)
- `-h, --help` output usage information

### Contribution

I appreciate every contribution, just fork the repository and send the pull request with your changes.

### Requirements

- Node.js >= 8
