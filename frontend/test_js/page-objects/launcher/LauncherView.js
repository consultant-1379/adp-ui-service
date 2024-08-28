import SearchComponent from './SearchComponent.js';

const cssPaths = {
  actionBar: 'e-action-bar',
  searchComponent: 'e-search-component',
};

class LauncherView {
  constructor(root) {
    this.root = root;
  }

  async actionBar() {
    return this.root.shadow$(cssPaths.actionBar);
  }

  async searchComponent() {
    const actionBar = await this.actionBar();
    const searchComponent = await actionBar.shadow$(cssPaths.searchComponent);
    return new SearchComponent(searchComponent);
  }

  async _isDisplayed(element) {
    try {
      return element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  async waitForSearchComponentLoading() {
    const actionBar = await this.actionBar();
    await this._waitForLoading(cssPaths.searchComponent, actionBar);
  }

  async _waitForLoading(viewCssPath, parent = null) {
    const root = parent || this.root;
    await browser.waitUntil(
      async () => {
        const view = await root?.shadow$(viewCssPath);
        return this._isDisplayed(view);
      },
      {
        timeoutMsg: `Failed to load ${viewCssPath}`,
      },
    );
  }
}

export default LauncherView;
