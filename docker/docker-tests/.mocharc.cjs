module.exports = {
  timeout: 300000,
  // exit: true, // don't use it, instead fix tests to stop background processes
  recursive: true,
  colors: true,
  spec: ['tests/**/*'],
};
