import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const validAppConfig1 = require('../configs/domain-app1.config.json');
const validAppConfig2 = require('../configs/domain-app2.config.json');
const validAppConfig3 = require('../configs/domain-app3.config.json');
const packageConfig1 = require('../configs/domain-app1.config.package.json');
const packageConfig2 = require('../configs/domain-app2.config.package.json');
const packageConfig3 = require('../configs/domain-app3.config.package.json');
const groupOverrideConfig = require('../configs/manualoverrides-test.config.package');

const NO_SUCH_APP = 'No such app.';

export class HeadersMock {}

export class RequestMock {
  constructor(input, options) {
    this.url = typeof input === 'object' ? input.url : input;
    this.headers = options?.headers;
    this.body = options?.body;
    this.agent = options?.agent;
  }
}

export default ({ url, body }) =>
  new Promise((resolve, reject) => {
    let error;
    const params = body || new URLSearchParams();
    switch (true) {
      case /.*domain1.*configContext.*config\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(validAppConfig3),
        });
        break;
      case /.*domain1.*\/ui\/.*config\.json$/.test(url):
        resolve({
          ok: false,
          json: () => Promise.resolve({}),
        });
        break;
      case /.*group-override.*configContext.*config\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(groupOverrideConfig),
        });
        break;
      case /.*tcDomainApp1.*config\.json$/.test(url):
      case /.*domain1.*config\.json$/.test(url):
      case /https:.*domain3.*config\.json$/.test(url):
      case /.*domain4.*config\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(validAppConfig1),
        });
        break;
      case /.*domain1.*configContext.*config\.package\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(packageConfig3),
        });
        break;
      case /https:.*domain3.*config\.package\.json$/.test(url):
      case /.*tcDomainApp1.*config\.package\.json$/.test(url):
      case /.*domain1.*config\.package\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(packageConfig1),
        });
        break;
      case /.*domain2.*config\.json$/.test(url):
      case /.*tcDomainApp2.*config\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(validAppConfig2),
        });
        break;
      case /.*tcDomainApp2.*config\.package\.json$/.test(url):
      case /.*domain2.*config\.package\.json$/.test(url):
        resolve({
          ok: true,
          json: () => Promise.resolve(packageConfig2),
        });
        break;
      case /.*invalid.*/.test(url):
      case /.*domain4.*config\.package\.json$/.test(url):
        resolve({
          json: () => Promise.resolve([]),
        });
        break;
      case /.*delayedfailingurl.*/.test(url):
        setTimeout(() => {
          resolve({
            ok: false,
          });
        }, 100);
        break;
      case /.*delayedpassingurl.*/.test(url):
        setTimeout(() => {
          resolve({
            ok: true,
          });
        }, 100);
        break;
      case /.*failingurl.com\/[a-z]{1,11}$/.test(url):
        resolve({
          ok: false,
        });
        break;
      // HTTPS only service
      case /http:.*domain3.*/.test(url):
        error = new Error(NO_SUCH_APP);
        error.code = 'ECONNRESET';
        reject(error);
        break;
      case /eric-sec-access-mgmt.*token/.test(url) && params.get('response_mode') === 'permissions':
        resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                scopes: ['TRACE', 'HEAD', 'DELETE', 'POST', 'GET', 'CONNECT', 'OPTIONS', 'PUT'],
                rsid: '90cda438-55cc-4bbf-ac7a-80c24141b4b3',
                rsname: 'all-in-one-gas_eric-adp-gui-aggregator-service-authproxy',
              },
            ]),
        });
        break;
      case /eric-sec-access-mgmt.*token/.test(url) &&
        params.get('response_mode') === 'decision' &&
        params.get('permission') === '#GET':
      case /eric-sec-access-mgmt.*token/.test(url) &&
        params.get('response_mode') === 'decision' &&
        !params.get('permission'):
      case /iam.ericsson.com.*token/.test(url) && params.get('response_mode') === 'decision':
        resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: true,
            }),
        });
        break;
      case /eric-sec-access-mgmt.*token/.test(url) &&
        params.get('response_mode') === 'decision' &&
        params.get('permission') &&
        params.get('permission') !== '#GET':
        resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: false,
            }),
        });
        break;
      case /eric-sec-access-mgmt.*userinfo/.test(url):
      case /iam.ericsson.com.*userinfo/.test(url):
        resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              sub: 'e9f5b5c9-dae5-433b-be68-7d1f3be2cc06',
              upn: 'gas-user',
            }),
        });
        break;
      default:
        reject(new Error(NO_SUCH_APP));
        break;
    }
  });
