import { expect } from 'chai';
import { createRequire } from 'module';
import factory from './factory.js';
import fsMock from '../mocks/modules/fsMock.js';
import k8sClientMock from '../mocks/modules/k8s.client.mock.js';
import nodeFetchMock, { HeadersMock, RequestMock } from '../mocks/modules/nodeFetch.mock.js';
import chokidarMock from '../mocks/modules/chokidarMock.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../../config/api-config.json');

const COOKIE =
  'Mg==.eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJZV0VzMGlfSHdQMGJqd20zSVBlTzcxbTBubGJlUEpZN2pzeUsxTExnb0dVIn0.eyJleHAiOjE2OTQ3NjM4MjUsImlhdCI6MTY5NDc2MzUyNSwiYXV0aF90aW1lIjoxNjk0NzYzNTIyLCJqdGkiOiIzNjZiYzNjMi1lOGMzLTQwMDYtOGFjNC03MjA5NzkzYTNkYTEiLCJpc3MiOiJodHRwczovL2lhbS5lYmxpZ2FyLmdhcy4xMC4xOTYuMTI2LjE1OC5uaXAuaW8vYXV0aC9yZWFsbXMvb2FtIiwiYXVkIjoiYWRwLWlhbS1hYS1jbGllbnQiLCJzdWIiOiJkOWExODMxNC1lYTQ2LTQwMzktOTU1Mi03Yjc3MTBjMzI1OWQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJhZHAtaWFtLWFhLWNsaWVudCIsInNlc3Npb25fc3RhdGUiOiIxMWQ5ODliNC0yYTU0LTQxMTctYmFiNi05YmExOGViMTRjYzUiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlLWFkcC1hdXRoIiwic2lkIjoiMTFkOTg5YjQtMmE1NC00MTE3LWJhYjYtOWJhMThlYjE0Y2M1IiwidXBuIjoiZ2FzLXVzZXIiLCJsYXN0LWxvZ2luLXRpbWUiOiIyMDIzMDkxNTA3Mzg0MloifQ.MGd27stTXAF5iAr1Ryh-Zvyk5lj9onZeqweDTJE3agJegAfNF7E6b0j2pp6WxHQJBpEcpgNIp0J9SbD7rKJMVy0tCqcOEjIYJ3Budw0w7DMSQTsZaYi0hvn-oNS3O3uVzkvWZkyw7OAJcsDa6ZWir2fcL-2H2ZfgRru-ab8Tlus-NpbVcQlslHDSWbsT2iWSdnEEgYuIufU6SUbXr6jFG0tr_sh4t2Cmm7zOwSUPzgdwri3CnyKu8LWJAGw-zIzA4KjnDK6j968ehIfG1s9irQdVfDSdrMv4vBXzyTn5dWwMh1jLDmNyTkozw5YuBRZEsYWXYnVZ8hMlqehXucspHA';
const REALM = 'oam';
const APPLICATION_JSON = 'application/json';
const AUDIENCE = 'adp-iam-aa-client';
const PERMISSION_MODE = 'permissions';
const DECISION_MODE = 'decision';

const EXPECTED_USERINFO_RESPONSE = {
  lastLoginTime: '20230915073842Z',
  userId: 'e9f5b5c9-dae5-433b-be68-7d1f3be2cc06',
  username: 'gas-user',
  sub: 'e9f5b5c9-dae5-433b-be68-7d1f3be2cc06',
  upn: 'gas-user',
};

const EXPECTED_PERMISSION_RESPONSE = [
  {
    scopes: ['TRACE', 'HEAD', 'DELETE', 'POST', 'GET', 'CONNECT', 'OPTIONS', 'PUT'],
    rsid: '90cda438-55cc-4bbf-ac7a-80c24141b4b3',
    rsname: 'all-in-one-gas_eric-adp-gui-aggregator-service-authproxy',
  },
];

const POSITIVE_DECISION_RESPONSE = { result: true };
const NEGATIVE_DECISION_RESPONSE = { result: false };

const INTERNAL_ERROR_RESPONSE = {
  code: 'adp.internal.error',
  message: 'This API endpoint is not enabled. Check service configuration.',
};

const getConfigMock = (enabled) => ({
  libName: 'fs',
  namedExports: fsMock({
    uiServiceConfig: {
      k8sLabelValue: 'workspace-gui',
      dependencies: {
        gasIam: {
          enabled,
          iamServiceName: 'eric-sec-access-mgmt',
          realmName: 'oam',
          audience: AUDIENCE,
        },
      },
    },
  }),
});

const getNonTLSConfigMock = () => ({
  libName: 'fs',
  namedExports: fsMock({
    uiServiceConfig: {
      k8sLabelValue: 'workspace-gui',
      dependencies: {
        gasIam: {
          serviceName: 'gasIam',
          enabled: true,
          iamServiceName: 'eric-sec-access-mgmt',
          iamHostName: 'iam.ericsson.com',
          realmName: 'oam',
          audience: AUDIENCE,
          serverCertPath: '/run/secrets/iamServerCert/tls.crt',
          nonTLSMode: true,
        },
      },
    },
  }),
});

const mocks = [
  { libName: '@kubernetes/client-node', defaultExport: k8sClientMock },
  {
    libName: 'node-fetch',
    namedExports: { Headers: HeadersMock, Request: RequestMock },
    defaultExport: nodeFetchMock,
  },
  { libName: 'chokidar', defaultExport: chokidarMock },
  { libName: '../../services/logging.js', namedExports: loggingMock },
];

describe('Component tests for userpermission API with TLS', () => {
  const { loadServer, closeServer } = factory();
  let request;

  beforeEach(async () => {
    request = await loadServer(...mocks, getConfigMock(true));
  });

  afterEach(async () => {
    await closeServer();
  });

  it('has the /userinfo endpoint', async () => {
    await request
      .get(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.userInfo.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(EXPECTED_USERINFO_RESPONSE);
      });
  });

  it('has the /:realm/userinfo endpoint', async () => {
    await request
      .get(
        `${apiConfig.userPermission.prefix}/${REALM}${apiConfig.userPermission.routes.userInfo.path}`,
      )
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(EXPECTED_USERINFO_RESPONSE);
      });
  });

  it('can return permission response with `permissions` mode', async () => {
    await request
      .post(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.permission.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .send({
        response_mode: PERMISSION_MODE,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(EXPECTED_PERMISSION_RESPONSE);
      });
  });

  it('can return permission response with `decision` mode', async () => {
    await request
      .post(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.permission.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .send({
        response_mode: DECISION_MODE,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(POSITIVE_DECISION_RESPONSE);
      });
  });

  it('can return permission response with `decision` mode and permission array', async () => {
    await request
      .post(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.permission.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .send({
        response_mode: DECISION_MODE,
        permission: ['#GET'],
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(POSITIVE_DECISION_RESPONSE);
      });
  });

  it('will return negative response on negative decision', async () => {
    await request
      .post(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.permission.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .send({
        response_mode: DECISION_MODE,
        permission: ['#NONEXISTING'],
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(NEGATIVE_DECISION_RESPONSE);
      });
  });
});

describe('Component tests for userpermission API without TLS', () => {
  const { loadServer, closeServer } = factory();
  let request;

  beforeEach(async () => {
    request = await loadServer(...mocks, getNonTLSConfigMock());
  });

  afterEach(async () => {
    await closeServer();
  });

  it('has the /userinfo endpoint in nonTLS mode', async () => {
    await request
      .get(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.userInfo.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(EXPECTED_USERINFO_RESPONSE);
      });
  });

  it('can return permission response with `decision` mode in nonTLS mode', async () => {
    await request
      .post(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.permission.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .send({
        response_mode: DECISION_MODE,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).to.deep.eq(POSITIVE_DECISION_RESPONSE);
      });
  });
});

describe('Component tests for userpermission API error handling', () => {
  const { loadServer, closeServer } = factory();
  let request;

  beforeEach(async () => {
    request = await loadServer(...mocks, getConfigMock(false));
  });

  afterEach(async () => {
    await closeServer();
  });

  it('has the /userinfo endpoint', async () => {
    await request
      .get(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.userInfo.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .expect(500)
      .expect((response) => {
        expect(response.body).to.deep.eq(INTERNAL_ERROR_RESPONSE);
      });
  });

  it('has the /:realm/userinfo endpoint', async () => {
    await request
      .get(
        `${apiConfig.userPermission.prefix}/${REALM}${apiConfig.userPermission.routes.userInfo.path}`,
      )
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .expect(500)
      .expect((response) => {
        expect(response.body).to.deep.eq(INTERNAL_ERROR_RESPONSE);
      });
  });

  it('has the /permission endpoint', async () => {
    await request
      .post(`${apiConfig.userPermission.prefix}${apiConfig.userPermission.routes.permission.path}`)
      .set('Accept', APPLICATION_JSON)
      .set('Cookie', [`eric.adp.authz.proxy.token=${COOKIE}; eric.adp.authn.kc.realm=${REALM};`])
      .send({
        response_mode: PERMISSION_MODE,
      })
      .expect(500)
      .expect((response) => {
        expect(response.body).to.deep.eq(INTERNAL_ERROR_RESPONSE);
      });
  });
});
