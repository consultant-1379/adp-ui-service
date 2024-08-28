import defaultLoader from './defaultLoader.js';

// This module invokes the different loaders of the application.
const load = (app) => {
  defaultLoader(app);
};
export { load };
