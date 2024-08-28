import { expect } from 'chai';
import * as td from 'testdouble';
import { createRequire } from 'module';
import k8sClientMock from '../mocks/modules/k8s.client.mock.js';
import nodeFetchMock, { HeadersMock, RequestMock } from '../mocks/modules/nodeFetch.mock.js';
import serviceObjectDomainApp1 from '../mocks/serviceobjects/domain-app1.serviceobject.js';
import serviceObjectDomainApp2 from '../mocks/serviceobjects/domain-app2.serviceobject.js';
import serviceObjectInvalidApp from '../mocks/serviceobjects/invalid.serviceobject.js';
import differentLabelApp1 from '../mocks/serviceobjects/different-label-app1.serviceobject.js';
import differentLabelApp2 from '../mocks/serviceobjects/different-label-app2.serviceobject.js';
import annotationApp from '../mocks/serviceobjects/annotation.serviceobject.js';
import chokidarMock from '../mocks/modules/chokidarMock.js';
import fsMock from '../mocks/modules/fsMock.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import ConfigManagerMock from '../mocks/modules/configManagerMock.js';
import CertificateManagerMock from '../mocks/modules/certificateManagerMock.js';

import Utils from '../Utils.js';
import factory from './factory.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../../config/api-config.json');
const appConfigOrig = require('../mocks/configs/domain-app1.config.json');
let appConfig2 = require('../mocks/configs/domain-app2.config.json');

const { requestDomainService } = Utils;

const appConfig = JSON.parse(JSON.stringify(appConfigOrig));
const PARAMS = {
  k8Client: '@kubernetes/client-node',
  nodeFetch: 'node-fetch',
  ContentType: 'Content-Type',
  chokidar: 'chokidar',
};

const service1 = { service: 'domain1' };
appConfig.apps[0] = Object.assign(appConfig.apps[0], service1);
appConfig.components[0] = Object.assign(appConfig.components[0], service1);

const appConfigAnnotation = JSON.parse(JSON.stringify(appConfigOrig));

const serviceAnnotation = {
  service: 'domain-service-1',
  url: 'http://localhost/context/domain-app-1',
};
const serviceCompAnnotation = { service: 'domain-service-1' };
appConfigAnnotation.apps[0] = Object.assign(appConfigAnnotation.apps[0], serviceAnnotation);
appConfigAnnotation.components[0] = Object.assign(
  appConfigAnnotation.components[0],
  serviceCompAnnotation,
);

const mergedActions = [...appConfig.actions, ...appConfig2.actions];
appConfig2 = JSON.parse(JSON.stringify(appConfig2));

const service2 = { service: 'domain2' };
appConfig2.apps[0] = Object.assign(appConfig2.apps[0], service2);
appConfig2.components[0] = Object.assign(appConfig2.components[0], service2);

const URLS = ['apps', 'components', 'groups', 'actions'];

const responseCheck = (response, contentLength, expectedContent) => {
  const content = response.body;
  expect(content).to.have.lengthOf(contentLength);
  expect(content).to.deep.eq(expectedContent);
};

const responseCheckActions = (response, expectedContent) => {
  const { actions } = response.body;
  expect(actions).to.have.lengthOf(expectedContent.length);
  expect(actions).to.deep.eq(expectedContent);
};

// the first test case's before hook will load app.js and its dependencies
// not all dependencies are mocked, as app.test is also kind of integration test
// the first import of some non-mocked 3pp libs can take up to 5 seconds
// see ADPRS-415 for more details
const INITIAL_LOAD_TIMEOUT = 120_000;

describe('Component tests for app.js', () => {
  const { loadServer, closeServer } = factory();
  let request;

  const loadServerK8sClient = { libName: PARAMS.k8Client, defaultExport: k8sClientMock };
  const loadServerNodeFetch = {
    libName: PARAMS.nodeFetch,
    namedExports: { Headers: HeadersMock, Request: RequestMock },
    defaultExport: nodeFetchMock,
  };
  const loadServerChokidar = { libName: PARAMS.chokidar, defaultExport: chokidarMock };

  describe('Testing state with two valid clients with different labels', () => {
    describe('Testing client with first label', () => {
      // eslint-disable-next-line func-names
      before(async function () {
        this.timeout(INITIAL_LOAD_TIMEOUT);
        const localConfigMock = {
          libName: 'fs',
          namedExports: fsMock({ uiServiceConfig: { k8sLabelValue: 'workspace-gui-1' } }),
        };
        request = await loadServer(
          loadServerK8sClient,
          loadServerNodeFetch,
          loadServerChokidar,
          localConfigMock,
        );
      });

      after(async () => {
        await closeServer();
      });

      URLS.forEach((url) =>
        it(`should return client info for /${url} for workspace-gui-1 label only`, async () => {
          const updatedDifferentLabelApp1 = JSON.parse(JSON.stringify(differentLabelApp1));
          const updatedDifferentLabelApp2 = JSON.parse(JSON.stringify(differentLabelApp2));

          updatedDifferentLabelApp1.metadata.name = 'tcDomainApp1';
          updatedDifferentLabelApp2.metadata.name = 'tcDomainApp2';

          await requestDomainService(updatedDifferentLabelApp1);
          await requestDomainService(updatedDifferentLabelApp2);
          await request
            .get(`${apiConfig.meta.prefix}/${url}`)
            .expect(PARAMS.ContentType, /application\/json/)
            .expect((response) => {
              if (url === 'actions') {
                responseCheckActions(response, appConfig[url]);
              } else {
                responseCheck(response, 1, appConfig[url]);
              }
            });
        }),
      );
    });

    describe('Testing client with second label', () => {
      before(async () => {
        const localConfigMock = {
          libName: 'fs',
          namedExports: fsMock({ uiServiceConfig: { k8sLabelValue: 'workspace-gui-2' } }),
        };

        request = await loadServer(
          loadServerK8sClient,
          loadServerNodeFetch,
          loadServerChokidar,
          localConfigMock,
        );
      });

      after(async () => {
        await closeServer();
      });

      URLS.forEach((url) =>
        it(`should return client info for /${url} for workspace-gui-2 label only`, async () => {
          const updatedDifferentLabelApp1 = JSON.parse(JSON.stringify(differentLabelApp1));
          const updatedDifferentLabelApp2 = JSON.parse(JSON.stringify(differentLabelApp2));

          updatedDifferentLabelApp1.metadata.name = 'tcDomainApp1';
          updatedDifferentLabelApp2.metadata.name = 'tcDomainApp2';

          await requestDomainService(updatedDifferentLabelApp1);
          await requestDomainService(updatedDifferentLabelApp2);
          await request
            .get(`${apiConfig.meta.prefix}/${url}`)
            .expect(PARAMS.ContentType, /application\/json/)
            .expect((response) => {
              if (url === 'actions') {
                responseCheckActions(response, appConfig2[url]);
              } else {
                responseCheck(response, 1, appConfig2[url]);
              }
            });
        }),
      );
    });
  });

  describe('Testing empty state', () => {
    before(async () => {
      request = await loadServer(loadServerK8sClient);
    });

    after(async () => {
      await closeServer();
    });

    URLS.forEach((url) => {
      if (url === 'actions') {
        it(`should return an empty object for /${url}`, (done) => {
          request
            .get(`${apiConfig.meta.prefix}/${url}`)
            .expect(PARAMS.ContentType, /application\/json/)
            .expect((response) => {
              const { actions } = response.body;
              expect(actions).to.have.lengthOf(0);
            })
            .expect(200, done);
        });
      } else {
        it(`should return an empty array for /${url}`, (done) => {
          request
            .get(`${apiConfig.meta.prefix}/${url}`)
            .expect(PARAMS.ContentType, /application\/json/)
            .expect((response) => {
              expect(response.body).to.have.lengthOf(0);
            })
            .expect(200, done);
        });
      }
    });
  });

  describe('Testing state with one valid client', () => {
    before(async () => {
      request = await loadServer(loadServerK8sClient, loadServerNodeFetch);
    });

    after(async () => {
      await closeServer();
    });

    URLS.forEach((url) =>
      it(`should return a single client for /${url}`, async () => {
        await requestDomainService(serviceObjectDomainApp1);
        await request
          .get(`${apiConfig.meta.prefix}/${url}`)
          .expect(PARAMS.ContentType, /application\/json/)
          .expect((response) => {
            if (url === 'actions') {
              responseCheckActions(response, appConfig[url]);
            } else {
              responseCheck(response, 1, appConfig[url]);
            }
          });
      }),
    );
  });

  describe('Testing state with one valid and one invalid client', () => {
    before(async () => {
      request = await loadServer(loadServerK8sClient, loadServerNodeFetch);
    });

    after(async () => {
      await closeServer();
    });

    URLS.forEach((url) =>
      it(`should return the valid client only for /${url}`, async () => {
        await requestDomainService(serviceObjectDomainApp1);
        await requestDomainService(serviceObjectInvalidApp);
        await request
          .get(`${apiConfig.meta.prefix}/${url}`)
          .expect(PARAMS.ContentType, /application\/json/)
          .expect((response) => {
            if (url === 'actions') {
              responseCheckActions(response, appConfig[url]);
            } else {
              responseCheck(response, 1, appConfig[url]);
            }
          });
      }),
    );
  });

  describe('Testing state with two valid clients with the same label', () => {
    before(async () => {
      request = await loadServer(loadServerK8sClient, loadServerNodeFetch);
    });

    after(async () => {
      await closeServer();
    });

    URLS.forEach((url) => {
      it(`should return the merged client info for /${url}`, async () => {
        await requestDomainService(serviceObjectDomainApp1);
        await requestDomainService(serviceObjectDomainApp2);
        await request
          .get(`${apiConfig.meta.prefix}/${url}`)
          .expect(PARAMS.ContentType, /application\/json/)
          .expect((response) => {
            if (url === 'actions') {
              responseCheckActions(response, mergedActions);
            } else {
              responseCheck(response, 2, appConfig[url].concat(appConfig2[url]));
            }
          });
      });
    });
  });

  describe('Testing state with one client with external url prefix annotation', () => {
    before(async () => {
      request = await loadServer(loadServerK8sClient, loadServerNodeFetch);
    });

    after(async () => {
      await closeServer();
    });

    URLS.forEach((url) =>
      it(`should return a single client for /${url}`, async () => {
        await requestDomainService(annotationApp);
        await request
          .get(`${apiConfig.meta.prefix}/${url}`)
          .expect(PARAMS.ContentType, /application\/json/)
          .expect((response) => {
            if (url === 'actions') {
              responseCheckActions(response, appConfigAnnotation[url]);
            } else {
              responseCheck(response, 1, appConfigAnnotation[url]);
            }
          });
      }),
    );
  });

  describe('Refresh endpoint tests', () => {
    let synchronizationService;
    const INVALID_SERVICE_NAME = 'test_service';
    const URL = `${apiConfig.meta.prefix}/services`;
    const CONTENT_TYPE = 'Content-type';
    const CONTENT_VALUE = 'application/json';
    const K8S_LABEL = 'app.kubernetes.io/name';
    const VALID_NAME = annotationApp.metadata.labels[K8S_LABEL];

    before(async () => {
      await td.replaceEsm(PARAMS.k8Client, null, k8sClientMock);
      await td.replaceEsm('lodash', null, {});

      await td.replaceEsm('../../services/logging.js', { ...loggingMock });
      await td.replaceEsm(
        '../../services/сertificateManager.js',
        null,
        new CertificateManagerMock(),
      );
      await td.replaceEsm('../../config/configManager.js', null, new ConfigManagerMock());
      synchronizationService = (await import('../../services/synchronizationService.js')).default;
      td.reset();

      request = await loadServer(loadServerK8sClient, loadServerNodeFetch, {
        libName: '../../services/synchronizationService.js',
        defaultExport: synchronizationService,
      });
    });

    after(async () => {
      await closeServer();
    });

    it(`should return 400 if body required prop is not present`, async () => {
      await requestDomainService(annotationApp);
      await request
        .put(`${URL}/${INVALID_SERVICE_NAME}`)
        .set(CONTENT_TYPE, CONTENT_VALUE)
        .send({ value: INVALID_SERVICE_NAME })
        .expect(400);
    });

    it(`should return 400 if required param is not present`, async () => {
      await requestDomainService(annotationApp);
      await request
        .put(URL)
        .set(CONTENT_TYPE, CONTENT_VALUE)
        .send({ value: INVALID_SERVICE_NAME })
        .expect(400);
    });

    it(`should return 404 for not valid service refresh`, async () => {
      await requestDomainService(annotationApp);
      await request
        .put(`${URL}/${INVALID_SERVICE_NAME}`)
        .set(CONTENT_TYPE, CONTENT_VALUE)
        .send({ name: INVALID_SERVICE_NAME })
        .expect(404);
    });

    it(`should return 400 if param and body value not the same`, async () => {
      await requestDomainService(annotationApp);
      await request
        .put(`${URL}/${INVALID_SERVICE_NAME}`)
        .set(CONTENT_TYPE, CONTENT_VALUE)
        .send({ name: VALID_NAME })
        .expect(400);
    });

    describe('Refresh propagation tests', () => {
      afterEach(() => {
        td.reset();
      });

      it(`should return 202 for valid and available service refresh`, async () => {
        await requestDomainService(annotationApp);
        await request
          .put(`${URL}/${VALID_NAME}`)
          .set(CONTENT_TYPE, CONTENT_VALUE)
          .send({ name: VALID_NAME })
          .expect(202);
      });

      it(`should propagate refresh to other pods`, async () => {
        const _getLocalIPFake = td.replace(synchronizationService, '_getLocalIP');
        const _getClusterIPsFake = td.replace(synchronizationService, '_getClusterIPs');
        td.when(_getLocalIPFake()).thenReturn(['1']);
        td.when(_getClusterIPsFake()).thenReturn(['1', '2', '3', '4']);
        const propagateSpy = td.replace(
          synchronizationService,
          'propagateRefresh',
          synchronizationService.propagateRefresh.bind(synchronizationService),
        );
        const requestSpy = td.replace(synchronizationService, '_sendRequest');

        await requestDomainService(annotationApp);
        await request
          .put(`${URL}/${VALID_NAME}`)
          .set(CONTENT_TYPE, CONTENT_VALUE)
          .send({ name: VALID_NAME })
          .expect(202);
        td.verify(propagateSpy(), { times: 1, ignoreExtraArgs: true });
        td.verify(requestSpy(), { times: 3, ignoreExtraArgs: true });
      });

      it(`returns 500 and error if dns lookup fails`, async () => {
        const ERROR_TEXT = 'TEST_ERROR';

        const _getIPFor = td.replace(synchronizationService, '_getIPFor');
        td.when(_getIPFor(td.matchers.anything())).thenThrow({ name: ERROR_TEXT });

        await requestDomainService(annotationApp);
        await request
          .put(`${URL}/${VALID_NAME}`)
          .set(CONTENT_TYPE, CONTENT_VALUE)
          .send({ name: VALID_NAME })
          .expect(500)
          .expect((response) => {
            expect(response.text).to.be.eq(JSON.stringify({ errors: { name: ERROR_TEXT } }));
          });
      });
    });
  });

  // NOTE this is also ignored in SQ server (setting "won't fix" on UI)
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Allowed request methods tests', () => {
    before(async () => {
      request = await loadServer(loadServerK8sClient);
    });

    after(async () => {
      await closeServer();
    });

    const interfaces = Object.keys(apiConfig).filter((i) => apiConfig[i].routes); // only those with routes
    interfaces.forEach((api) => {
      Object.keys(apiConfig[api].routes).forEach((endpoint) => {
        const allowedMethods = [
          ...['HEAD', 'OPTIONS'],
          ...apiConfig[api].routes[endpoint].allowedDataMethods,
        ];
        const path = apiConfig[api].prefix + apiConfig[api].routes[endpoint].path;

        it(`${path} should return 405 for not allowed methods`, async () => {
          if (!allowedMethods.includes('GET')) {
            await request.get(path).expect(405);
          }
          if (!allowedMethods.includes('POST')) {
            await request.post(path).expect(405);
          }
          if (!allowedMethods.includes('DELETE')) {
            await request.delete(path).expect(405);
          }
          if (!allowedMethods.includes('PUT')) {
            await request.put(path).expect(405);
          }
          if (!allowedMethods.includes('PATCH')) {
            await request.patch(path).expect(405);
          }
          if (!allowedMethods.includes('TRACE')) {
            await request.trace(path).expect(405);
          }
        });

        // skipping /userpermission (endpoint is disabled) and /static (requires postfix to path)
        if (!path.includes('permission') && !path.includes('static')) {
          it(`${path} should return 200 for HEAD if GET is allowed`, async () => {
            if (allowedMethods.includes('GET')) {
              await request.head(path).expect(200);
            }
          });
        }

        it(`${path} should return allowed methods in Allow header for OPTIONS request`, async () => {
          await request.options(path).expect((response) => {
            expect(response.headers.allow).to.be.eq(allowedMethods.join(', '));
          });
        });
      });
    });
  });
});
