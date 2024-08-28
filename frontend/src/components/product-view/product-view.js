/**
 * Component ProductView is defined as
 * `<e-product-view>`
 *
 * Imperatively create component
 * @example
 * let component = new ProductView();
 *
 * Declaratively create component
 * @example
 * <e-product-view></e-product-view>
 *
 * @extends {LauncherView}
 */
import { html, definition, nothing, classMap, ref, createRef } from '@eui/lit-component';
import { ActionBar, CardContainer, i18nMixin } from '@adp/ui-components';
import style from './product-view.css';

import { LauncherView } from '../launcher-view/launcher-view';
import CONSTANTS from '../../utils/constants';
import router from '../../utils/router.js';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };

const IS_PRODUCTS = true;
const IS_EXPANDABLE = false;

const { PRODUCT_TYPE, SYSTEM_TYPE, FOCUS_SEARCH_BAR_EVENT, SHOW_FAVORITES_ONLY } = CONSTANTS;

class ProductView extends i18nMixin(defaultI18n, LauncherView) {
  constructor() {
    super();
    this.actionBarRef = createRef();
    this.focusSearchBarEventHandler = this.focusSearchBarEventHandler.bind(this);
  }

  static get components() {
    return {
      'e-card-container': CardContainer,
      'e-action-bar': ActionBar,
    };
  }

  get meta() {
    return import.meta;
  }

  collectProductItems(groups) {
    groups.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return groups
      .filter((element) => element.type === PRODUCT_TYPE || element.type === SYSTEM_TYPE)
      .filter((element) => !element.hidden);
  }

  renderEmptyState() {
    const { i18n } = this;
    return html`
      <div class="empty-state">
        <div class="message">
          <p>${i18n.NO_APPS}</p>
        </div>
      </div>
    `;
  }

  mapProductsWithRoutes(apps) {
    return apps.map((app) => ({ ...app, route: router.getProductUrl(app.name) }));
  }

  mapAppsWithRoutes(apps) {
    return apps.map((app) => ({
      ...app,
      route: router.getActualRoute(app),
      childApps: app.childApps
        ? app.childApps.map((childApp) => ({
            ...childApp,
            route: router.getActualRoute(childApp),
          }))
        : [],
    }));
  }

  handleViewAllClick(isRecentSection = '') {
    const param = isRecentSection ? '' : SHOW_FAVORITES_ONLY;
    router.goToAllApps(param);
  }

  renderRecentSection() {
    const { recentApps, i18n, isCompactView } = this;
    const limitNumberOfCards = true;
    const isRecentSection = true;
    return recentApps.length !== 0
      ? html`
          <e-card-container
            .groupName=${i18n.RECENT_APPS}
            .items=${this.mapAppsWithRoutes(recentApps)}
            .isCompactView=${isCompactView}
            .limitNumberOfCards=${limitNumberOfCards}
            .isRecentSection=${isRecentSection}
            @handle-view-all-cards=${() => this.handleViewAllClick(isRecentSection)}
          ></e-card-container>
        `
      : nothing;
  }

  renderFavoriteSection() {
    const { favoriteApps, i18n, isCompactView } = this;
    const limitNumberOfCards = true;

    return favoriteApps.length !== 0
      ? html`
          <e-card-container
            .groupName=${i18n.FAVORITE_APPS}
            .items=${this.mapAppsWithRoutes(favoriteApps)}
            .limitNumberOfCards=${limitNumberOfCards}
            .isCompactView=${isCompactView}
            @handle-view-all-cards=${() => this.handleViewAllClick()}
          ></e-card-container>
        `
      : nothing;
  }

  didConnect() {
    super.didConnect();
    const { focusSearchBarEventHandler, productName } = this;
    this.addEventListener(FOCUS_SEARCH_BAR_EVENT, focusSearchBarEventHandler);
    this.bubble('portal:activate-menu-item', productName);
  }

  focusSearchBarEventHandler() {
    const { actionBarRef } = this;
    actionBarRef.value.dispatchEvent(new Event(FOCUS_SEARCH_BAR_EVENT));
  }

  didDisconnect() {
    super.didDisconnect();
    const { focusSearchBarEventHandler } = this;
    this.removeEventListener(FOCUS_SEARCH_BAR_EVENT, focusSearchBarEventHandler);
  }

  getProducts() {
    const { groups } = this;
    return groups.filter(
      (element) => element.type === PRODUCT_TYPE || element.type === SYSTEM_TYPE,
    );
  }

  getActionBarData() {
    const { apps, i18n } = this;
    const products = this.getProducts();
    return [
      {
        group: true,
        label: i18n.APPS,
        items: apps,
      },
      {
        group: true,
        label: i18n.PRODUCTS,
        items: products,
      },
    ];
  }

  render() {
    const { groups, i18n, productName, isCompactView, actionBarRef } = this;
    const items = this.collectProductItems(groups);
    if (!items.length) {
      return this.renderEmptyState();
    }
    const productGroupLabel = `${i18n.PRODUCTS} (${items.length})`;
    return html`
      <div class=${classMap(this.classMap)}>
        <e-action-bar
          ${ref(actionBarRef)}
          .data=${this.getActionBarData()}
          .isCompactView=${isCompactView}
          is-product-view
        ></e-action-bar>
      </div>
      <div class=${classMap(this.classMap)}>
        <e-card-container
          .productName=${productName}
          .groupName=${productGroupLabel}
          .items=${this.mapProductsWithRoutes(items)}
          .isProducts=${IS_PRODUCTS}
          .isExpandable=${IS_EXPANDABLE}
          .isCompactView=${isCompactView}
          @handle-view-all-cards=${() => this.handleViewAllClick()}
        ></e-card-container>
      </div>
      <div class=${classMap(this.classMap)}>
        ${this.renderRecentSection()} ${this.renderFavoriteSection()}
      </div>
    `;
  }
}

definition('e-product-view', {
  style,
  props: {
    apps: {
      type: Array,
      default: [],
      attribute: false,
    },
    groups: {
      type: Array,
      default: [],
      attribute: false,
    },
    recentApps: {
      type: Array,
      default: [],
      attribute: false,
    },
    favoriteApps: {
      type: Array,
      default: [],
      attribute: false,
    },
  },
})(ProductView);

export { ProductView };
