import { createRequire } from 'module';
import * as chai from 'chai';
import ChartsPage from '../../../../frontend/test_js/page-objects/mock/Charts.page.js';
import LauncherPage from '../../../../frontend/test_js/page-objects/launcher/Launcher.page.js';
import constants from '../../../../frontend/test_js/utils/constants.js';
import { getProductIndex } from '../../../../frontend/test_js/utils/utils.js';

const { expect } = chai;

const require = createRequire(import.meta.url);
const dictionary = require('../../../../frontend/src/components/product-view/locale/en-us.json');
const MOCK_CONFIG = require('../../../../mock/domain-ui-generic/public/esm-service-1/config/config.json');

const { MOCK_TITLE } = constants;

const CHARTS_APP_INDEX = 0;
const CHART_COUNT = 3;

describe('Mock Integration Tests', () => {
  it('can open and display mock application', async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();

    const productView = await LauncherPage.productView();
    const productCardContainer = await productView.productCardContainer();
    const productCards = await productCardContainer.productCards();
    const groupName = await productCardContainer.groupName();
    expect(groupName.startsWith(dictionary.PRODUCTS)).to.be.true;

    const titles = await Promise.all(productCards.map((card) => card.title()));
    const mockTitle = titles.filter((title) => title.includes(MOCK_CONFIG.groups.displayName));
    expect(mockTitle).not.to.be.null;

    const index = await getProductIndex(MOCK_TITLE);
    await productCards[index].click();

    const appView = await LauncherPage.appView();
    await LauncherPage.waitForAppViewLoading();
    const cardContainers = await appView.cardContainers();
    const appCards = await cardContainers[0].appCards();

    await appCards[CHARTS_APP_INDEX].click();

    await ChartsPage.waitForLoading();
    const chartTitles = await ChartsPage.chartTitles();
    expect(chartTitles, `Charts number mismatch`).to.have.lengthOf(CHART_COUNT);
  });
});
