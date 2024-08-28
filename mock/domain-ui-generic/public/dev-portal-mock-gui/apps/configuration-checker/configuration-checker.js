/**
 * ConfigurationChecker is defined as
 * `<e-configuration-checker>`
 *
 *
 * Declaratively create application
 * @example
 * <e-configuration-checker></e-configuration-checker>
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import style from './configuration-checker.css';

export default class ConfigurationChecker extends App {
  get meta() {
    return import.meta;
  }

  didConnect() {
    this.bubble('app:lineage', { metaData: this.metaData });
  }

  render() {
    const { i18n } = this;
    let TITLE = i18n.NO_SUCH_APP;

    switch (window.location.hash) {
      case '#my-gui-main':
        TITLE = i18n.MY_GUI_MAIN;
        break;
      case '#my-gui-dashboards':
        TITLE = i18n.MY_GUI_DASHBOARDS;
        break;
      case '#my-gui-dashboards/my-gui-dashboard-1':
        TITLE = i18n.MY_GUI_DASHBOARD_1;
        break;
      case '#my-gui-dashboards/my-gui-dashboard-2':
        TITLE = i18n.MY_GUI_DASHBOARD_2;
        break;
      case '#my-gui-main-2':
        TITLE = i18n.MY_GUI_MAIN_2;
        break;
      default:
        TITLE = i18n.NO_SUCH_APP;
        break;
    }

    document.title = TITLE;
    const imageSource = `apps/configuration-checker/header-image.jpg`;

    return html`
      <img src=${imageSource} alt="Header Background" class="image-style" />
      <div class="header-container">
        <div class="header-content">
          <h1>${TITLE}</h1>
        </div>
      </div>
    `;
  }
}

definition('e-configuration-checker', {
  style,
  props: {
    response: { attribute: false },
    counter: { type: Number, default: 0 },
  },
})(ConfigurationChecker);

ConfigurationChecker.register();
