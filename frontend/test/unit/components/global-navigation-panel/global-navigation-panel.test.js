import { expect, fixture, html } from '@open-wc/testing';
import lodash from 'lodash';
import { waitUntil } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import { GlobalNavigationPanel } from '../../../../src/components/global-navigation-panel/global-navigation-panel.js';
import eeaConfig from '../../../test-utils/mockdata/ericsson.expert.analytics.config.json' assert { type: 'json' };
import isRendered from '../../../test-utils/isRendered.js';
import CONSTANT from '../../../test-utils/constants.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

const { groups } = eeaConfig;

async function renderNavigationComponent(productName = null) {
  const htmlTemplate = html`
    <e-global-navigation-panel .productName=${productName}></e-global-navigation-panel>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

const getCards = (cardContainer) => {
  const cards = cardContainer.shadowRoot.querySelectorAll('e-product-card');
  return Array.from(cards);
};

describe('GlobalNavigationPanel Component Tests', () => {
  let cardContainer;
  let actionBar;
  let systembarComponent;
  let launcherComponent;
  let uiSettingsUtilGetStub;

  before(async () => {
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    GlobalNavigationPanel.register();
  });

  after(async () => {
    uiSettingsUtilGetStub.restore();
  });
  describe('Basic component setup', () => {
    it('should open the product view with 1 product + 1 system', async () => {
      systembarComponent = await renderNavigationComponent();
      launcherComponent = systembarComponent.shadowRoot.querySelector('e-launcher-component');

      await waitUntil(
        () => {
          const productView = launcherComponent.shadowRoot.querySelector('e-product-view');
          if (lodash.isNull(productView)) {
            return false;
          }
          actionBar = productView.shadowRoot.querySelector('e-action-bar');
          if (lodash.isNull(actionBar)) {
            return false;
          }
          cardContainer = productView.shadowRoot.querySelector('e-card-container');
          return !lodash.isNull(cardContainer) && getCards(cardContainer).length === 2;
        },
        'A product card should appear in time',
        { interval: 50, timeout: CONSTANT.CHILDREN_WAIT_TIMEOUT },
      );

      expect(actionBar).not.to.be.null;
      expect(getCards(cardContainer)).to.have.lengthOf(2);
    });

    it('should show the navigation controls if a product is open', async () => {
      const products = groups.filter((g) => g.type === 'product' || g.type === 'system');
      const eeaProduct = products[0];
      systembarComponent = await renderNavigationComponent(eeaProduct.name);

      const backButton = systembarComponent.shadowRoot.querySelector('#back-button');
      launcherComponent = systembarComponent.shadowRoot.querySelector('e-launcher-component');
      let appView;
      await waitUntil(
        () => {
          appView = launcherComponent.shadowRoot.querySelector('e-app-view');
          return !lodash.isNull(appView);
        },
        'App card view should appear in time',
        { interval: 50, timeout: CONSTANT.CHILDREN_WAIT_TIMEOUT },
      );
      expect(backButton).to.not.be.null;
      expect(appView).to.not.be.null;
    });
  });
});
