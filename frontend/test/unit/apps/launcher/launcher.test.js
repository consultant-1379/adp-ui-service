/**
 * Integration tests for <e-launcher>
 */
import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { aTimeout } from '@open-wc/testing-helpers';
import Launcher from '../../../../src/apps/launcher/launcher.js';
import configManager from '../../../../src/config/configManager.js';
import isRendered from '../../../test-utils/isRendered.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

async function renderApp() {
  const htmlTemplate = html`
    <e-launcher></e-launcher>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

describe('Launcher Application Tests', () => {
  let uiSettingsUtilGetStub;
  before(async () => {
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    await configManager.initConfig();
    Launcher.register();
  });

  after(async () => {
    uiSettingsUtilGetStub.restore();
  });

  describe('Basic application setup', () => {
    it('should create a new <e-launcher>', async () => {
      const launcher = await renderApp();
      const { shadowRoot } = launcher;

      expect(shadowRoot, 'Shadow root does not exist').to.exist;
      expect(launcher).to.not.null;
    });

    it('reaches "loaded" state', async () => {
      const launcher = await renderApp();
      let tries = 0;
      /* eslint-disable no-await-in-loop */
      while (launcher.getAttribute('loaded') === undefined && tries < 10) {
        await aTimeout(100);
        tries += 1;
      }
      /* eslint-enable no-await-in-loop */

      expect(launcher.getAttribute('loaded')).to.not.undefined;
    });
  });
});
