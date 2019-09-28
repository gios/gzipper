// const { disableBrotli } = require('./helpers')
// const exclude = disableBrotli ? ['src/compressions/Brotli.js'] : []

module.exports = {
  all: true,
  include: ['src/**'],
  extension: ['.ts'],
  // exclude: exclude,
  reporter: ['text-summary'],
  branches: 85,
  lines: 90,
  functions: 90,
  statements: 90,
};
