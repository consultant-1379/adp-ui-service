import euiFrame from './eui-frame.component.js';
import SystembarGlobalNavigation from './SystembarGlobalNavigation.js';
import SystembarTitle from './SystembarTitle.js';

const cssPaths = {
  systembarGlobalNavigation: 'e-systembar-global-navigation',
};

class ContainerPage extends euiFrame.PageBase {
  async waitForLoading() {
    await super.waitForLoading();
  }

  async systembarGlobalNavigation() {
    const systemBarActions = await this.systemBar.systemBarActions();
    const systembarComponent = await systemBarActions.$(cssPaths.systembarGlobalNavigation);
    return new SystembarGlobalNavigation(systembarComponent);
  }

  async systembarTitle() {
    const systembarTitle = await this.systemBar.systembarTitle();
    return new SystembarTitle(systembarTitle);
  }
}

export default new ContainerPage();
