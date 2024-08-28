import { createRequire } from 'module';
import * as chai from 'chai';
import LauncherPage from '../../../../frontend/test_js/page-objects/launcher/Launcher.page.js';

const require = createRequire(import.meta.url);
const dictionary = require('../../../../frontend/src/components/product-view/locale/en-us.json');

const EEA_CONFIG = require('../../../../mock/domain-ui-generic/public/ui-generic-eea/config.json');
const CLOUD_CONFIG = require('../../../../mock/domain-ui-generic/public/ui-generic-ecm/config.json');
const NETWORK_CONFIG = require('../../../../mock/domain-ui-generic/public/ui-generic-enm/config.json');

const { expect } = chai;

const HIDDEN_APP_NAME = 'hidden_app';

const PRODUCTS = [
  {
    name: 'EEA',
    apps: EEA_CONFIG.apps
      .filter((app) => app.groupNames && app.name !== HIDDEN_APP_NAME)
      .map((app) => app.displayName),
  },
  {
    name: 'ENM',
    apps: NETWORK_CONFIG.apps.map((app) => app.displayName),
  },
  {
    name: 'ECM',
    apps: CLOUD_CONFIG.apps.map((app) => app.displayName),
  },
];

describe('Integration Tests', () => {
  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it('can load the page and the landing page contains cards', async () => {
    const productView = await LauncherPage.productView();
    await LauncherPage.waitForProductViewLoading();
    const productCardContainer = await productView.productCardContainer();
    const productCards = await productCardContainer.productCards();
    const titles = await Promise.all(productCards.map((card) => card.title()));
    const groupName = await productCardContainer.groupName();
    expect(groupName.startsWith(dictionary.PRODUCTS)).to.be.true;
    expect(titles).to.have.lengthOf.above(3);
  });

  PRODUCTS.forEach((product) => {
    it(`can load ${product.name} apps successfully`, async () => {
      const productView = await LauncherPage.productView();
      await LauncherPage.waitForProductViewLoading();
      const productCardContainer = await productView.productCardContainer();
      const productCards = await productCardContainer.productCards();
      const cardIndex = (
        await Promise.all(productCards.map((productCard) => productCard.subtitle()))
      ).findIndex((subtitle) => subtitle === product.name);
      await productCards[cardIndex].click();

      const appView = await LauncherPage.appView();
      await LauncherPage.waitForAppViewLoading();
      const cardContainers = await appView.cardContainers();
      const appCardArray = await Promise.all(
        cardContainers.map((cardContainer) => cardContainer.appCards()),
      );
      const appCards = appCardArray.reduce((prev, curr) => [...prev, ...curr], []);
      let APPS = await Promise.all(appCards.map((card) => card.title()));

      const expandableCards = await appView.findExpandableCards();

      if (expandableCards.length !== 0) {
        await Promise.all(
          expandableCards.map(async (card) => {
            APPS = APPS.concat(await card.childNames());
            await card.expand();
          }),
        );
      }

      const breadcrumb = await LauncherPage.breadcrumb();
      const list = await breadcrumb.list();
      await list[0].click();

      expect(APPS.sort()).to.deep.eq(product.apps.sort());
    });
  });
});
