import { expect } from 'chai';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import ConfigManagerMock from '../mocks/modules/configManagerMock.js';

const LOCAL_CONTEXT = 'http://localhost/context';
const SERVICE_URL = 'domain1:4000';

const SERVICE = {
  name: 'domain1',
  uid: 'domain-service-1-1.0.2-2',
  serviceurl: SERVICE_URL,
  ingressBaseurl: LOCAL_CONTEXT,
  protocol: 'http',
  uiContentConfigContext: '/',
};

const SERVICE_WITH_UI_CONTEXT = {
  name: 'domain1',
  uid: 'domain-service-1-1.0.2-2-2',
  serviceurl: SERVICE_URL,
  ingressBaseurl: LOCAL_CONTEXT,
  protocol: 'http',
  uiContentConfigContext: 'uiContext',
};

const SERVICE_UPDATE = {
  name: 'domain1',
  uid: 'domain-service-1-3.0.2-2',
  serviceurl: SERVICE_URL,
  ingressBaseurl: LOCAL_CONTEXT,
  protocol: 'http',
};

const SERVICE_WITHOUT_PROTOCOL = {
  name: 'domain1',
  uid: 'domain-service-1-1.0.2-2',
  serviceurl: SERVICE_URL,
  ingressBaseurl: LOCAL_CONTEXT,
};

const uiServiceCollectionMock = {
  on: () => undefined,
};

const certificateManagerMock = {
  getTLSOptions: () => ({ tlsAgent: true }),
  on: () => true,
};

const httpProxyMiddlewareMock = {
  createProxyMiddleware: () => () => undefined,
};

const mockModules = async () => {
  await td.replaceEsm('http-proxy-middleware', httpProxyMiddlewareMock);
  await td.replaceEsm('../../services/uiServiceCollection.js', null, uiServiceCollectionMock);
  await td.replaceEsm('../../services/certificateManager.js', null, certificateManagerMock);
  await td.replaceEsm('../../services/logging.js', { ...loggingMock });
  await td.replaceEsm('../../config/configManager.js', null, new ConfigManagerMock());
  const proxyService = (await import('../../services/proxyService.js')).default;
  td.reset();
  return proxyService;
};

describe('Unit tests for ProxyService', () => {
  describe('Stores active services', () => {
    let proxyService;
    before(async () => {
      proxyService = await mockModules();
    });

    it('has empty serviceMap at startup', () => {
      expect(proxyService.serviceMap).to.be.deep.eq({});
    });

    it('can add service with protocol info', async () => {
      await proxyService.addService(SERVICE);
      expect(proxyService.serviceMap).to.include.key(SERVICE.uid);
      expect(proxyService.serviceMap[SERVICE.uid].uiContentConfigContext).to.be.eq('/');
    });

    it('does not add services without protocol', async () => {
      await proxyService.addService(SERVICE_WITHOUT_PROTOCOL);
      expect(proxyService.serviceMap).to.not.have.key(SERVICE_WITHOUT_PROTOCOL.uid);
    });

    it('can add service with ui context', async () => {
      await proxyService.addService(SERVICE_WITH_UI_CONTEXT);
      expect(proxyService.serviceMap).to.include.key(SERVICE_WITH_UI_CONTEXT.uid);
      expect(proxyService.serviceMap[SERVICE_WITH_UI_CONTEXT.uid].uiContentConfigContext).to.be.eq(
        SERVICE_WITH_UI_CONTEXT.uiContentConfigContext,
      );
    });

    it('can replace a modified service with new uid', async () => {
      await proxyService.addService(SERVICE_UPDATE);
      expect(proxyService.serviceMap).to.not.have.key(SERVICE.uid);
      expect(proxyService.serviceMap).to.include.key(SERVICE_UPDATE.uid);
    });

    it('can delete a service', () => {
      proxyService.deleteService(SERVICE_UPDATE);
      expect(proxyService.serviceMap).to.not.have.key(SERVICE.uid);
      expect(proxyService.serviceMap).to.not.have.key(SERVICE_UPDATE.uid);
      expect(proxyService.serviceMap).to.be.deep.eq({});
    });
  });

  describe('Middlewares', () => {
    const INVALID_ERROR = 400;
    const MISSING_ERROR = 404;

    describe('checkURL middleware', () => {
      let proxyService;
      let responseStub;
      before(async () => {
        proxyService = await mockModules();
        responseStub = td.object(['status', 'json']);
      });

      beforeEach(() => {
        td.when(responseStub.status(td.matchers.anything())).thenReturn(responseStub);
        td.when(responseStub.json(td.matchers.anything())).thenReturn(responseStub);
      });

      afterEach(() => {
        td.reset();
      });

      const SERVICE_FOR_REQUEST = {
        name: 'domain1',
        uid: 'domain1-uid',
        serviceurl: SERVICE_URL,
        protocol: 'http',
      };

      const apiBase = 'apiBase';

      it('calls next() on success and appends info on request', () => {
        const nextSpy = td.func();
        const request = {
          baseUrl: apiBase,
          path: `${apiBase}/domain1-uid/p1/p2/file.png`,
        };
        proxyService.addService(SERVICE_FOR_REQUEST);
        proxyService.checkURL(request, responseStub, nextSpy);
        td.verify(nextSpy(), { times: 1 });
        expect(request).to.include.key('proxy');
      });

      it('returns error if URL not valid', () => {
        const nextSpy = td.func();
        const request = {
          baseUrl: apiBase,
          path: `${apiBase}/NOT-VALID`,
        };
        proxyService.checkURL(request, responseStub, nextSpy);
        td.verify(nextSpy(), { times: 0 });
        expect(request).to.not.include.key('proxy');
        td.verify(responseStub.status(INVALID_ERROR), { times: 1 });
      });

      it('returns error if service is not found', () => {
        const nextSpy = td.func();
        const request = {
          baseUrl: apiBase,
          path: `${apiBase}/non-installed-service/p1/p2/file.png`,
        };
        proxyService.checkURL(request, responseStub, nextSpy);
        td.verify(nextSpy(), { times: 0 });
        expect(request).to.not.include.key('proxy');
        td.verify(responseStub.status(MISSING_ERROR), { times: 1 });
      });

      it('returns error if filepath is not defined', () => {
        const nextSpy = td.func();
        const request = {
          baseUrl: apiBase,
          path: `${apiBase}/domain1-uid/`,
        };
        proxyService.addService(SERVICE_FOR_REQUEST);
        proxyService.checkURL(request, responseStub, nextSpy);
        td.verify(nextSpy(), { times: 0 });
        expect(request).to.not.include.key('proxy');
        td.verify(responseStub.status(INVALID_ERROR), { times: 1 });
      });
    });
  });
});
