import { createRequire } from 'module';
import { expect } from 'chai';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ContainerPage from '../../page-objects/common/Container.page.js';

const require = createRequire(import.meta.url);
const launcherPageLocale = require('../../../src/apps/launcher/locale/en-us.json');

const ALL_APPS_URL_ENDING = 'all';

describe('Navigation Menu', () => {
  describe('Navigation with route based navigation tree ', () => {
    let navigationMenu;

    afterEach(async () => {
      await LauncherPage.clickAndWaitToHideMenuPanel();
    });

    after(async () => {
      // workaround because of random timeout of LauncherPage.waitForLoading()
      // after LauncherPage.open() is invoked after browser.url() call(s)
      await browser.reloadSession();
    });

    it('Can navigate clicking on tree items', async () => {
      await browser.url(`${browser.options.baseUrl}/#parent-a/child-1`);
      await ContainerPage.waitForLoading();

      navigationMenu = await LauncherPage.clickAndWaitToDisplayMenuPanel();
      const navItems = await navigationMenu.navigationItems();
      const actualUrl = await browser.getUrl();

      expect(actualUrl).to.include('child-1');
      expect(navItems.length).to.eq(7);
    });

    it('Can handle single app', async () => {
      await browser.url(`${browser.options.baseUrl}/#charts`);
      await ContainerPage.waitForLoading();

      navigationMenu = await LauncherPage.clickAndWaitToDisplayMenuPanel();
      const navItems = await navigationMenu.navigationItems();

      expect(navItems.length).to.eq(1);
    });
  });

  describe('Navigation with custom navigation tree', () => {
    let navigationMenu;

    beforeEach(async () => {
      await LauncherPage.open();
      await LauncherPage.waitForLoading();
      navigationMenu = await LauncherPage.clickAndWaitToDisplayMenuPanel();
    });

    it('Launcher root element is the default active element on page load', async () => {
      const activeNavigationItem = await navigationMenu.activeNavigationItem();

      expect(await activeNavigationItem.getAttribute('label')).to.eq(
        launcherPageLocale.MENU.LAUNCHER,
      );
    });

    it('can open the "All apps" view from the navigation panel', async () => {
      const titles = await navigationMenu.navigationTitles();
      const index = titles.findIndex((title) => title === launcherPageLocale.MENU.ALL);

      await navigationMenu.openNavigationItem(0);
      await navigationMenu.openRootElement();
      await navigationMenu.openNavigationItem(index);

      const actualUrl = await browser.getUrl();

      expect(titles).to.include(launcherPageLocale.MENU.ALL);
      expect(actualUrl.endsWith(ALL_APPS_URL_ENDING)).to.be.true;
    });

    it('opening a product from a card activates navigation items', async () => {
      await navigationMenu.openNavigationItem(0);
      const productView = await LauncherPage.productView();
      await LauncherPage.waitForProductViewLoading();
      const productCardContainer = await productView.productCardContainer();
      const productCards = await productCardContainer.productCards();

      const cardTitle = await productCards[1].title();
      await productCards[1].click();
      const activeNavigationItem = await navigationMenu.activeNavigationItem();

      expect(await activeNavigationItem.getAttribute('label')).to.eq(cardTitle);
    });
  });
});
