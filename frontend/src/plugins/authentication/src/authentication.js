import userPermissionHandler from '@adp/auth/userPermissionHandler';

// Import of ErrorApp for tests is resolved via aliasPlugin.
// Please check the web - test - runner.config.js for setup.
import ErrorApp from 'error-app';

import rest from '../../../utils/rest';
import UiSettingsUtil from '../../../utils/uiSettingsUtil';
import configManager from '../../../config/configManager';
import CONSTANTS from '../../../utils/constants.js';

const { LAST_LOGIN_TIME_RESPONSE_KEY, USERNAME_RESPONSE_KEY } = CONSTANTS;
const sessionExpiredEvent = 'user-session-expired';
const tokenNotFoundText = 'Token Not Found';
const sessionExpiredText = 'kc-form-login';
const SESSION_EXPIRED_PAGE = 'session-expiration';
let username;

// Patch fetch for A&A
// Patch fetch to handle session expiration
export const patchFetch = () => {
  const originalFetch = window.fetch;

  // eslint-disable-next-line func-names
  window.fetch = function (url, options = {}) {
    const modifiedOptions = { ...options };
    // Needed to send cookie with CORS requests. Necessary for access token refresh.
    // Must set explicitly as es-module-shim sets 'same-origin' for module fetch requests.
    modifiedOptions.credentials = 'include';

    return new Promise((resolve, reject) => {
      originalFetch(url, modifiedOptions)
        .then((response) => {
          // Login form response => session expired
          // For SEF API GW - 400 error response response 'Token not found' => session expired
          const hasLoginFormResponse =
            response.headers.get('Content-Type') === 'text/html;charset=utf-8';
          const hasSefErrorResponse =
            response.headers.get('Content-Type') === 'application/problem+json';

          if (hasLoginFormResponse || hasSefErrorResponse) {
            response
              .clone()
              .text()
              .then((text) => {
                if (text.includes(sessionExpiredText) || text.includes(tokenNotFoundText)) {
                  const event = new Event(sessionExpiredEvent);
                  setTimeout(() => {
                    document.body.dispatchEvent(event);
                  }, 200);
                }
                resolve(response);
              });
          } else {
            // Non-login form response => handle response by the original caller.
            resolve(response);
          }
        })
        .catch((error) => {
          // Error response => handle error by the original caller.
          reject(error);
        });
    });
  };
};

export const patchXMLHttpRequest = () => {
  const OriginalXMLHttpRequest = window.XMLHttpRequest;
  // eslint-disable-next-line func-names
  window.XMLHttpRequest = function () {
    const request = new OriginalXMLHttpRequest();
    request.withCredentials = true;
    request.addEventListener('load', () => {
      if (request.responseText.includes(sessionExpiredText)) {
        const event = new Event(sessionExpiredEvent);
        document.body.dispatchEvent(event);
      }
    });
    return request;
  };
};

export const onBeforeContainerLoad = () => async (resolve) => {
  patchXMLHttpRequest();
  patchFetch();

  ErrorApp.register();

  await configManager.initConfig();

  const userPermissionEnabled = configManager.getUserPermissionConfig()?.enabled;
  let userInfo = {};

  if (userPermissionEnabled) {
    try {
      userInfo = await rest.getUserInfo();
    } catch (error) {
      userInfo = {};
    }
  }

  userPermissionHandler.init({
    cookies: document.cookie,
    userInfo,
    usernameKey: USERNAME_RESPONSE_KEY,
    lastLoginTimeKey: LAST_LOGIN_TIME_RESPONSE_KEY,
  });

  username = userPermissionHandler.getUsername();

  document.body.dispatchEvent(new CustomEvent('set-username-finished', { detail: username }));

  const authTime = userPermissionHandler.getAuthTime();

  if (authTime) {
    const previousLoginTime = await UiSettingsUtil.get('lastLoginTime');
    await UiSettingsUtil.set('lastLoginTime', authTime);

    if (previousLoginTime) {
      await UiSettingsUtil.set('previousLoginTime', previousLoginTime);
    }
  }

  resolve();
};

export const openUserAccountEditor = () => {
  const route = configManager.getUserAccountURL();
  if (route.startsWith('#')) {
    window.EUI.Router.goto(route);
  } else {
    window.open(route, '_blank').focus();
  }
};

export const getUserAccountEditorRoute = () => configManager.getUserAccountURL();

export const clearSession = async () => {
  window.location.href = configManager.getLogoutURL();
};

export const getLastLoginTime = async () => UiSettingsUtil.get('lastLoginTime');
export const getPreviousLoginTime = async () => UiSettingsUtil.get('previousLoginTime');
export const getUsername = () => username;

// Add event handler for session expiration event.
document.body.addEventListener(sessionExpiredEvent, () => {
  window.EUI.Router.goto(SESSION_EXPIRED_PAGE);
});
