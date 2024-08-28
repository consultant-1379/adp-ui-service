import lodash from 'lodash';
import { waitUntil } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import rest from '../../src/utils/rest.js';
import constants from './constants';

let i = 0;

class HttpError extends Error {
  constructor(response) {
    super(`${response.status} for ${response.url}`);
    this.name = 'HttpError';
    this.response = response;
  }
}

export function stubRestError({ method, status, statusText, url }) {
  const errorBody = {
    status,
    statusText,
    url,
  };
  return sinon.stub(rest, method).throws(new HttpError(errorBody));
}

export function stubRouter({ hash, getRouteMap } = {}) {
  const ROUTE = hash || 'launcher';
  window.EUI = { ...window.EUI };
  window.EUI.Router = {
    currentHref: '',
    goto: () => {},
    routeMap: getRouteMap?.routeMap || { launcher: ROUTE },
    addRoute: () => {
      i += 1;
      return i;
    },
    removeRoute: () => {},
    getRouteMap: () => getRouteMap,
  };
  return ROUTE;
}

const cssPaths = {
  errorMessage: 'e-error-message',
};

export async function waitForError(element) {
  const { shadowRoot } = element;
  let errorMessage;
  await waitUntil(
    () => {
      errorMessage = shadowRoot.querySelector(cssPaths.errorMessage);
      return !lodash.isNull(errorMessage);
    },
    'ErrorMessage component should appear in time',
    { interval: 50, timeout: constants.CHILDREN_WAIT_TIMEOUT },
  );

  return errorMessage;
}
