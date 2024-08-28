import { expect } from 'chai';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ContainerPage from '../../page-objects/common/Container.page.js';
import ChartsPage from '../../page-objects/mock/Charts.page.js';
import CheckboxesPage from '../../page-objects/mock/Checkboxes.page.js';
import { openProduct } from '../../utils/utils.js';
import constants from '../../utils/constants.js';

const { MOCK_TITLE } = constants;

describe('Mock Feature', () => {
  const CHARTS_APP_INDEX = 0;
  const CHECKBOX_APP_INDEX = 1;
  const CHART_APP_URL_POSTFIX = '#charts';
  const CHART_COUNT = 3;
  const CHART_FONT = 'ericsson hilda';
  const CARD_COUNT = 10;
  const CHECKBOX_COUNT = 2;

  let systembarGlobalNavigation;
  let checkboxes;

  it('can open mock charts app', async () => {
    await openProduct(MOCK_TITLE);

    const EXPECTED_CARD_TITLE = MOCK_TITLE.toLowerCase()
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

    const appView = await LauncherPage.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();

    await appCards[CHARTS_APP_INDEX].click();
    await ChartsPage.waitForLoading();

    const { baseUrl } = browser.options;
    const actualUrl = await browser.getUrl();
    expect(actualUrl, `URL mismatch`).to.be.eq(`${baseUrl}/${CHART_APP_URL_POSTFIX}`);
  });

  it('can display mock charts properly', async () => {
    const titles = await ChartsPage.chartTitles();
    expect(titles, `Charts number mismatch`).to.have.lengthOf(CHART_COUNT);

    const donutChart = await ChartsPage.donutChart();
    const font = await donutChart.getCSSProperty('font-family');
    expect(font.value, `Chart style mismatch`).to.be.eq(CHART_FONT);
  });

  it(`can open flyout panel from the systembar`, async () => {
    systembarGlobalNavigation = await ContainerPage.systembarGlobalNavigation();
    const launcherIcon = await systembarGlobalNavigation.launcherIcon();
    expect(launcherIcon, 'Launcher icon missing from systembar').not.to.be.null;

    await launcherIcon.click();
    await systembarGlobalNavigation.waitForLoading();
    const flyoutPanel = await systembarGlobalNavigation.flyoutPanel();
    expect(flyoutPanel, 'Flyout panel missing').not.to.be.null;
  });

  it(`can open other mock from the flyout panel`, async () => {
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
    const index = productTitles.findIndex((title) => title === MOCK_TITLE);
    await productCards[index].click();
    await systembarGlobalNavigation.waitForAppView();

    const appView = await systembarGlobalNavigation.appView();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();
    const checkboxesCard = await appCards[CHECKBOX_APP_INDEX];
    await checkboxesCard.click();
    await CheckboxesPage.waitForLoading();
    checkboxes = await CheckboxesPage.checkboxes();
    expect(checkboxes.length, 'Checkbox count mismatch').to.be.eq(CHECKBOX_COUNT);
  });

  it(`can interact with mock component`, async () => {
    const checkboxSquare = await CheckboxesPage.checkboxSquares(0);
    await checkboxSquare.click();
    const checked = await checkboxes[0].getAttribute('checked');
    expect(checked, 'Checkbox not selected').to.be.eq('true');
  });
});
