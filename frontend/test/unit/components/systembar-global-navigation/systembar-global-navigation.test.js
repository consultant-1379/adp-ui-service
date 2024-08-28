import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { SystembarGlobalNavigation } from '../../../../src/components/systembar-global-navigation/systembar-global-navigation.js';
import isRendered from '../../../test-utils/isRendered.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

async function renderSystembarComponent() {
  const htmlTemplate = html`
    <e-systembar-global-navigation></e-systembar-global-navigation>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

describe('SystembarGlobalNavigation Component Tests', () => {
  let uiSettingsUtilGetStub;

  before(async () => {
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    SystembarGlobalNavigation.register();
  });

  after(async () => {
    uiSettingsUtilGetStub.restore();
  });

  describe('Basic component setup', () => {
    it('should create a new <e-systembar-global-navigation>', async () => {
      const systembarComponent = await renderSystembarComponent();
      const { shadowRoot } = systembarComponent;

      expect(shadowRoot, 'Shadow root does not exist').to.exist;
      expect(systembarComponent).to.not.null;
    });
  });
});
