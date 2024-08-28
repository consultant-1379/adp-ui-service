import sinon from 'sinon';
import logger from '../../../../src/utils/logger.js';
import rest from '../../../../src/utils/rest.js';
import configManager from '../../../../src/config/configManager.js';

const LOG_LEVELS = [
  {
    name: 'critical',
    order: 0,
    func: (message) => logger.critical(message),
  },
  {
    name: 'error',
    order: 1,
    func: (message) => logger.error(message),
  },
  {
    name: 'warning',
    order: 2,
    func: (message) => logger.warning(message),
  },
  {
    name: 'info',
    order: 3,
    func: (message) => logger.info(message),
  },
  {
    name: 'debug',
    order: 4,
    func: (message) => logger.debug(message),
  },
];

describe('Unit test for logger module', () => {
  const MESSAGE = 'Message from GUI side';
  const APPLICATION_NAME = 'launcher-gui';
  const DEFAULT_CATEGORY = 'GAS';
  const DEFAULT_UNIQUE_LOG_ID = '';
  let mockRest;
  let configManagerStub;

  describe('can only send log messages with higher severity then the configured logLevel, with the proper function', () => {
    beforeEach(() => {
      mockRest = sinon.mock(rest);
      configManagerStub = sinon.stub(configManager, 'getLogLevel');
    });

    afterEach(() => {
      mockRest.restore();
      configManagerStub.restore();
    });

    LOG_LEVELS.forEach((logLevel) => {
      LOG_LEVELS.forEach((severity) => {
        it(`Trying to send an '${severity.name}' severity log message with log level set to '${logLevel.name}`, () => {
          configManagerStub.returns(logLevel.name);
          if (severity.order < logLevel.order) {
            mockRest.expects('sendLogEvent').withArgs({
              applicationName: APPLICATION_NAME,
              severity: severity.name,
              message: MESSAGE,
              category: DEFAULT_CATEGORY,
              timestamp: sinon.match.string,
              uniqueLogId: DEFAULT_UNIQUE_LOG_ID,
            });
          }
          severity.func(MESSAGE);
          mockRest.verify();
        });
      });
    });
  });
});
