/**
 * Launcher is defined as
 * `<e-launcher>`
 *
 * Imperatively create application
 * @example
 * let app = new Launcher();
 *
 * Declaratively create application
 * @example
 * <e-launcher></e-launcher>
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import { Notification } from '@eui/base';
import { nothing } from '@eui/lit-component';
import { i18nMixin } from '@adp/ui-components';
import dateFormatter from '@adp/auth/dateFormatter';
import style from './launcher.css';

import { LauncherComponent } from '../../components/launcher-component/launcher-component';
import router from '../../utils/router';
import replaceInLocale from '../../utils/replaceInLocale';
import CONSTANTS from '../../utils/constants';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };

const { ALL_APPS } = CONSTANTS;

class Launcher extends i18nMixin(defaultI18n, App) {
  constructor() {
    super();
    this.showFavoritesOnly = router.doesURLContainFavorites();
    this.handleProductSelection = this.handleProductSelection.bind(this);
    this.handleLoaded = this.handleLoaded.bind(this);
    this.routeCallBack = this.routeCallBack.bind(this);
  }

  static get components() {
    return {
      'eui-notification': Notification,
      'e-launcher-component': LauncherComponent,
    };
  }

  get meta() {
    return import.meta;
  }

  async callPlugin(method) {
    return new Promise((resolve) => {
      this.bubble('eui-plugins:execute', {
        plugin: 'authentication',
        method,
        params: { callback: resolve },
      });
    });
  }

  async didConnect() {
    this.addRoutes();

    this.previousLoginTime = await this.callPlugin('getPreviousLoginTime');
    this.lastLoginTime = await this.callPlugin('getLastLoginTime');
  }

  didDisconnect() {
    this.routesIds.forEach((routeId) => {
      router.removeRoute(routeId);
    });
  }

  routeCallBack(_appPath, query) {
    const { productName, favorites } = query;
    this.showFavoritesOnly = favorites === '';
    this.productName = productName || '';
    const launcherComponent = this.shadowRoot.querySelector('e-launcher-component');
    launcherComponent.bubble('handle-product-selection', this.productName);
  }

  addRoutes() {
    const route1Id = router.addRoute(this.routeCallBack);
    this.routesIds = [route1Id];
  }

  renderContextualBreadcrumb() {
    const { productName, displayName, i18n } = this;
    const breadcrumbData = {};

    if (productName) {
      let contextualTitle;
      if (productName === ALL_APPS) {
        contextualTitle = i18n.MENU.ALL;
      } else {
        contextualTitle = displayName || '';
      }
      breadcrumbData.metaData = {
        name: 'launcher',
        displayName: contextualTitle,
      };
      breadcrumbData.crumbs = [
        {
          displayName: i18n.MENU.LAUNCHER,
          action: () => router.goToMainPage(),
        },
      ];
    } else {
      breadcrumbData.metaData = {
        name: 'launcher',
        displayName: i18n.MENU.LAUNCHER,
      };
      breadcrumbData.crumbs = [];
    }

    this.bubble('app:lineage', breadcrumbData);
  }

  handleProductSelection(event) {
    const currentProduct = event.detail;
    this.productName = currentProduct.productName;
    this.displayName = currentProduct.displayName;

    if (this.productName !== '') {
      if (this.showFavoritesOnly) {
        router.goToShowFavorites(this.productName);
      } else {
        router.goToProduct(this.productName);
      }
    }

    this.renderContextualBreadcrumb();

    this.bubble('portal:activate-menu-item', this.productName || router.pageRoute);
  }

  handleLoaded() {
    this.loaded = true;

    const launcherComponent = this.shadowRoot.querySelector('e-launcher-component');
    const menuData = launcherComponent.getMenuDataFromAppConfigs();
    this.bubble('portal:set-local-menu', menuData);
    requestAnimationFrame(() => this.bubble('portal:activate-menu-item', router.pageRoute));
  }

  _renderNotification() {
    const { previousLoginTime, lastLoginTime, i18n } = this;
    return previousLoginTime !== lastLoginTime
      ? html`
          <eui-notification>
            ${i18n.LOG_IN_NOTIFICATION_TITLE}
            <div slot="description">
              ${replaceInLocale(i18n.LOG_IN_NOTIFICATION_TEXT, [
                {
                  name: 'lastLoginTime',
                  value: dateFormatter.formatDayMonthYearTimeShort(lastLoginTime),
                },
              ])}
            </div>
          </eui-notification>
        `
      : nothing;
  }

  render() {
    const { handleProductSelection, handleLoaded, productName } = this;
    this.renderContextualBreadcrumb();

    return html`
      ${this._renderNotification()}
      <e-launcher-component
        .productName=${productName}
        @product-selected=${handleProductSelection}
        @ready=${handleLoaded}
      ></e-launcher-component>
    `;
  }
}

definition('e-launcher', {
  style,
  props: {
    loaded: {
      type: Boolean,
      default: false,
      attribute: true,
    },
    productName: {
      type: String,
      default: null,
      attribute: false,
    },
    displayName: {
      type: String,
      default: null,
      attribute: false,
    },
    previousLoginTime: {
      type: String,
      default: null,
      attribute: false,
    },
    lastLoginTime: {
      type: String,
      default: null,
      attribute: false,
    },
    showFavoritesOnly: {
      type: Boolean,
      default: false,
      attribute: false,
    },
  },
})(Launcher);

export default Launcher;

Launcher.register();
