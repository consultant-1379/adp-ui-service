import * as chai from 'chai';
import LauncherPage from '../../../../frontend/test_js/page-objects/launcher/Launcher.page.js';

const { expect } = chai;

describe('Integration Tests for Browser Cache', () => {
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
    expect(titles).to.have.lengthOf.above(3);
  });
});
