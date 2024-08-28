import nock from 'nock';
import { createRequire } from 'module';
import k8sClientMock from '../mocks/modules/k8s.client.mock.js';
import nodeFetchMock, { HeadersMock, RequestMock } from '../mocks/modules/nodeFetch.mock.js';
import chokidarMock from '../mocks/modules/chokidarMock.js';
import fsMock from '../mocks/modules/fsMock.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import serviceObjectDomainApp1 from '../mocks/serviceobjects/domain-app1.serviceobject.js';
import Utils from '../Utils.js';
import factory from './factory.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../../config/api-config.json');
const domain1Config = require('../mocks/configs/domain-app1.config.json');

const { requestDomainService } = Utils;

const checkEndpoint = async (request, endpoint, httpCode) =>
  request
    .get(`${apiConfig.serve.prefix}${endpoint}`)
    .set('Accept', 'application/json')
    .expect(httpCode);

describe('Component tests for ui-serve API', () => {
  const { loadServer, closeServer } = factory();

  let request;

  beforeEach(async () => {
    const localConfigMock = {
      libName: 'fs',
      namedExports: fsMock({ uiServiceConfig: { k8sLabelValue: 'workspace-gui' } }),
    };

    request = await loadServer(
      { libName: '@kubernetes/client-node', defaultExport: k8sClientMock },
      {
        libName: 'node-fetch',
        namedExports: { Headers: HeadersMock, Request: RequestMock },
        defaultExport: nodeFetchMock,
      },
      { libName: 'chokidar', defaultExport: chokidarMock },
      { libName: '../../services/logging.js', namedExports: loggingMock },
      localConfigMock,
    );
  });

  afterEach(async () => {
    await closeServer();
  });

  it('sends HTTP 200 for list-packages endpoint', async () => {
    await checkEndpoint(request, apiConfig.serve.routes.packages.path, 200);
  });

  it('sends HTTP 200 for import-map endpoint', async () => {
    await checkEndpoint(request, apiConfig.serve.routes.importMap.path, 200);
  });

  describe('Static Serve endpoint', () => {
    beforeEach(() => {
      nock('https://domain1:4000').get('/config.json').reply(200, domain1Config);
    });
    afterEach(() => {
      nock.cleanAll();
    });

    it('returns 400 "Bad Request" for invalid url', async () => {
      await requestDomainService(serviceObjectDomainApp1);
      await checkEndpoint(request, `${apiConfig.serve.routes.static.path}/asdf`, 400);
    });

    it('returns 400 if filepath is missing', async () => {
      await requestDomainService(serviceObjectDomainApp1);
      await checkEndpoint(request, `${apiConfig.serve.routes.static.path}/domain1-1.0.0/`, 400);
    });

    it('returns 404 if service is not known', async () => {
      await requestDomainService(serviceObjectDomainApp1);
      await checkEndpoint(request, `${apiConfig.serve.routes.static.path}/domain2/file.png`, 404);
    });

    it('returns 200 if service and file is found', async () => {
      await requestDomainService(serviceObjectDomainApp1);
      await checkEndpoint(
        request,
        `${apiConfig.serve.routes.static.path}/domain1-1.0.0/config.json`,
        200,
      );
    });
  });
});
