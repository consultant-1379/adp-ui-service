import { expect } from 'chai';

import LauncherPage from '../../page-objects/launcher/Launcher.page.js';

describe('User settings panel', () => {
  let userSettingsPanel;

  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it('is closed at startup', async () => {
    userSettingsPanel = await LauncherPage.settingsPanel();
    expect(await LauncherPage._isDisplayed(userSettingsPanel)).to.be.false;
  });

  it('can be opened', async () => {
    await LauncherPage.clickAndWaitToDisplaySettingsPanel();
    userSettingsPanel = await LauncherPage.settingsPanel();
    expect(await LauncherPage._isDisplayed(userSettingsPanel)).to.be.true;
  });

  it('can set light theme', async () => {
    await LauncherPage.setLightTheme();
    expect(await LauncherPage.theme()).to.be.eq('light');
  });

  it('can set dark theme', async () => {
    await LauncherPage.setDarkTheme();
    expect(await LauncherPage.theme()).to.be.eq('dark');
  });

  it('preserves theme setting after reload', async () => {
    await browser.refresh();
    await LauncherPage.waitForLoading();
    expect(await LauncherPage.theme()).to.be.eq('dark');
  });
});
