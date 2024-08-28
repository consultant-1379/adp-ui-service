import { expect, fixture, html } from '@open-wc/testing';
import { ProductView } from '../../../../src/components/product-view/product-view.js';
import testConfig from '../../../test-utils/mockdata/test-app.config.json' assert { type: 'json' };
import CONSTANTS from '../../../../src/utils/constants.js';
import dict from '../../../../src/components/product-view/locale/en-us.json' assert { type: 'json' };
import isRendered from '../../../test-utils/isRendered.js';
import { stubRouter } from '../../../test-utils/utils.js';

const { LANDING_CARD_COUNT, PRODUCT_TYPE } = CONSTANTS;

const HIDDEN_PRODUCT_TITLE = 'Hidden product';

async function renderProductView({ groups, recentApps = [], favoriteApps = [] }) {
  const htmlTemplate = html`
    <e-product-view
      .groups=${groups}
      .recentApps=${recentApps}
      .favoriteApps=${favoriteApps}
    ></e-product-view>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

function findSectionByTitle(productView, sectionTitle) {
  const categories = Array.from(productView.shadowRoot.querySelectorAll('e-card-container'));
  return categories.find(
    (category) =>
      category.shadowRoot.querySelector('.groupContainer .groupName').textContent === sectionTitle,
  );
}

function getNumberOfCardsInSection(section) {
  return section.shadowRoot.querySelectorAll('e-app-card').length;
}

describe('ProductView Component Tests', () => {
  const { groups, apps } = testConfig;
  let productView;

  before(() => {
    stubRouter();
    ProductView.register();
  });

  describe('Basic application setup', () => {
    let titles;

    it('should show all products', async () => {
      productView = await renderProductView({ groups });
      const expectedGroups = groups
        .filter((group) => group.type === PRODUCT_TYPE)
        .filter((group) => !group.hidden)
        .map((product) => product.displayName)
        .sort((a, b) => a.localeCompare(b));

      const productCardContainer = productView.shadowRoot.querySelector(
        'e-card-container[is-products]',
      );
      titles = Array.from(productCardContainer.shadowRoot.querySelectorAll('e-product-card')).map(
        (card) => card.displayName,
      );

      expect(titles).to.deep.eq(expectedGroups);
    });

    it('should not show hidden groups', () => {
      expect(titles.includes(HIDDEN_PRODUCT_TITLE)).to.be.false;
    });

    describe('Recent and favorite tests', () => {
      const expectedNumberOfAppsInSection = 1;

      [
        {
          title: 'RECENT_APPS',
          parameterName: 'recentApps',
        },
        {
          title: 'FAVORITE_APPS',
          parameterName: 'favoriteApps',
        },
      ].forEach((productSection) => {
        it(`should not display ${productSection.title} section when there are no apps`, () => {
          const section = findSectionByTitle(productView, dict[productSection.title]);
          expect(section).to.be.undefined;
        });

        it(`should display ${productSection.title} section when there is at least one app`, async () => {
          const specialApps = apps.slice(0, expectedNumberOfAppsInSection);
          productView = await renderProductView({
            groups,
            [productSection.parameterName]: specialApps,
          });
          const section = findSectionByTitle(productView, dict[productSection.title]);
          const numberOfAppsInSection = getNumberOfCardsInSection(section);
          expect(section).to.not.be.undefined;
          expect(numberOfAppsInSection).to.eq(expectedNumberOfAppsInSection);
        });
      });

      it('should limit the number of cards in favorite section', async () => {
        productView = await renderProductView({ groups, favoriteApps: apps });
        const section = findSectionByTitle(productView, dict.FAVORITE_APPS);
        const numberOfAppsInSection = getNumberOfCardsInSection(section);
        expect(apps).to.have.lengthOf.above(LANDING_CARD_COUNT);
        expect(section).to.not.be.undefined;
        expect(numberOfAppsInSection).to.eq(LANDING_CARD_COUNT);
      });
    });
  });

  describe('Empty state handling', () => {
    before(async () => {
      productView = await renderProductView({ groups: [] });
    });

    it('should display message if no apps configured', () => {
      const { shadowRoot } = productView;
      const emptyTextContainer = shadowRoot.querySelector('.empty-state .message p');
      const emptyText = emptyTextContainer.textContent;
      const cardCount = Array.from(shadowRoot.querySelectorAll('e-card-container')).reduce(
        (acc, section) => acc + getNumberOfCardsInSection(section),
        0,
      );
      expect(emptyTextContainer).to.not.null;
      expect(emptyText).to.eq(dict.NO_APPS);
      expect(cardCount).to.be.eq(0);
    });
  });
});
