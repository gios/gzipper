// eslint-disable-next-line @typescript-eslint/no-var-requires
const semver = require("semver");
const exclude = semver.lt(process.version, "v11.7.0")
  ? ["src/compressions/Brotli.ts"]
  : [];

module.exports = {
  all: true,
  include: ["src/**"],
  extension: [".ts"],
  exclude: exclude,
  reporter: ["text-summary"],
  branches: 85,
  lines: 90,
  functions: 90,
  statements: 90,
};
