import { App, html, definition } from '@eui/app';

class TreeApp extends App {
  didConnect() {
    const { hash } = window.location;
    this.appName = hash.split('/').pop();

    this.bubble('app:lineage', { metaData: this.metaData });
  }

  render() {
    const { metaData } = this;
    return html`
      <div>${metaData?.displayName}</div>
    `;
  }
}

definition('e-tree-app', {
  props: {
    appName: {
      attribute: false,
      type: String,
    },
  },
})(TreeApp);

export default TreeApp;

TreeApp.register();
