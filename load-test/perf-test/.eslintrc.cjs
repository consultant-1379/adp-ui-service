module.exports = {
  globals: {
    it: true,
    describe: true,
  },
  rules: {
    // devDependencies
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
  },
};
