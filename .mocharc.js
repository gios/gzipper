module.exports = {
  require: ['ts-node/register', 'source-map-support/register'],
  timeout: 10000,
  recursive: true,
  spec: './test/**/*.spec.ts',
};
