import * as loggingMock from './logging.mock.js';

const logger = {
  configureLogger: () => null,
  LOG_LEVELS: loggingMock.LOG_LEVELS,
  getLogger: loggingMock.getLogger,
};

export { logger };
