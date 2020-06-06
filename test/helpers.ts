import semver from "semver";
const MIN_BROTLI_VERSION = "v11.7.0";

export const disableBrotli = semver.lt(process.version, MIN_BROTLI_VERSION);
