const semver = require('semver')
const MIN_BROTLI_VERSION = 'v11.7.0'

exports.disableBrotli = semver.lt(process.version, MIN_BROTLI_VERSION)
