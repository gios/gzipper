# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.2.0] - 2022-10-28

### Added

- `--no-color` - disable logger colorful messages

## [7.0.2] - 2021-03-28

### Updated

- `README.md`

## [7.0.1] - 2021-03-28

### Updated

- `README.md`

## [7.0.0] - 2021-01-16

### Added

- `@gfx/zopfli` instead of `node-zopfli`.
### Removed

- removed  `--zopfli-block-splitting-last` options from `zopfli`.

## [6.2.1] - 2021-12-30

### Bugfix

- removed required `zstd` library for other compressions.

## [6.2.0] - 2021-12-28

### Added

- `zstd` compression.

## [6.1.0] - 2021-12-27

### Added

- `zopfli` compression.
- `jest` for tests.

## [6.0.0] - 2021-11-10

### Added

- Multiple compression.

## [5.0.1] - 2021-09-15

### Fixed

- Correct error handling inside workers.

## [5.0.0] - 2021-06-21

### Removed

- Support for Node.js versions < 12.
- Beta flag for `--incremental` compression.

### Added

- parallel execution with `--workers` option.

## [4.5.0] - 2021-04-19

### Updated

- Updated `commander` to 7.2.0
- `devDependencies` updates

## [4.4.0] - 2021-01-29

### Added

- `--skip-compressed` - skip compressed files if they already exist

### Changed

- compression extensions like `gz`, `zz`, `br`, etc. excluded by default

## [4.3.0] - 2020-10-30

### Added

- `--remove-larger` - remove compressed files if they larger than uncompressed originals

## [4.2.0] - 2020-10-30

### Updated

- commander 5.1.0 -> 6.2.0

## [4.1.0] - 2020-10-20

### Updated

- uuid 8.3.0 -> 8.3.1
- deep-equal 2.0.3 -> 2.0.4
- other dev packages

## [4.0.2] - 2020-08-18

### Updated

- uuid 8.1.0 -> 8.3.0
- typescript 3.9.5 -> 3.9.7
- eslint ecmaVersion 2020

## [4.0.1] - 2020-07-18

### Updated

- Bump lodash from 4.17.14 to 4.17.19

## [4.0.0] - 2020-07-02

### Added

- `--incremental` compression

### Changed

- commander `5.1.0`
- uuid `8.0.0`

### Removed

- GZIPPER_GZIP_LEVEL, gzipLevel
- GZIPPER_GZIP_MEMORY_LEVEL, gzipMemoryLevel
- GZIPPER_GZIP_STRATEGY, gzipStrategy

## [3.7.0] - 2020-04-12

### Changed

- By default, gzipper compress all the files in the directory.
