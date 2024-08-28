const path = require('path');

module.exports = {
  // extends: ['@open-wc/eslint-config', "eslint-config-prettier"],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      plugins: ['@babel/plugin-syntax-import-assertions'],
    },
  },
  rules: {
    // devDependencies
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          path.join(__dirname, '*.*'),
          path.join(__dirname, 'test/**'),
          path.join(__dirname, 'scripts/**'),
          path.join(__dirname, 'dev/**'),
        ],
      },
    ],
  },
};
