/**
 * Component GlobalNavigationPanel is defined as
 * `<e-global-navigation-panel>`
 *
 * Imperatively create component
 * @example
 * let component = new GlobalNavigationPanel();
 *
 * Declaratively create component
 * @example
 * <e-global-navigation-panel></e-global-navigation-panel>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition, nothing, ref, createRef } from '@eui/lit-component';
import { Icon } from '@eui/theme';
import { Link } from '@eui/base';
import { Tile } from '@eui/layout';
import { i18nMixin } from '@adp/ui-components';
import style from './global-navigation-panel.css';

import CONSTANTS from '../../utils/constants';

import { LauncherComponent } from '../launcher-component/launcher-component';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };

const { FOCUS_SEARCH_BAR_EVENT } = CONSTANTS;

class GlobalNavigationPanel extends i18nMixin(defaultI18n, LitComponent) {
  constructor() {
    super();
    this.launcherComponentRef = createRef();
    this.handleProductSelection = this.handleProductSelection.bind(this);
    this.handleBackButton = this.handleBackButton.bind(this);
    this.focusSearchBarEventHandler = this.focusSearchBarEventHandler.bind(this);
  }

  static get components() {
    return {
      'eui-link': Link,
      'eui-icon': Icon,
      'eui-tile': Tile,
      'e-launcher-component': LauncherComponent,
    };
  }

  get meta() {
    return import.meta;
  }

  handleProductSelection(event) {
    const currentProduct = event.detail;
    this.productName = currentProduct.productName;
    this.displayName = currentProduct.displayName;
  }

  handleBackButton(event) {
    event.preventDefault();
    event.stopPropagation();
    this.productName = '';
  }

  didConnect() {
    super.didConnect();
    const { focusSearchBarEventHandler } = this;
    this.addEventListener(FOCUS_SEARCH_BAR_EVENT, focusSearchBarEventHandler);
  }

  focusSearchBarEventHandler() {
    const { launcherComponentRef } = this;
    launcherComponentRef.value.dispatchEvent(new Event(FOCUS_SEARCH_BAR_EVENT));
  }

  didDisconnect() {
    super.didDisconnect();
    const { focusSearchBarEventHandler } = this;
    this.removeEventListener(FOCUS_SEARCH_BAR_EVENT, focusSearchBarEventHandler);
  }

  render() {
    const {
      i18n,
      productName,
      displayName,
      launcherComponentRef,
      handleProductSelection,
      handleBackButton,
    } = this;

    return html`
      ${productName
        ? html`
            <eui-link @click=${handleBackButton}>
              <eui-icon name="arrow-left" id="back-button"></eui-icon>
              <span>${i18n.BACK}</span>
            </eui-link>
            |
            <eui-tile tile-title="${displayName}" class="product-name"></eui-tile>
          `
        : nothing}
      <e-launcher-component
        ${ref(launcherComponentRef)}
        .productName=${productName}
        .isInSysBar=${true}
        @product-selected=${handleProductSelection}
      ></e-launcher-component>
    `;
  }
}

definition('e-global-navigation-panel', {
  style,
  props: {
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
  },
})(GlobalNavigationPanel);

export { GlobalNavigationPanel };
