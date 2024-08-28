import euiFrame from '../common/eui-frame.component.js';

const cssPaths = {
  eActionConsumer: 'e-action-consumer',
  euiActionBar: 'eui-action-bar',
  euiButton: 'eui-button',
  euiLoader: 'eui-loader',
  results: '#results',
  div: 'div',
};

class ActionConsumerPage extends euiFrame.PageBase {
  async root() {
    const content = await this.content();
    return content.$(cssPaths.eActionConsumer);
  }

  async waitForLoading() {
    await super.waitForLoading();
    await browser.waitUntil(
      async () => {
        const root = await this.root();
        const euiLoader = await root.shadow$(cssPaths.euiLoader);
        const isDisplayed = await this._isDisplayed(euiLoader);
        return !isDisplayed;
      },
      {
        timeoutMsg: 'Failed to wait for loader to disappear',
      },
    );
  }

  async actionButtons() {
    const root = await this.root();
    const euiActionBar = await root.shadow$(cssPaths.euiActionBar);
    return euiActionBar.shadow$$(cssPaths.euiButton);
  }

  async actionTitles() {
    const actionButtons = await this.actionButtons();
    return actionButtons.map((actionButton) => actionButton.getText());
  }

  async getResults() {
    let divs;
    await browser.waitUntil(
      async () => {
        const root = await this.root();
        const results = await root.shadow$(cssPaths.results);
        divs = await results.$$(cssPaths.div);
        return divs.length !== 0;
      },
      {
        timeoutMsg: 'Results did not appear in time.',
      },
    );
    return divs.map((div) => div.getText());
  }
}

export default new ActionConsumerPage();
