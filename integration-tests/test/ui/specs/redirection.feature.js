import { createRequire } from 'module';
import * as chai from 'chai';
import LauncherPage from '../../../../frontend/test_js/page-objects/launcher/Launcher.page.js';

const require = createRequire(import.meta.url);
const dictionary = require('../../../../frontend/src/components/product-view/locale/en-us.json');

const { expect } = chai;

describe('Redirection Tests', () => {
  it('can redirect request from /ui to /ui/ to load the UI', async () => {
    await browser.url(browser.options.baseUrl);
    await LauncherPage.waitForLoading();
    const productView = await LauncherPage.productView();
    await LauncherPage.waitForProductViewLoading();
    const productCardContainer = await productView.productCardContainer();
    const groupName = await productCardContainer.groupName();
    expect(groupName.startsWith(dictionary.PRODUCTS)).to.be.true;
  });
});
