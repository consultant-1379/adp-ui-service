import { expect } from 'chai';
import * as td from 'testdouble';
import { createRequire } from 'module';
import k8sClientMock from '../mocks/modules/k8s.client.mock.js';
import nodeFetchMock, { HeadersMock, RequestMock } from '../mocks/modules/nodeFetch.mock.js';
import chokidarMock from '../mocks/modules/chokidarMock.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import fsMock from '../mocks/modules/fsMock.js';
import factory from './factory.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../../config/api-config.json');

const DUMMY_REQUEST = {
  body: {
    timestamp: '2021-02-09T09:00:00.000Z',
    uniqueLogId: 'GAS-logging-testing-sequence',
    message: 'Test message',
    category: 'Test category',
    severity: 'info',
  },
};
const USER_NAME = 'lorem-user';

const { loadServer, closeServer } = factory();
// Returns a promise (call it with await)
const customLoadServer = ({ isAuthorized = false, loggerMock = loggingMock } = {}) => {
  const authMock = {
    getCookieParserMiddleware: () => (req, res, next) => {
      if (isAuthorized) {
        req._authCookie = { userName: USER_NAME };
      }
      return next();
    },
    parseSingleCookieByName: () => {},
  };
  const localConfigMock = {
    libName: 'fs',
    namedExports: fsMock({ uiServiceConfig: { k8sLabelValue: 'workspace-gui-1' } }),
  };

  return loadServer(
    { libName: '@kubernetes/client-node', defaultExport: k8sClientMock },
    {
      libName: 'node-fetch',
      namedExports: { Headers: HeadersMock, Request: RequestMock },
      defaultExport: nodeFetchMock,
    },
    { libName: 'chokidar', defaultExport: chokidarMock },
    localConfigMock,
    { libName: '@adp/auth', namedExports: authMock },
    { libName: '../../services/logging.js', namedExports: loggerMock },
  );
};

describe('Component tests for ui-logging API', () => {
  describe('Basic tests', () => {
    let request;

    beforeEach(async () => {
      request = await customLoadServer();
    });

    afterEach(async () => {
      await closeServer();
    });

    it('sends HTTP 200 for good body', async () => {
      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send(DUMMY_REQUEST.body)
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('sends HTTP 400 for missing message and have 1 errors', async () => {
      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send({
          severity: DUMMY_REQUEST.body.severity,
          timestamp: DUMMY_REQUEST.body.timestamp,
        })
        .expect(400)
        .expect((response) => {
          expect(response.body.errors).to.have.lengthOf(1);
        });
    });

    it('sends HTTP 400 for bad severity value', async () => {
      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send({
          severity: DUMMY_REQUEST.body.category, // Bad severity
          timestamp: DUMMY_REQUEST.body.timestamp,
          message: DUMMY_REQUEST.body.message,
        })
        .expect(400)
        .expect((response) => {
          expect(response.body.errors).to.have.lengthOf(1);
        });
    });

    it('sends HTTP 400 for bad timestamp', async () => {
      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send({
          severity: DUMMY_REQUEST.body.severity,
          timestamp: 'WRONG TIMESTAMP',
          message: DUMMY_REQUEST.body.message,
        })
        .expect(400)
        .expect((response) => {
          expect(response.body.errors).to.have.lengthOf(1);
        });
    });

    it('sends HTTP 400 for empty body and have 3 errors', async () => {
      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send({})
        .expect(400)
        .expect((response) => {
          expect(response.body.errors).to.have.lengthOf(3);
        });
    });
  });

  describe('Check sending "extraInfo" to the logs', () => {
    const mockedLog = td.func();
    const getLoggerMock = () => ({
      log: mockedLog,
      info: () => null,
      debug: () => null,
      error: () => null,
      warning: () => null,
    });

    afterEach(async () => {
      await closeServer();
    });

    it('got an empty "extraInfo" when user wasn\'t authorized', async () => {
      const request = await customLoadServer({
        loggerMock: {
          ...loggingMock,
          getLogger: getLoggerMock,
        },
      });

      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send(DUMMY_REQUEST.body)
        .expect(200);
      td.verify(mockedLog(td.matchers.contains({ extraInfo: null })), { times: 1 });
    });

    it('got an "extraInfo" when user has been authorized', async () => {
      const request = await customLoadServer({
        loggerMock: {
          ...loggingMock,
          getLogger: getLoggerMock,
        },
        isAuthorized: true,
      });

      await request
        .post(`${apiConfig.logging.prefix}${apiConfig.logging.routes.logs.path}`)
        .send(DUMMY_REQUEST.body)
        .expect(200);
      td.verify(mockedLog(td.matchers.contains({ extraInfo: { username: USER_NAME } })), {
        times: 1,
      });
    });
  });
});
