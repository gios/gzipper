module.exports = {
  require: ['ts-node/register', 'source-map-support/register'],
  timeout: 5000,
  recursive: true,
  // spec: './test/**/*.spec.ts',
  spec: './test/CLI/compress/CLI.spec.ts',
};
