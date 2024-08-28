import { expect } from 'chai';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import CertificateManagerMock from '../mocks/modules/certificateManagerMock.js';
import TelemetryServiceMock from '../mocks/services/telemetryServiceMock.js';
import CONSTANTS from '../../config/constants.js';

const {
  LAST_LOGIN_TIME_COOKIE_KEY,
  LAST_LOGIN_TIME_RESPONSE_KEY,
  USERNAME_RESPONSE_KEY,
  USER_ID_RESPONSE_KEY,
} = CONSTANTS;

const IAM_HOSTNAME = 'iam.ericsson.se';
const IAM_SERVICE_NAME = 'iam';
const REALMS = {
  REALM_FROM_CONFIG: 'realm-from-config',
  REALM_FROM_COOKIE: 'realm-from-cookie',
  REALM_FROM_URL: 'realm-from-url',
};
const LAST_LOGIN_TIME_ORIGINAL_KEY = 'last-login-time';
const AUDIENCE = 'adp-iam-aa-client';
const UID = '11-22-33-44';
const USER_NAME = 'Jane Doe';

const configManagerMockForTLS = {
  useHttps: () => true,
  getUserPermissionConfig: () => ({
    iamServiceName: IAM_SERVICE_NAME,
    realmName: REALMS.REALM_FROM_CONFIG,
    audience: AUDIENCE,
    fieldMappings: {
      [LAST_LOGIN_TIME_RESPONSE_KEY]: ['last-login-time'],
      [USER_ID_RESPONSE_KEY]: ['sub'],
      [USERNAME_RESPONSE_KEY]: ['upn'],
    },
  }),
  getCertificatePath: () => '',
  verifyClientCertificate: () => true,
  getDependenciesConfig: () => ({}),
};

const configManagerMockForUserKeys = {
  useHttps: () => true,
  getUserPermissionConfig: () => ({
    iamServiceName: IAM_SERVICE_NAME,
    realmName: REALMS.REALM_FROM_CONFIG,
    audience: AUDIENCE,
    fieldMappings: {
      [LAST_LOGIN_TIME_RESPONSE_KEY]: ['lastLogin'],
      [USER_ID_RESPONSE_KEY]: ['uid'],
      [USERNAME_RESPONSE_KEY]: ['fullName'],
    },
  }),
  getCertificatePath: () => '',
  verifyClientCertificate: () => true,
  getDependenciesConfig: () => ({}),
};

const configManagerMockForNonTLS = {
  useHttps: () => false,
  getUserPermissionConfig: () => ({
    iamServiceName: IAM_SERVICE_NAME,
    realmName: REALMS.REALM_FROM_CONFIG,
    audience: AUDIENCE,
    iamHostName: IAM_HOSTNAME,
    nonTLSMode: true,
  }),
  getCertificatePath: () => '',
  verifyClientCertificate: () => true,
  getDependenciesConfig: () => ({}),
};

const encode = (object) =>
  Buffer.from(JSON.stringify(object)).toString('base64').replaceAll('=', '');

const HOST = 'iam.ericsson.com';
const PROTOCOL = 'https';
const URL = `${PROTOCOL}://${HOST}`;

const LAST_LOGIN_TIME_COOKIE = new Date(Date.now() - 60000).toISOString();
const LAST_LOGIN_TIME_REQUEST = new Date(Date.now() - 120000).toISOString();

const TOKEN_FROM_COOKIE = `fromcookieheader.${encode({
  iss: URL,
  [LAST_LOGIN_TIME_COOKIE_KEY]: LAST_LOGIN_TIME_COOKIE,
})}.checksum`;
const TOKEN_FROM_HEADER = `fromheaderheader.${encode({ iss: URL })}.checksum`;

describe('Unit tests for UserInfoService', () => {
  let UserInfoService;

  const mockedAddCertificateListener = td.func();
  let fetchMock = td.func();
  let encodeMock = td.func();

  const mockModules = async ({
    fetchResponsesForProtocol = fetchMock,
    parseJsonRequestBody = encodeMock,
    configManagerMock = configManagerMockForTLS,
  }) => {
    await td.replaceEsm('../../services/logging.js', {
      ...loggingMock,
      addCertificateListener: mockedAddCertificateListener,
    });
    await td.replaceEsm('../../config/configManager.js', null, configManagerMock);
    await td.replaceEsm('@adp/base', { CertificateManager: CertificateManagerMock });
    await td.replaceEsm('../../services/telemetryService.js', null, TelemetryServiceMock);
    await td.replaceEsm('@adp/utilities/networkUtil', {
      fetchResponsesForProtocol,
      parseJsonRequestBody,
    });
    UserInfoService = (await import('../../services/userInfoService.js')).default;
  };

  after(() => {
    td.reset();
  });

  let userInfoService;

  describe('getUserInfo', () => {
    it('can get Realm from the IAM cookie', async () => {
      await mockModules({ fetchResponsesForProtocol: fetchMock });
      userInfoService = new UserInfoService();

      await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });
      const fetchExpl = td.explain(fetchMock);
      const { headers, protocol, url } = fetchExpl.calls[0].args[0];

      expect(headers.Authorization).to.eq(`Bearer ${TOKEN_FROM_COOKIE}`);
      expect(headers.Host).to.eq(HOST);
      expect(protocol).to.eq(PROTOCOL);
      expect(url).to.eq(
        `${IAM_SERVICE_NAME}-http:8444/auth/realms/${REALMS.REALM_FROM_COOKIE}/protocol/openid-connect/userinfo`,
      );
    });

    it('can get Realm from the url', async () => {
      await userInfoService.getUserInfo({
        params: {
          realm: REALMS.REALM_FROM_URL,
        },
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });
      const fetchExpl = td.explain(fetchMock);
      const { url } = fetchExpl.calls[1].args[0];

      expect(url).to.eq(
        `${IAM_SERVICE_NAME}-http:8444/auth/realms/${REALMS.REALM_FROM_URL}/protocol/openid-connect/userinfo`,
      );
    });

    it('can get Realm from config if not available elsewhere', async () => {
      await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE};`,
        },
      });
      const fetchExpl = td.explain(fetchMock);
      const { url } = fetchExpl.calls[2].args[0];
      expect(url).to.eq(
        `${IAM_SERVICE_NAME}-http:8444/auth/realms/${REALMS.REALM_FROM_CONFIG}/protocol/openid-connect/userinfo`,
      );
    });

    it('can get Bearer token from Auth header', async () => {
      await userInfoService.getUserInfo({
        params: {},
        headers: {
          authorization: `Bearer ${TOKEN_FROM_HEADER}`,
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });
      const fetchExpl = td.explain(fetchMock);
      const { headers } = fetchExpl.calls[3].args[0];

      expect(headers.Authorization).to.eq(`Bearer ${TOKEN_FROM_HEADER}`);
    });

    it('can get Bearer token from IAM cookie if Auth header has Basic auth', async () => {
      await userInfoService.getUserInfo({
        params: {},
        headers: {
          authorization: `Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW`,
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });
      const fetchExpl = td.explain(fetchMock);
      const { headers } = fetchExpl.calls[4].args[0];

      expect(headers.Authorization).to.eq(`Bearer ${TOKEN_FROM_COOKIE}`);
    });

    it(`can return appropriate userInfo if IAM response is empty`, async () => {
      fetchMock = async () => ({ ok: true, json: async () => ({}) });
      await mockModules({ fetchResponsesForProtocol: fetchMock });
      userInfoService = new UserInfoService();

      const { error, userInfo } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.be.undefined;
      expect(userInfo).to.deep.eq({
        [LAST_LOGIN_TIME_RESPONSE_KEY]: LAST_LOGIN_TIME_COOKIE,
      });
    });

    it(`can return ${LAST_LOGIN_TIME_ORIGINAL_KEY} from response even if it is in the cookie`, async () => {
      fetchMock = async () => ({
        ok: true,
        json: async () => ({
          [LAST_LOGIN_TIME_ORIGINAL_KEY]: LAST_LOGIN_TIME_REQUEST,
        }),
      });
      await mockModules({ fetchResponsesForProtocol: fetchMock });
      userInfoService = new UserInfoService();

      const { error, userInfo } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.be.undefined;
      expect(userInfo).to.deep.eq({
        [LAST_LOGIN_TIME_ORIGINAL_KEY]: LAST_LOGIN_TIME_REQUEST,
        [LAST_LOGIN_TIME_RESPONSE_KEY]: LAST_LOGIN_TIME_REQUEST,
      });
    });

    it(`can omit ${LAST_LOGIN_TIME_RESPONSE_KEY} if it is not available anywhere`, async () => {
      fetchMock = async () => ({ ok: true, json: async () => ({}) });
      await mockModules({ fetchResponsesForProtocol: fetchMock });
      userInfoService = new UserInfoService();

      const { error, userInfo } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_HEADER}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.be.undefined;
      expect(userInfo[LAST_LOGIN_TIME_RESPONSE_KEY]).to.be.undefined;
    });

    it('return correct userInfo data according to the fieldMappings config', async () => {
      const expectedUserInfo = {
        uid: UID,
        fullName: USER_NAME,
        lastLogin: LAST_LOGIN_TIME_REQUEST,
        [LAST_LOGIN_TIME_RESPONSE_KEY]: LAST_LOGIN_TIME_REQUEST,
        [USER_ID_RESPONSE_KEY]: UID,
        [USERNAME_RESPONSE_KEY]: USER_NAME,
      };
      fetchMock = async () => ({
        ok: true,
        json: async () => ({
          uid: UID,
          fullName: USER_NAME,
          lastLogin: LAST_LOGIN_TIME_REQUEST,
        }),
      });
      await mockModules({
        fetchResponsesForProtocol: fetchMock,
        configManagerMock: configManagerMockForUserKeys,
      });
      userInfoService = new UserInfoService();

      const { error, userInfo } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.be.undefined;
      expect(userInfo).to.deep.eq(expectedUserInfo);
    });

    it("returns original userInfo data and lastLoginTime from cookies if fieldMappings keys don't match with the original response", async () => {
      const originalResponse = {
        user_id: UID,
        user_name: USER_NAME,
        user_last_login: LAST_LOGIN_TIME_REQUEST,
      };
      const expectedUserInfo = {
        ...originalResponse,
        [LAST_LOGIN_TIME_RESPONSE_KEY]: LAST_LOGIN_TIME_COOKIE,
      };
      fetchMock = async () => ({
        ok: true,
        json: async () => originalResponse,
      });
      await mockModules({
        fetchResponsesForProtocol: fetchMock,
        configManagerMock: configManagerMockForNonTLS,
      });
      userInfoService = new UserInfoService();

      const { error, userInfo } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.be.undefined;
      expect(userInfo).to.deep.eq(expectedUserInfo);
    });

    it('can handle thrown error in fetchResponsesForProtocol', async () => {
      fetchMock = async () => {
        const err = new Error();
        err.status = 500;
        throw err;
      };
      await mockModules({ fetchResponsesForProtocol: fetchMock });
      userInfoService = new UserInfoService();

      const { error } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.exist;
      expect(error.status).to.eq(500);
    });

    it('can handle 404 response returned by IAM', async () => {
      fetchMock = async () => ({ ok: false, status: 404 });
      await mockModules({ fetchResponsesForProtocol: fetchMock });
      userInfoService = new UserInfoService();

      const { error } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.exist;
      expect(error.status).to.eq(404);
    });

    it('handles if mTLS is turned off', async () => {
      fetchMock = async ({ url }) => {
        if (url.includes(IAM_HOSTNAME)) {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: false, json: async () => ({}) };
      };
      await mockModules({
        fetchResponsesForProtocol: fetchMock,
        configManagerMock: configManagerMockForNonTLS,
      });
      userInfoService = new UserInfoService();

      const { userInfo, error } = await userInfoService.getUserInfo({
        params: {},
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
      });

      expect(error).to.be.undefined;
      expect(userInfo[LAST_LOGIN_TIME_RESPONSE_KEY]).to.exist;
    });
  });

  describe('getPermission', () => {
    it('will throw error if request body is not correct ', async () => {
      fetchMock = td.func();
      encodeMock = td.func();
      await mockModules({ fetchResponsesForProtocol: fetchMock, parseJsonRequestBody: encodeMock });
      userInfoService = new UserInfoService();

      const { error } = await userInfoService.getPermission({
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
        body: { test: 'unexpected_key' },
      });

      expect(error).to.exist;
      expect(error.status).to.eq(400);
    });

    it('can handle thrown error in fetchResponsesForProtocol', async () => {
      fetchMock = async () => {
        const err = new Error();
        err.status = 500;
        throw err;
      };
      encodeMock = (req) => req;
      await mockModules({ fetchResponsesForProtocol: fetchMock, parseJsonRequestBody: encodeMock });
      userInfoService = new UserInfoService();

      const { error } = await userInfoService.getPermission({
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
        body: {
          response_mode: 'permissions',
        },
      });

      expect(error).to.exist;
      expect(error.status).to.eq(500);
    });

    it('can handle 404 response returned by IAM', async () => {
      fetchMock = async () => ({ ok: false, status: 404 });
      await mockModules({ fetchResponsesForProtocol: fetchMock, parseJsonRequestBody: encodeMock });
      userInfoService = new UserInfoService();

      const { error } = await userInfoService.getPermission({
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
        body: {
          response_mode: 'permissions',
        },
      });

      expect(error).to.exist;
      expect(error.status).to.eq(404);
    });

    it('handles if mTLS is turned off', async () => {
      encodeMock = async ({ url }) => {
        if (url.includes(IAM_HOSTNAME)) {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: false, json: async () => ({}) };
      };
      fetchMock = async (func) => func;
      await mockModules({
        fetchResponsesForProtocol: fetchMock,
        parseJsonRequestBody: encodeMock,
        configManagerMock: configManagerMockForNonTLS,
      });
      userInfoService = new UserInfoService();

      const { permissions, error } = await userInfoService.getPermission({
        headers: {
          cookie: `eric.adp.authz.proxy.token=${TOKEN_FROM_COOKIE}; eric.adp.authn.kc.realm=${REALMS.REALM_FROM_COOKIE}; `,
        },
        body: {
          response_mode: 'permissions',
        },
      });

      expect(error).to.be.undefined;
      expect(permissions).to.deep.eq({});
    });
  });

  it('handles if IAM is turned off', async () => {
    await mockModules({ fetchResponsesForProtocol: () => {} });
    userInfoService = new UserInfoService();

    const userInfoScenario1 = await userInfoService.getUserInfo({
      params: {},
      headers: {
        cookie: '',
      },
    });

    const userInfoScenario2 = await userInfoService.getUserInfo({
      params: {},
      headers: {},
    });

    expect(userInfoScenario1.error).to.exist;
    expect(userInfoScenario1.error.status).to.eq(401);
    expect(userInfoScenario2.error).to.exist;
    expect(userInfoScenario2.error.status).to.eq(401);
  });
});
