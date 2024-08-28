import { Rest } from '@adp/ui-common';

import('@webcomponents/scoped-custom-element-registry');

const rest = new Rest();

export const initImportmap = async () => {
  const response = await fetch('deployment-config/frontend-config.json');
  const config = await response.json();
  rest.setBaseContext(config.rest);
  document.body.appendChild(
    Object.assign(document.createElement('script'), {
      type: 'importmap-shim',
      src: `${rest.getBaseContext()}/ui-serve/v1/import-map`,
    }),
  );
};

await initImportmap();

window.esmsInitOptions = {
  shimMode: true,
  fetch: async (url, options) => {
    const urlObj = new URL(url);
    urlObj.searchParams.append('version', '__VERSION__');
    return fetch(urlObj.href, options);
  },
};

import('es-module-shims');
// Import polyfill for firefox and safari
if (!window.URLPattern) {
  import('urlpattern-polyfill');
}
