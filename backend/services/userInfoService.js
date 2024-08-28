import { parseSingleCookieByName } from '@adp/auth';
import { fetchResponsesForProtocol, parseJsonRequestBody } from '@adp/utilities/networkUtil';
import certificateManager from './certificateManager.js';
import NonTLSCertificateManager from './certificateManagerNonTLS.js';
import configManager from '../config/configManager.js';
import CONSTANTS from '../config/constants.js';
import telemetryService from './telemetryService.js';
import { schemaValidator } from '../utils/schemaValidator.js';

const {
  LAST_LOGIN_TIME_COOKIE_KEY,
  USERNAME_RESPONSE_KEY,
  USER_ID_RESPONSE_KEY,
  LAST_LOGIN_TIME_RESPONSE_KEY,
  IAM_SERVICE_TLS_PORT,
  GRANT_TYPE,
} = CONSTANTS;

/**
 * Get the parsed and bearer tokens from the respective headers
 *
 * @param {string} cookie - The "Cookie" header from the request
 * @param {string} authorization - The "Authorization" header from the request
 * @returns {object} An object with the parsed and bearer tokens
 */
function getTokens(cookie, authorization) {
  const token =
    authorization && authorization.includes('Bearer')
      ? authorization.split(';')[0].match(/(?<=Bearer ).*/)[0]
      : parseSingleCookieByName(CONSTANTS.USER_AUTH_TOKEN_COOKIE, cookie);

  const tokenParts = token.split('.').filter((string) => !string.includes('='));
  const parsedToken = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

  return {
    parsedToken,
    bearerToken: tokenParts.join('.'),
  };
}
/**
 * Examines the request body of an object. If audience field is missing, gives it a default value.
 * Runs a validator on the body object as well.
 * @param {object} body HTTP request body
 * @param {string} audience Default value of audience.
 */
function permissionBodyCheck(body, audience) {
  body.audience = !body.audience ? audience : body.audience;

  const bodyValidationResult = schemaValidator.validatePermissionSchema(body);

  if (!bodyValidationResult.valid) {
    const bodyCheckError = new Error(`${bodyValidationResult.errors.map((err) => err.stack)}`);
    bodyCheckError.status = 400;
    throw bodyCheckError;
  }
}

function authHeaderCheck(authorization, cookie) {
  if (!authorization && (!cookie || !cookie.includes(CONSTANTS.USER_AUTH_TOKEN_COOKIE))) {
    const authError = new Error(
      'Missing authentication details. Provide access token in the Authentication header or via cookie!',
    );
    authError.status = 401;
    throw authError;
  }
}

export default class UserInfoService {
  get config() {
    return configManager.getUserPermissionConfig();
  }

  get nonTLSMode() {
    const { nonTLSMode } = this.config;
    return nonTLSMode && !configManager.useHttps();
  }

  getUserInfoUrl(determinedRealmName) {
    const { iamServiceName, iamHostName } = this.config;

    return `${
      this.nonTLSMode ? iamHostName : `${iamServiceName}-http:${IAM_SERVICE_TLS_PORT}`
    }/auth/realms/${determinedRealmName}/protocol/openid-connect/userinfo`;
  }

  mapUserInfo({ rawUserInfo = {}, defaultLastLoginTime }) {
    const { fieldMappings = {} } = this.config;
    const mappedUserInfo = Object.entries(fieldMappings).reduce((result, [propName, altKeys]) => {
      const propAltKey = altKeys.find((key) => !!rawUserInfo[key]);
      if (propAltKey) {
        result[propName] = rawUserInfo[propAltKey];
      }
      return result;
    }, {});
    const lastLoginTimeValue = mappedUserInfo[LAST_LOGIN_TIME_RESPONSE_KEY] || defaultLastLoginTime;

    return {
      ...rawUserInfo,
      ...(mappedUserInfo[USERNAME_RESPONSE_KEY] && {
        [USERNAME_RESPONSE_KEY]: mappedUserInfo[USERNAME_RESPONSE_KEY],
      }),
      ...(mappedUserInfo[USER_ID_RESPONSE_KEY] && {
        [USER_ID_RESPONSE_KEY]: mappedUserInfo[USER_ID_RESPONSE_KEY],
      }),
      ...(lastLoginTimeValue && { [LAST_LOGIN_TIME_RESPONSE_KEY]: lastLoginTimeValue }),
    };
  }

  /**
   * Return info about the current logged in user
   *
   * @param request - request of /userinfo endpoint call
   * @return userinfo object from IAM with user name, last login time, etc.
   */
  async getUserInfo(request) {
    const { realm } = request.params;
    const { serviceName, realmName } = this.config;
    let userInfo;
    let error;

    const { authorization, cookie } = request.headers;

    try {
      authHeaderCheck(authorization, cookie);

      const { parsedToken, bearerToken } = getTokens(cookie, authorization);

      const url = new URL(parsedToken.iss);

      const determinedRealmName =
        realm ||
        parseSingleCookieByName(CONSTANTS.USER_AUTH_REALM_COOKIE, cookie) ||
        realmName ||
        '';

      const headers = {
        Authorization: `Bearer ${bearerToken}`,
        Host: url.hostname,
        Accept: 'application/json',
      };

      const determinedUrl = this.getUserInfoUrl(determinedRealmName);

      const certM = this.nonTLSMode
        ? new NonTLSCertificateManager(this.config)
        : certificateManager;

      const userInfoRequest = await fetchResponsesForProtocol({
        serviceName,
        protocol: 'https',
        url: determinedUrl,
        certificateManager: certM,
        dstService: telemetryService,
        headers,
      });

      if (!userInfoRequest.ok) {
        const { status } = userInfoRequest;
        error = new Error();
        error.status = status;
      } else {
        const rawUserInfo = await userInfoRequest.json();

        userInfo = this.mapUserInfo({
          rawUserInfo,
          defaultLastLoginTime: parsedToken[LAST_LOGIN_TIME_COOKIE_KEY],
        });
      }
    } catch (err) {
      err.status = err.status || 500;
      error = err;
    }

    return {
      userInfo,
      error,
    };
  }

  getPermissionUrl(determinedRealmName) {
    const { iamServiceName, iamHostName } = this.config;

    return `${
      this.nonTLSMode ? iamHostName : `${iamServiceName}-http:${IAM_SERVICE_TLS_PORT}`
    }/auth/realms/${determinedRealmName}/protocol/openid-connect/token`;
  }

  /**
   * Returns info about the current user's permissions.
   *
   * @param request - request of /permission endpoint call.
   * @return Protection API token info from IAM.
   */
  async getPermission(request) {
    const { serviceName, realmName, audience } = this.config;
    const { body } = request;
    let permissions;
    let error;

    const { authorization, cookie } = request.headers;

    try {
      authHeaderCheck(authorization, cookie);

      const { parsedToken, bearerToken } = getTokens(cookie, authorization);

      const url = new URL(parsedToken.iss);

      const determinedRealmName =
        body.realm ||
        parseSingleCookieByName(CONSTANTS.USER_AUTH_REALM_COOKIE, cookie) ||
        realmName ||
        '';

      const headers = {
        Authorization: `Bearer ${bearerToken}`,
        Host: url.hostname,
        Accept: 'application/json',
      };

      permissionBodyCheck(body, audience);
      body.grant_type = GRANT_TYPE;

      const determinedUrl = this.getPermissionUrl(determinedRealmName);

      const certM = this.nonTLSMode
        ? new NonTLSCertificateManager(this.config)
        : certificateManager;

      const permissionsRequest = await fetchResponsesForProtocol(
        parseJsonRequestBody({
          serviceName,
          protocol: 'https',
          url: determinedUrl,
          certificateManager: certM,
          dstService: telemetryService,
          headers,
          method: 'POST',
          body,
        }),
      );

      if (!permissionsRequest.ok) {
        const { status } = permissionsRequest;
        if ((status === 400 || status === 403) && body.response_mode === 'decision') {
          return { permissions: { result: false }, error };
        }
        error = new Error();
        error.status = status;
      } else {
        permissions = await permissionsRequest.json();
      }
    } catch (err) {
      error = err;
    }

    return { permissions, error };
  }
}
