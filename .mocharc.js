module.exports = {
  require: ['ts-node/register', 'source-map-support/register'],
  timeout: 20000,
  recursive: true,
  spec: './test/**/*.spec.ts',
  slow: 0,
};
