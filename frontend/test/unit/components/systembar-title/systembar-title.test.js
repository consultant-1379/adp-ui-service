import { expect, fixture, html } from '@open-wc/testing';
import { SystembarTitle } from '../../../../src/components/systembar-title/systembar-title.js';
import isRendered from '../../../test-utils/isRendered.js';
import c from '../../../../src/utils/constants.js';

const { DEFAULT_TITLE } = c;

const CONSTANTS = {
  PRODUCT_ACTION: '.product-action',
  TEST_NAME: 'test-app',
  TEST_TITLE: 'Test Title',
};

async function renderSystembarTitle(productName = null, productDisplayName = null) {
  const htmlTemplate = html`
    <e-systembar-title
      .productName=${productName}
      .productDisplayName=${productDisplayName}
    ></e-systembar-title>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

describe('SystembarTitle Component Tests', () => {
  before(() => {
    SystembarTitle.register();
  });

  describe('Basic component setup', () => {
    it('should render <e-systembar-title> with default title', async () => {
      const systembarTitle = await renderSystembarTitle();
      const productTitle = systembarTitle.shadowRoot.querySelector(
        CONSTANTS.PRODUCT_ACTION,
      ).innerText;

      expect(systembarTitle.shadowRoot).to.exist;
      expect(productTitle).to.eq(DEFAULT_TITLE);
    });

    it('should render <e-systembar-title> with given title', async () => {
      const systembarTitle = await renderSystembarTitle(CONSTANTS.TEST_NAME, CONSTANTS.TEST_TITLE);
      const productTitle = systembarTitle.shadowRoot.querySelector(
        CONSTANTS.PRODUCT_ACTION,
      ).innerText;

      expect(systembarTitle.shadowRoot).to.exist;
      expect(productTitle).to.eq(CONSTANTS.TEST_TITLE);
    });
  });
});
