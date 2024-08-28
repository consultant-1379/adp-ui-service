import { expect } from 'chai';

import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ContainerPage from '../../page-objects/common/Container.page.js';

const NOVA_EXPLORER_STANDALONE = {
  displayName: 'Nova Explorer Standalone - Very Long External Application Name',
  version: '0.1.0',
  route: 'http://localhost:9999/nova-explorer-standalone',
  descriptionLong: 'Dummy external app for testing purposes.',
  name: 'nova2',
  groupNames: ['ecm', 'nova'],
  type: 'external',
};

const dictionary = {
  SYSTEMS: 'Systems',
  APPS: 'Apps',
  NO_RESULT: 'No result found.',
  SEARCH_PLACEHOLDER: 'Search',
};

const CALL_BROWSER = 'Call Browser';

const KEYWORDS = {
  NAME: CALL_BROWSER,
  TAG: 'advanced dashboards',
  DESC: 'NFV',
};

describe('Search Field', () => {
  let searchComponent;

  const testSearchComponent = async (keyWord, expectedElements) => {
    const textField = await searchComponent.textField();
    await textField.setValue(keyWord);
    await searchComponent.waitForFiltered();

    expect(await searchComponent.menuItemLabels()).to.deep.eq(expectedElements);
  };

  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it('is visible on the landing page and the menu is closed', async () => {
    const productView = await LauncherPage.productView();
    await LauncherPage.waitForProductViewLoading();
    searchComponent = await productView.searchComponent();
    await productView.waitForSearchComponentLoading();
    await searchComponent.waitForGroupableComboBoxLoading();
    const menu = await searchComponent.menu();
    expect(await searchComponent.root.isDisplayed()).to.be.true;
    expect(await menu.isDisplayed()).to.be.false;
  });

  it('is autofocused and can search for application name', async () => {
    await testSearchComponent(KEYWORDS.NAME, [dictionary.APPS, CALL_BROWSER]);
  });

  it('can search for tags', async () => {
    await testSearchComponent(KEYWORDS.TAG, [dictionary.APPS, 'Expert Insights Dashboard']);
  });

  it('can search for description', async () => {
    await testSearchComponent(KEYWORDS.DESC, [dictionary.SYSTEMS, 'Ericsson Cloud Manager']);
  });

  it('can clear input by clicking the cross icon and menu is closed', async () => {
    const textField = await searchComponent.textField();
    const icon = await searchComponent.icon();
    await icon.click();
    const menu = await searchComponent.menu();
    expect(await textField.getValue()).to.eq('');
    expect(await menu.isDisplayed()).to.be.false;
  });

  it('clicking on a product in the menu should open the product page', async () => {
    const textField = await searchComponent.textField();
    await textField.setValue('eea');
    await searchComponent.waitForFiltered();
    const menuItems = await searchComponent.menuItems();
    const menuItemLabels = await menuItems.map((menuItem) => menuItem.getAttribute('label'));
    const menuIndex = menuItemLabels.findIndex(
      (menuLabel) => menuLabel === 'Ericsson Expert Analytics',
    );
    await menuItems[menuIndex].click();

    const productView = await LauncherPage.productView();
    const actualUrl = await browser.getUrl();

    expect(actualUrl).to.contains('launcher?productName=eea');
    expect(productView).not.to.be.null;
  });

  it('is visible on the product page', async () => {
    const appView = await LauncherPage.appView();
    searchComponent = await appView.searchComponent();
    expect(searchComponent).not.to.be.null;
  });

  it('clicking on an app in the menu should open the app in a new browser tab', async () => {
    const { baseUrl } = browser.options;
    const textField = await searchComponent.textField();
    await textField.click();
    await textField.setValue(NOVA_EXPLORER_STANDALONE.displayName);
    await searchComponent.waitForFiltered();
    const menuItems = await searchComponent.menuItems();
    const menuItemLabels = await menuItems.map((menuItem) => menuItem.getAttribute('label'));
    const menuIndex = menuItemLabels.findIndex(
      (menuLabel) => menuLabel === NOVA_EXPLORER_STANDALONE.displayName,
    );
    await menuItems[menuIndex].click();

    const expectedUrl = NOVA_EXPLORER_STANDALONE.route;
    await browser.switchWindow(expectedUrl);

    const actualUrl = await browser.getUrl();
    await browser.closeWindow();
    await browser.switchWindow(baseUrl);

    expect(actualUrl).to.be.eq(`${expectedUrl}`);
  });

  it('is autofocused in the Systembar', async () => {
    const systembarGlobalNavigation = await ContainerPage.systembarGlobalNavigation();
    const launcherIcon = await systembarGlobalNavigation.launcherIcon();
    await launcherIcon.click();
    await systembarGlobalNavigation.waitForLoading();

    const productView = await systembarGlobalNavigation.productView();
    searchComponent = await productView.searchComponent();

    await testSearchComponent(NOVA_EXPLORER_STANDALONE.displayName, [
      dictionary.APPS,
      NOVA_EXPLORER_STANDALONE.displayName,
    ]);
  });
});
