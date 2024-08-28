import { expect } from 'chai';
import { createRequire } from 'module';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import constants from '../../utils/constants.js';
import { getProductIndex } from '../../utils/utils.js';

const { EEA_TITLE } = constants;
const require = createRequire(import.meta.url);
const dictionary = require('../../../src/apps/launcher/locale/en-us.json');

const eeaAppConfigs = require('../../../../mock/domain-ui-generic/public/ui-generic-eea/config.json');

const pressTabNTimes = async (n) => Promise.all([...Array(n)].map(() => browser.keys('Tab')));

describe('Keyboard Navigation', () => {
  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it('can open the product page from an active card (in focus) by pressing the Enter key', async () => {
    const productView = await LauncherPage.productView();
    const clickedItemIndex = await getProductIndex(EEA_TITLE);

    // initial focus on page
    const searchComponent = await productView.searchComponent();
    const textField = await searchComponent.textField();
    await textField.click();
    await browser.keys(['Escape']);
    // navigate to the "clickedItemIndex" indexed product card by pressing the Tab key
    await pressTabNTimes(2 * (clickedItemIndex + 1));

    await browser.keys('Enter');

    const EXPECTED_CARD_TITLE = EEA_TITLE.toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    await LauncherPage.waitForAppViewLoading();
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

  it('should toggle the "Show favorites only" pill by pressing Space key when it is focused', async () => {
    await browser.keys(['Tab']);
    const appView = await LauncherPage.appView();
    let cardContainers = await appView.cardContainers();
    const numberOfAppGroups = cardContainers.length;
    // show favorites only
    await browser.keys(['Space']);
    cardContainers = await appView.cardContainers();
    const numberOfFavoriteGroups = cardContainers.length;
    // reset to show all apps
    await browser.keys(['Space']);

    expect(numberOfFavoriteGroups).not.to.be.eq(numberOfAppGroups);
  });

  it('app description can be toggled by pressing the Space key', async () => {
    const appCardIndex = 2;
    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const expendableCard = appCards[appCardIndex - 1];
    // navigate from favorite pill to the app card with the index of appCardIndex
    const neededTabPressCount = 2 + 2 * appCardIndex; // number of Tabs: from favoriteSelector to layoutSelector + to reach Card with given index
    await pressTabNTimes(neededTabPressCount);

    const closedHeight = await expendableCard.height();
    await browser.keys('Space'); // open description
    const openedHeight = await expendableCard.height();
    await browser.keys('Space'); // close description
    const reclosedHeight = await expendableCard.height();

    expect(closedHeight, 'Height is not the same after closing').to.be.eq(reclosedHeight);
    expect(parseFloat(openedHeight) > parseFloat(closedHeight), 'Height not expanded').to.be.true;
  });

  it('can navigate between apps of different app groups by pressing Tab key', async () => {
    const isMemberOfGroupByTitle = (title, groupName) =>
      !!eeaAppConfigs.apps
        .filter((app) => (app.groupNames || []).includes(groupName))
        .find((config) => config.displayName === title);

    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const lengthOfFirstAppGroup = appCards.length;
    // navigate to the second App group
    await pressTabNTimes(lengthOfFirstAppGroup * 2);

    const currentCards = await cardContainers[1].appCards();
    const currentTitle = await currentCards[0].title();
    const gotMemberOfSecondGroup = isMemberOfGroupByTitle(
      currentTitle,
      'subscriber_troubleshooting',
    );

    expect(gotMemberOfSecondGroup).to.be.true;
  });

  it('can open an app from a focused app card by pressing the Enter key', async () => {
    const cardIndex = 1;
    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[1].appCards();

    const troubleshootingAppConfigs = eeaAppConfigs.apps.filter((app) =>
      (app.groupNames || []).includes('subscriber_troubleshooting'),
    );
    const card = appCards[cardIndex];

    await browser.keys('Enter');
    const expectedUrl = troubleshootingAppConfigs[cardIndex].url;
    const actualUrl = await browser.getUrl();

    await browser.back();
    await LauncherPage.waitForLoading();

    expect(actualUrl, `Jump Url mismatch for app: ${card.title}`).to.have.string(expectedUrl);
  });
});
