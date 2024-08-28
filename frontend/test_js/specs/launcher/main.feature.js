import { expect } from 'chai';
import { createRequire } from 'module';
import { openProduct } from '../../utils/utils.js';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ContainerPage from '../../page-objects/common/Container.page.js';
import constants from '../../utils/constants.js';

const { EEA_TITLE } = constants;
const require = createRequire(import.meta.url);
const eeaAppConfigs = require('../../../../mock/domain-ui-generic/public/ui-generic-eea/config.json');
const productViewLocale = require('../../../src/components/product-view/locale/en-us.json');
const launcherViewLocale = require('../../../src/apps/launcher/locale/en-us.json');

const actionBarLocale = {
  CATEGORIES: 'Categories',
  ALPHABETICAL: 'A-Z',
  TILES: 'Tiles',
  LIST: 'List',
  FAVORITES: 'Favorites',
};

const dictionary = {
  ...productViewLocale,
  ...actionBarLocale,
  ...launcherViewLocale,
};

describe('Main Feature', () => {
  const CARD_COUNT = 10;

  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it('can load the page and the landing page contains cards', async () => {
    const productView = await LauncherPage.productView();
    const productCardContainer = await productView.productCardContainer();
    const productCards = await productCardContainer.productCards();
    const titles = await Promise.all(productCards.map((card) => card.title()));
    expect(titles).to.have.lengthOf(CARD_COUNT);
  });

  it('can open a product page from a card by clicking anywhere on the card', async () => {
    await openProduct(EEA_TITLE);

    const EXPECTED_CARD_TITLE = EEA_TITLE.toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    await browser.waitUntil(
      async () => {
        const b = await LauncherPage.breadcrumb();
        const h = await b.hierarchy();
        return h.includes(EXPECTED_CARD_TITLE);
      },
      {
        timeoutMsg: 'Failed to wait for card title',
      },
    );

    const breadcrumb = await LauncherPage.breadcrumb();
    const appView = await LauncherPage.appView();
    expect(await breadcrumb.hierarchy()).to.deep.eq([
      dictionary.MENU.LAUNCHER,
      EXPECTED_CARD_TITLE,
    ]);
    expect(await appView.cardContainers()).to.have.lengthOf(3);
  });

  it('shows error page for invalid product', async () => {
    const ExpectedBreadCrumbForEmptyState = [dictionary.MENU.LAUNCHER];
    let breadcrumb = await LauncherPage.breadcrumb();
    const hierarchyBefore = await breadcrumb.hierarchy();

    const currentUrl = await browser.getUrl();
    await browser.url(currentUrl.slice(0, -1));
    await ContainerPage.waitForLoading();

    await LauncherPage.waitForAppViewLoading();
    const appView = await LauncherPage.appView();
    const isEmptyStateMessageVisible = await appView.isEmptyStateVisible();

    let breadCrumbForInvalidProduct;
    await browser.waitUntil(async () => {
      breadcrumb = await LauncherPage.breadcrumb();
      breadCrumbForInvalidProduct = await breadcrumb.hierarchy();
      return hierarchyBefore !== breadCrumbForInvalidProduct;
    });

    await browser.url(currentUrl);
    await ContainerPage.waitForLoading();

    expect(breadCrumbForInvalidProduct).to.deep.eq(ExpectedBreadCrumbForEmptyState);
    expect(isEmptyStateMessageVisible).to.be.true;
  });

  it('app can be expanded with arrow icon', async () => {
    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const helpAppCard = appCards[1];

    const closedHeight = await helpAppCard.height();
    await helpAppCard.expand();
    const openedHeight = await helpAppCard.height();
    await helpAppCard.unExpand();
    const reclosedHeight = await helpAppCard.height();

    expect(closedHeight, 'Height is not the same after closing').to.be.eq(reclosedHeight);
    expect(parseFloat(openedHeight) > parseFloat(closedHeight), 'Height not expanded').to.be.true;
  });

  it('Child apps on expandable card not follow app card favorite state', async () => {
    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const helpAppCard = appCards[1];

    await helpAppCard.setFavorite();

    await helpAppCard.expand();
    const helpChildApps = await helpAppCard.childApps();
    const allChildAppsAreNonFavorite = (
      await Promise.all(helpChildApps.map((childApp) => childApp.isFavorite()))
    ).every((isFavorite) => !isFavorite);

    await helpAppCard.unsetFavorite();

    expect(
      allChildAppsAreNonFavorite,
      'Child apps are not marked as favorite under favorite app card',
    ).to.be.true;
  });

  it('App card is marked partially-favorite if at least one child app is favorite', async () => {
    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const helpAppCard = appCards[1];

    await helpAppCard.unsetFavorite();
    await helpAppCard.expand();
    const helpChildApps = await helpAppCard.childApps();

    await helpChildApps[0].setFavorite();
    const partialFavoriteWithOneFavoriteChildApp = await helpAppCard.isPartialFavorite();

    await Promise.all(helpChildApps.map((childApp) => childApp.setFavorite()));
    const nonFavoriteWithAllFavoriteChildApps = !(await helpAppCard.isFavorite());

    await Promise.all(helpChildApps.map((childApp) => childApp.unsetFavorite()));

    expect(
      partialFavoriteWithOneFavoriteChildApp,
      'App card is set partially-favorite with one child app marked favorite',
    ).to.be.true;
    expect(
      nonFavoriteWithAllFavoriteChildApps,
      'App card is not set favorite with all child apps marked favorite',
    ).to.be.true;
  });

  it('can open apps from app cards by clicking anywhere on the card', async () => {
    let appView = await LauncherPage.appView();
    let cardContainers = await appView.cardContainers();
    let appCards = await cardContainers[1].appCards();

    const troubleshootingAppConfigs = eeaAppConfigs.apps.filter((app) =>
      (app.groupNames || []).includes('subscriber_troubleshooting'),
    );

    const handleUrl = async (index) => {
      appView = await LauncherPage.appView();
      cardContainers = await appView.cardContainers();
      appCards = await cardContainers[1].appCards();
      await appCards[index].click();
      const expectedUrl = troubleshootingAppConfigs[index].url;
      const actualUrl = await browser.getUrl();
      await browser.back();
      await LauncherPage.waitForLoading();

      expect(actualUrl, `Jump Url mismatch for app: ${appCards[index].title}`).to.have.string(
        expectedUrl,
      );
    };

    await appCards.reduce(async (previousPromise, item, currentIndex) => {
      await previousPromise;
      return handleUrl(currentIndex);
    }, Promise.resolve());
  });

  it('should show different number of groups when changing the grouping type to A-Z', async () => {
    await openProduct(EEA_TITLE);

    const appView = await LauncherPage.appView();
    let cardContainers = await appView.cardContainers();
    const option = dictionary.ALPHABETICAL;
    const numberOfCategoryGroups = cardContainers.length;
    await appView.selectGroupingOption(option);
    cardContainers = await appView.cardContainers();
    const numberOfAlphabeticGroups = cardContainers.length;
    expect(numberOfAlphabeticGroups).not.to.be.eq(numberOfCategoryGroups);
  });

  it('can display favorite apps only', async () => {
    const getNumberOfDisplayedApps = async (cardContainersElement) => {
      const appCardArray = await Promise.all(
        cardContainersElement.map((cardContainer) => cardContainer.appCards()),
      );
      return appCardArray.map((cards) => cards.length).reduce((acc, curr) => acc + curr);
    };

    const appView = await LauncherPage.appView();
    const expectedNumberOfFavoriteApps = 1;
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    await appCards[0].setFavorite();
    const numberOfAllApps = await getNumberOfDisplayedApps(await appView.cardContainers());
    const favoritePill = await appView.favoritePill();
    await favoritePill.click();
    const numberOfFavoriteApps = await getNumberOfDisplayedApps(await appView.cardContainers());

    expect(favoritePill).not.to.be.null;
    expect(numberOfAllApps).to.be.greaterThan(numberOfFavoriteApps);
    expect(numberOfFavoriteApps).to.eq(expectedNumberOfFavoriteApps);
  });
});
