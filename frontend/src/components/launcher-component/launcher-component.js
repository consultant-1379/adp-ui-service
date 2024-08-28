/**
 * Component LauncherComponent is defined as
 * `<e-launcher-component>`
 *
 * Imperatively create component
 * @example
 * let component = new LauncherComponent();
 *
 * Declaratively create component
 * @example
 * <e-launcher-component></e-launcher-component>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition, ref, createRef } from '@eui/lit-component';
import { Loader } from '@eui/base';
import { ErrorMessageContent, ErrorMessage, i18nMixin } from '@adp/ui-components';
import style from './launcher-component.css';
import rest from '../../utils/rest';
import router from '../../utils/router';
import configManager from '../../config/configManager';
import UiSettingsUtil from '../../utils/uiSettingsUtil';
import { AppView } from '../app-view/app-view';
import { ProductView } from '../product-view/product-view';
import {
  appHasChildren,
  setHierarchicAppStructure,
  updateHiddenStates,
} from '../../utils/appUtils';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };

import CONSTANTS from '../../utils/constants';

const {
  LAST_OPENED,
  UI_SETTINGS_CHANGE,
  FOCUS_SEARCH_BAR_EVENT,
  PRODUCT_TYPE,
  SYSTEM_TYPE,
  EXTERNAL_TYPE,
  APP_META,
  GROUP_META,
  DEFAULT_NAMESPACE,
} = CONSTANTS;

class LauncherComponent extends i18nMixin(defaultI18n, LitComponent) {
  constructor() {
    super();
    this.apps = [];
    this.groups = [];
    this.error = [];
    this.appViewRef = createRef();
    this.productViewRef = createRef();
    this.handleProductSelection = this.handleProductSelection.bind(this);
    this.handleSearchedItemSelection = this.handleSearchedItemSelection.bind(this);
    this.focusSearchBarEventHandler = this.focusSearchBarEventHandler.bind(this);

    this.bindAppStateToLocalStorage();
  }

  static get components() {
    return {
      'eui-loader': Loader,
      'e-app-view': AppView,
      'e-product-view': ProductView,
      'e-error-message': ErrorMessage,
      'e-error-message-content': ErrorMessageContent,
    };
  }

  async fetchApps() {
    try {
      return await rest.getApps();
    } catch (e) {
      console.error(`Exception while fetching apps: ${e.message}`);
      this.error.push({ type: APP_META });
      return Promise.reject(e);
    }
  }

  async fetchGroups() {
    try {
      return await rest.getGroups();
    } catch (e) {
      console.error(`Exception while fetching groups: ${e.message}`);
      this.error.push({ type: GROUP_META });
      return Promise.reject(e);
    }
  }

  async didConnect() {
    super.didConnect();
    this.isLoading = true;
    await configManager.initConfig();

    const [appResult, groupResult] = await Promise.allSettled([
      this.fetchApps(),
      this.fetchGroups(),
    ]);

    if (appResult.status === 'fulfilled') {
      this.apps = updateHiddenStates(appResult.value).filter((app) => !app.hidden);
    } else {
      console.error(`Fetching apps failed: ${appResult.reason}`);
    }

    if (groupResult.status === 'fulfilled') {
      this.groups = groupResult.value;
    } else {
      console.error(`Fetching groups failed: ${groupResult.reason}`);
    }

    if (this.productName) {
      this.publishProductDetails();
    }

    this.appState = (await UiSettingsUtil.get('appStates')) || {};
    this.isLoading = false;
    this.bubble('ready', {});

    const { handleProductSelection, focusSearchBarEventHandler } = this;
    this.addEventListener('handle-product-selection', handleProductSelection);

    this.addEventListener(FOCUS_SEARCH_BAR_EVENT, focusSearchBarEventHandler);
  }

  focusSearchBarEventHandler() {
    const { productName, appViewRef, productViewRef } = this;
    if (productName) {
      appViewRef.value.dispatchEvent(new Event(FOCUS_SEARCH_BAR_EVENT));
    } else {
      productViewRef.value.dispatchEvent(new Event(FOCUS_SEARCH_BAR_EVENT));
    }
  }

  didDisconnect() {
    super.didDisconnect();
    const { focusSearchBarEventHandler } = this;
    this.removeEventListener(FOCUS_SEARCH_BAR_EVENT, focusSearchBarEventHandler);
  }

  bindAppStateToLocalStorage() {
    const broadcastChannel = new BroadcastChannel(UI_SETTINGS_CHANGE);
    broadcastChannel.addEventListener('message', (event) => {
      if (
        event.data.storageKey.key === 'appStates' &&
        event.data.storageKey.namespace === DEFAULT_NAMESPACE
      ) {
        this.appState = event.data.newValue;
      }
    });
  }

  getMenuDataFromAppConfigs() {
    const { i18n, groups } = this;
    const allAppsItem = {
      id: CONSTANTS.ALL_APPS,
      name: CONSTANTS.ALL_APPS,
      menuPath: router.getProductUrl('all').substring(1),
      displayName: i18n.MENU.ALL,
    };

    const products = groups
      .filter((g) => g.type === PRODUCT_TYPE || g.type === SYSTEM_TYPE)
      .filter((group) => !group.hidden)
      .map((product) => ({
        id: product.name,
        name: product.name,
        menuPath: router.getProductUrl(product.name).substring(1),
        displayName: product.displayName,
        descriptionLong: product.descriptionLong,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return [
      {
        id: router.pageRoute,
        name: router.pageRoute,
        displayName: i18n.MENU.LAUNCHER,
        menuPath: `${router.pageRoute}/`,
        childNames: [allAppsItem.name, ...products.map((product) => product.name)],
      },
      allAppsItem,
      ...products,
    ];
  }

  handleProductSelection(event) {
    if (this.productName !== event.detail) {
      event.stopPropagation();
      this.productName = event.detail;
      this.publishProductDetails();
    }
  }

  publishProductDetails() {
    const currentProduct = this.groups.find((item) => item.name === this.productName);
    this.bubble('product-selected', {
      productName: this.productName,
      displayName: currentProduct?.displayName,
    });
  }

  _getRecentApps() {
    const { appState } = this;
    const rootApps = this._getRootApps();
    const recentApps = new Set();
    Object.keys(appState)
      .filter((appName) => appState[appName][LAST_OPENED])
      .sort((a, b) => appState[b][LAST_OPENED] - appState[a][LAST_OPENED])
      .forEach((appName) => {
        const recentApp = rootApps.find(
          (app) =>
            app.name === appName || (appHasChildren(app) && app.childNames.includes(appName)),
        );
        if (recentApp) {
          // appState may contain old, removed app
          recentApps.add(recentApp);
        }
      });

    return Array.from(recentApps);
  }

  _getFavoriteApps() {
    return this._getRootApps()
      .filter(
        (app) =>
          app.isFavorite ||
          (appHasChildren(app) && app.childApps.find((childApp) => childApp.isFavorite)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  _enhanceAppListWithFavorite() {
    const { appState } = this;
    this.apps = this.apps.map((app) => ({
      ...app,
      isFavorite: appState[app.name] ? appState[app.name].isFavorite : false,
    }));
  }

  _getRootApps() {
    const { apps } = this;
    return apps.filter((app) => !app.isChild);
  }

  getProducts() {
    const { groups } = this;
    return groups.filter(
      (element) => element.type === PRODUCT_TYPE || element.type === SYSTEM_TYPE,
    );
  }

  isProductName(name) {
    const products = this.getProducts();
    return products.find((app) => app.name === name);
  }

  handleSearchedItemSelection(event) {
    const { apps } = this;
    const name = event.detail.menuItems[0].value;
    if (this.isProductName(name)) {
      router.goToProduct(name);
    } else {
      const selectedApp = apps.find((app) => app.name === name);

      this.bubble('app-status-change', {
        appName: name,
        changed: { [LAST_OPENED]: Date.now() },
      });

      window.open(
        router.getActualRoute(selectedApp),
        selectedApp.type === EXTERNAL_TYPE ? '_blank' : '_self',
      );
    }
  }

  render() {
    this._enhanceAppListWithFavorite();
    const {
      productName,
      isLoading,
      isInSysBar,
      handleProductSelection,
      apps,
      groups,
      error,
      appViewRef,
      productViewRef,
    } = this;
    setHierarchicAppStructure(apps);
    // handling getApps and getGroups REST errors
    if (Object.keys(error).length) {
      let message;

      if (error.length === 2) {
        message = defaultI18n.METADATA_CANNOT_BE_LOADED;
      } else if (error[0].type === APP_META) {
        message = defaultI18n.APP_METADATA_CANNOT_BE_LOADED;
      } else if (error[0].type === GROUP_META) {
        message = defaultI18n.GROUP_METADATA_CANNOT_BE_LOADED;
      }

      return html`
        <e-error-message .title=${defaultI18n.FAILED_TO_LOAD_LAUNCHER}>
          <div slot="content">
            <e-error-message-content
              .message=${message}
              .reasons=${[defaultI18n.SERVER_UNAVAILABLE]}
              .tryAgain=${true}
            ></e-error-message-content>
          </div>
        </e-error-message>
      `;
    }

    if (isLoading) {
      return html`
        <div class="loading-container">
          <eui-loader></eui-loader>
        </div>
      `;
    }

    return html`
      ${productName
        ? html`
            <e-app-view
              ${ref(appViewRef)}
              .apps=${apps}
              .rootApps=${this._getRootApps()}
              .groups=${groups}
              .productName=${productName}
              .favoriteApps=${this._getFavoriteApps()}
              .isInSysBar=${isInSysBar}
              @handle-search-selection=${this.handleSearchedItemSelection}
            ></e-app-view>
          `
        : html`
            <e-product-view
              ${ref(productViewRef)}
              .apps=${apps}
              .groups=${groups}
              .recentApps=${this._getRecentApps()}
              .favoriteApps=${this._getFavoriteApps()}
              .isInSysBar=${isInSysBar}
              @product-selected=${handleProductSelection}
              @handle-search-selection=${this.handleSearchedItemSelection}
            ></e-product-view>
          `}
    `;
  }
}

definition('e-launcher-component', {
  style,
  props: {
    isLoading: {
      type: Boolean,
      default: false,
      attribute: false,
    },
    productName: {
      type: String,
      default: null,
      attribute: true,
    },
    appState: {
      type: Object,
      default: undefined,
      attribute: false,
    },
    isInSysBar: {
      type: Boolean,
      default: false,
      attribute: false,
    },
    error: {
      type: Object,
      attribute: false,
      default: [],
    },
  },
})(LauncherComponent);

export { LauncherComponent };
