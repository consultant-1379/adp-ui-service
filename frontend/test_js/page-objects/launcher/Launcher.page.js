import euiFrame from '../common/eui-frame.component.js';
import ProductView from './ProductView.js';
import AppView from './AppView.js';

const cssPaths = {
  launcher: 'e-launcher',
  launcherComponent: 'e-launcher-component',
  productView: 'e-product-view',
  appView: 'e-app-view',
  euiNotification: 'eui-notification',
  notificationDescription: 'div[slot = "description"]',
  closeIcon: 'eui-icon[name = "cross"]',
  euiLoader: 'eui-loader',
};

class LauncherPage extends euiFrame.PageBase {
  async root() {
    const content = await this.content();
    const launcher = await content.$(cssPaths.launcher);
    return launcher.shadow$(cssPaths.launcherComponent);
  }

  async open() {
    await browser.url(`${browser.options.baseUrl}/#launcher`);
  }

  async productView() {
    const root = await this.root();
    const productView = await root.shadow$(cssPaths.productView);
    return new ProductView(productView);
  }

  async appView() {
    const root = await this.root();
    const appView = await root.shadow$(cssPaths.appView);
    return new AppView(appView);
  }

  async waitForProductViewLoading() {
    await this._waitForLoading(cssPaths.productView);
  }

  async waitForAppViewLoading() {
    await this._waitForLoading(cssPaths.appView);
  }

  async _waitForLoading(viewCssPath) {
    await super.waitForLoading();
    await browser.waitUntil(
      async () => {
        const root = await this.root();
        const view = await root.shadow$(viewCssPath);
        return this._isDisplayed(view);
      },
      {
        timeoutMsg: `Failed to load ${viewCssPath}`,
      },
    );
  }

  async waitForLoading() {
    await super.waitForLoading();
    await browser.waitUntil(
      async () => {
        const content = await this.content();
        const launcher = await content.$(cssPaths.launcher);

        const root = await this.root();
        const euiLoader = await root.shadow$(cssPaths.euiLoader);
        const isLoaderDisplayed = await this._isDisplayed(euiLoader);

        return (await launcher.getAttribute('loaded')) === '' && !isLoaderDisplayed;
      },
      {
        timeoutMsg: 'Failed to wait for loader to disappear and Launcher to be ready',
      },
    );
  }

  async notification() {
    const content = await this.content();
    const launcher = await content.$(cssPaths.launcher);
    return launcher.shadow$(cssPaths.euiNotification);
  }

  async notificationText() {
    const notification = await this.notification();
    const description = await notification.$(cssPaths.notificationDescription);

    await browser.waitUntil(
      async () => {
        const text = await description.getText();
        return text !== '';
      },
      {
        timeoutMsg: 'Failed to wait for notification text',
      },
    );

    return description.getText();
  }

  async closeNotification() {
    const notification = await this.notification();
    const euiCloseIcon = await notification.shadow$(cssPaths.closeIcon);
    return euiCloseIcon.click();
  }
}

export default new LauncherPage();
