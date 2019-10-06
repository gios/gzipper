const config = require('../.eslintrc.js');

module.exports = {
  ...config,
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
