/**
 * Integration tests for <e-error-app>
 */
import { expect, fixture, html } from '@open-wc/testing';
import ErrorApp from '../../../../src/apps/error-app/error-app.js';
import isRendered from '../../../test-utils/isRendered.js';
import defaultI18n from '../../../../src/apps/error-app/locale/en-us.json' assert { type: 'json' };

const SESSION_EXPIRED = 'session-expired';

const cssPaths = {
  errorMessageDialog: 'e-error-message-dialog',
  dialog: 'eui-dialog',
};

async function renderApp(metaData) {
  const htmlTemplate = html`
    <e-error-app .metaData=${metaData}></e-error-app>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

describe('Error Application Tests', () => {
  before(async () => {
    ErrorApp.register();
  });

  describe('Basic application setup', () => {
    it('should create a new Error app for session expired', async () => {
      const errorApp = await renderApp({
        options: {
          error: SESSION_EXPIRED,
        },
      });
      const { shadowRoot } = errorApp;
      const errorMessageDialog = await shadowRoot.querySelector(cssPaths.errorMessageDialog);
      const dialog = await errorMessageDialog.shadowRoot.querySelector(cssPaths.dialog);

      expect(dialog.label).to.equal(defaultI18n.SESSION_EXPIRED.LABEL);
    });
  });
});
