import { expect } from 'chai';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ContainerPage from '../../page-objects/common/Container.page.js';
import ChartsPage from '../../page-objects/mock/Charts.page.js';
import { openProduct } from '../../utils/utils.js';
import constants from '../../utils/constants.js';
import c from '../../../src/utils/constants.js';

const { MOCK_TITLE } = constants;
const { DEFAULT_TITLE } = c;

describe('Systembar Title', () => {
  let systembarTitle;
  let systembarTitleSlot;

  async function openMockApp() {
    await openProduct(MOCK_TITLE);

    const EXPECTED_CARD_TITLE = MOCK_TITLE.toLowerCase()
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

    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();

    await appCards[0].click();
    await ChartsPage.waitForLoading();
  }

  async function expectTitle(expected) {
    systembarTitleSlot = await systembarTitle.title();
    expect(systembarTitleSlot).not.to.be.null;
    const text = await systembarTitleSlot.getText();
    expect(text).to.equal(expected);
  }

  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it(`has the 'Ericsson' logo and default title in the systembar`, async () => {
    systembarTitle = await ContainerPage.systembarTitle();
    expect(systembarTitle).not.to.be.null;

    const ericssonIcon = await systembarTitle.ericssonIcon();
    expect(ericssonIcon).not.to.be.null;

    await expectTitle(DEFAULT_TITLE);
  });

  it(`has the product's title on app page`, async () => {
    await openMockApp();

    await expectTitle(MOCK_TITLE);
  });

  it('can open product page when clicking systembar title on app page', async () => {
    await systembarTitleSlot.click();
    await LauncherPage.waitForAppViewLoading();
    const actualUrl = await browser.getUrl();

    expect(actualUrl).to.include('productName=');
    await expectTitle(DEFAULT_TITLE);
  });

  it(`can navigate to main page when clicking systembar title on product page`, async () => {
    await systembarTitleSlot.click();
    await LauncherPage.waitForProductViewLoading();
    const actualUrl = await browser.getUrl();

    expect(actualUrl.endsWith('launcher')).to.be.true;
    await expectTitle(DEFAULT_TITLE);
  });

  it(`can navigate to main page when clicking 'Ericsson' logo on app page`, async () => {
    await openMockApp();

    const ericssonIcon = await systembarTitle.ericssonIcon();
    expect(ericssonIcon).not.to.be.null;

    await ericssonIcon.click();
    await LauncherPage.waitForProductViewLoading();
    const actualUrl = await browser.getUrl();

    expect(actualUrl.endsWith('launcher')).to.be.true;
    await expectTitle(DEFAULT_TITLE);
  });
});
