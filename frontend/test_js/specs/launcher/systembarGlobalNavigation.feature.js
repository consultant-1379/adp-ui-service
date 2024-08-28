import { expect } from 'chai';
import { createRequire } from 'module';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ContainerPage from '../../page-objects/common/Container.page.js';
import constants from '../../utils/constants.js';

const { EEA_TITLE, MOCK_TITLE } = constants;
const require = createRequire(import.meta.url);
const eeaConfig = require('../../../test/test-utils/mockdata/ericsson.expert.analytics.config.json');

const { apps } = eeaConfig;

const CARD_COUNT = 10;
const EEA_APP_CARD_COUNT = 9;
const MOCK_APP_CARD_COUNT = 3;

describe('Systembar Global Navigation', () => {
  let systembarGlobalNavigation;
  let launcherIcon;
  let cardTitle;

  async function openProduct(productName) {
    const productView = await systembarGlobalNavigation.productView();
    const productCardContainer = await productView.productCardContainer();
    await browser.waitUntil(
      async () => {
        const pCs = await productCardContainer.productCards();
        return pCs.length === CARD_COUNT;
      },
      {
        timeoutMsg: 'Failed to wait for the expected card count',
      },
    );
    const productCards = await productCardContainer.productCards();
    const productTitles = await Promise.all(productCards.map((card) => card.title()));
    const index = productTitles.findIndex((title) => title === productName);
    await productCards[index].click();
    await systembarGlobalNavigation.waitForAppView();
  }

  const getCardDetails = async () => {
    const appView = await systembarGlobalNavigation.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const cardMenu = await appCards[0].cardMenu();
    const title = await appCards[0].title();
    return { cardMenu, title };
  };

  const openCardMenu = async () => {
    const { cardMenu, title } = await getCardDetails();
    const menuIcon = await cardMenu.menuIcon();
    await menuIcon.click();
    return { cardMenu, title };
  };

  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
    systembarGlobalNavigation = await ContainerPage.systembarGlobalNavigation();
  });

  it(`has the 'app-launcher' icon in the Systembar`, async () => {
    launcherIcon = await systembarGlobalNavigation.launcherIcon();
    expect(launcherIcon).not.to.be.null;
  });

  it('can open the Global Navigation panel which has the Launcher in it', async () => {
    await launcherIcon.click();
    await systembarGlobalNavigation.waitForLoading();

    const productView = await systembarGlobalNavigation.productView();
    const productCardContainer = await productView.productCardContainer();
    const productCards = await productCardContainer.productCards();
    const titles = await Promise.all(productCards.map((card) => card.title()));

    expect(titles).to.have.lengthOf(CARD_COUNT);
  });

  it('can open the App view if a Product card is clicked', async () => {
    await openProduct(EEA_TITLE);
    const appView = await systembarGlobalNavigation.appView();
    const cardContainers = await appView.cardContainers();
    const appCardsArray = await Promise.all(
      cardContainers.map((cardContainer) => cardContainer.appCards()),
    );
    const cardCount = appCardsArray.reduce((pre, curr) => pre + curr.length, 0);

    expect(cardCount).to.be.eq(EEA_APP_CARD_COUNT);
  });

  it('can set an app as favorite from the card menu and it is in sync with the Product view', async () => {
    const { cardMenu, title } = await openCardMenu();
    const favoriteMenuItem = await cardMenu.favoriteMenuItem();
    await favoriteMenuItem.click();
    const backButton = await systembarGlobalNavigation.backButton();
    await backButton.click();
    await systembarGlobalNavigation.waitForProductView();

    const productView = await systembarGlobalNavigation.productView();
    const favoriteCardContainer = await productView.favoriteCardContainer();
    const favoriteAppCards = await favoriteCardContainer.appCards();
    await browser.waitUntil(
      async () => {
        const text = await favoriteAppCards[0].title();
        return text !== '';
      },
      {
        timeoutMsg: 'Failed to wait for favorite app card title',
      },
    );

    expect(await Promise.all(favoriteAppCards.map((card) => card.title()))).to.include(title);

    const closePanel = await systembarGlobalNavigation.closePanel();
    await closePanel.click();

    const launcherPageProductView = await LauncherPage.productView();
    const pageFavCardContainer = await launcherPageProductView.favoriteCardContainer();
    const pageFavApps = await pageFavCardContainer.appCards();

    cardTitle = title;
    expect(await Promise.all(pageFavApps.map((card) => card.title()))).to.include(title);
  });

  it(`can unset an app's favorite status on the Product page and it is in sync with the systembar`, async () => {
    let launcherPageProductView = await LauncherPage.productView();
    let pageFavCardContainer = await launcherPageProductView.favoriteCardContainer();
    const appCards = await pageFavCardContainer.appCards();
    const cardindex = (await Promise.all(appCards.map((appCard) => appCard.title()))).findIndex(
      (title) => title === cardTitle,
    );
    await appCards[cardindex].unsetFavorite();

    launcherPageProductView = await LauncherPage.productView();
    pageFavCardContainer = await launcherPageProductView.favoriteCardContainer();

    await launcherIcon.click();
    await systembarGlobalNavigation.waitForLoading();
    const productView = await systembarGlobalNavigation.productView();
    const favoriteCardContainer = await productView.favoriteCardContainer();

    expect(favoriteCardContainer).to.be.undefined;
    expect(pageFavCardContainer).to.be.undefined;
  });

  it('can show the tooltip from the card menu', async () => {
    await openProduct(EEA_TITLE);
    const { cardMenu, title } = await openCardMenu();
    const tooltipMenuItem = await cardMenu.tooltipMenuItem();
    await tooltipMenuItem.click();

    const appData = apps.find((app) => app.displayName === title);
    const tooltip = await cardMenu.tooltip();
    const tooltipTitle = await cardMenu.tooltipTitle();
    const tooltipDescription = await cardMenu.tooltipDescription();

    expect(tooltip).to.exist;
    expect(tooltipTitle).to.eq(appData.descriptionShort);
    expect(tooltipDescription).to.eq(appData.descriptionLong);
  });

  it('can hide the tooltip if the card menu is clicked again (closed)', async () => {
    let { cardMenu } = await getCardDetails();
    const menuIcon = await cardMenu.menuIcon();
    await menuIcon.click();
    const isMenuHidden = !(await cardMenu.isMenuDisplayed());
    const isTooltipExistingWhenClosed = await cardMenu.isTooltipExisting();

    ({ cardMenu } = await openCardMenu());
    const isTooltipExistingWhenReopened = await cardMenu.isTooltipExisting();

    expect(isMenuHidden).to.be.true;
    expect(isTooltipExistingWhenClosed).to.be.false;
    expect(isTooltipExistingWhenReopened).to.be.false;
  });

  it('can hide the tooltip if the card menu is closed by clicking elsewhere', async () => {
    let { cardMenu } = await getCardDetails();
    const tooltipMenuItem = await cardMenu.tooltipMenuItem();
    await tooltipMenuItem.click();
    const isTooltipExistingBefore = await cardMenu.isTooltipExisting();

    const appView = await systembarGlobalNavigation.appView();
    const searchComponent = await appView.searchComponent();
    const icon = await searchComponent.icon();
    await icon.click();
    await icon.click();

    const isMenuHidden = !(await cardMenu.isMenuDisplayed());
    const isTooltipExistingWhenClosed = await cardMenu.isTooltipExisting();

    ({ cardMenu } = await openCardMenu());
    const isTooltipExistingWhenReopened = await cardMenu.isTooltipExisting();

    expect(isTooltipExistingBefore).to.be.true;
    expect(isMenuHidden).to.be.true;
    expect(isTooltipExistingWhenClosed).to.be.false;
    expect(isTooltipExistingWhenReopened).to.be.false;
  });

  it('can open the Launcher page by clicking the portal link at the bottom of the flyout.', async () => {
    const portalLink = await systembarGlobalNavigation.portalLink();
    await portalLink.click();
    await LauncherPage.waitForLoading();

    systembarGlobalNavigation = await ContainerPage.systembarGlobalNavigation();
    const flyoutPanel = await systembarGlobalNavigation.flyoutPanel();
    const isFlyoutHiddenAfterRefresh = !(await flyoutPanel.isDisplayed());

    expect(isFlyoutHiddenAfterRefresh).to.be.true;
  });

  it('can close the flyout if outside of the flyout is clicked', async () => {
    launcherIcon = await systembarGlobalNavigation.launcherIcon();
    await launcherIcon.click();
    await systembarGlobalNavigation.waitForLoading();
    const flyoutPanel = await systembarGlobalNavigation.flyoutPanel();
    const isFlyoutDisplayedBefore = await flyoutPanel.isDisplayed();
    const container = await LauncherPage.systemBar.container();
    await container.click();

    await browser.waitUntil(
      async () => {
        const isDisplayed = await flyoutPanel.isDisplayed();
        return !isDisplayed;
      },
      {
        timeoutMsg: 'Failed to load flyout panel',
      },
    );

    const isFlyoutDisplayedAfter = await flyoutPanel.isDisplayed();

    expect(isFlyoutDisplayedBefore).to.be.true;
    expect(isFlyoutDisplayedAfter).to.be.false;
  });

  it('app number of Mock Applications is 3', async () => {
    await launcherIcon.click();
    await systembarGlobalNavigation.waitForLoading();
    await openProduct(MOCK_TITLE);
    const appView = await systembarGlobalNavigation.appView();
    const cardContainers = await appView.cardContainers();

    const appCardsArray = await Promise.all(
      cardContainers.map((cardContainer) => cardContainer.appCards()),
    );
    const cardCount = appCardsArray.reduce((pre, curr) => pre + curr.length, 0);

    expect(cardCount).to.be.eq(MOCK_APP_CARD_COUNT);
  });

  it('can open hidden app by url', async () => {
    await browser.url('/ui/#hidden-mock');
    await ContainerPage.waitForLoading();

    const appText = await $('eui-container')
      .shadow$('main')
      .$('e-mock-portal')
      .shadow$('#hidden')
      .getHTML(false);

    expect(appText).to.eq('This is a hidden app');
  });
});
