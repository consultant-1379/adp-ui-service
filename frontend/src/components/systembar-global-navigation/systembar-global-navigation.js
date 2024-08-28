/**
 * Component SystembarGlobalNavigation is defined as
 * `<e-systembar-global-navigation>`
 *
 * Imperatively create component
 * @example
 * let component = new SystembarGlobalNavigation();
 *
 * Declaratively create component
 * @example
 * <e-systembar-global-navigation></e-systembar-global-navigation>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition, ref, createRef } from '@eui/lit-component';
import { Icon } from '@eui/theme';
import { Link } from '@eui/base';
import { i18nMixin } from '@adp/ui-components';
import style from './systembar-global-navigation.css';

import router from '../../utils/router';
import CONSTANTS from '../../utils/constants';

import { GlobalNavigationPanel } from '../global-navigation-panel/global-navigation-panel.js';

import { CustomFlyoutPanel } from './custom-flyout-panel.js';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };

const { FOCUS_SEARCH_BAR_EVENT } = CONSTANTS;
const PANEL_CLOSE_ICON = true;

class SystembarGlobalNavigation extends i18nMixin(defaultI18n, LitComponent) {
  constructor() {
    super();
    this.globalNavigationPanelRef = createRef();
    this.customFlyoutPanelRef = createRef();
    this.toggleFlyoutPanel = this.toggleFlyoutPanel.bind(this);
    this.handlePortalLinkClick = this.handlePortalLinkClick.bind(this);
    this._clickedOutsideHandler = this._clickedOutsideHandler.bind(this);
  }

  static get components() {
    return {
      'eui-icon': Icon,
      'eui-link': Link,
      'e-global-navigation-panel': GlobalNavigationPanel,
      'e-custom-flyout-panel': CustomFlyoutPanel,
    };
  }

  get meta() {
    return import.meta;
  }

  toggleFlyoutPanel() {
    this.showFlyout = !this.showFlyout;
    if (this.showFlyout) {
      setTimeout(() => this.focusSearchBar(), 200);
    }
  }

  focusSearchBar() {
    const { globalNavigationPanelRef } = this;
    globalNavigationPanelRef.value.dispatchEvent(new Event(FOCUS_SEARCH_BAR_EVENT));
  }

  handlePortalLinkClick(event) {
    event.stopPropagation();
    event.preventDefault();
    router.loadPortal();
  }

  _clickedOutsideHandler(event) {
    const { customFlyoutPanelRef } = this;
    const outerPanel = customFlyoutPanelRef.value.shadowRoot.querySelector('.flyout-panel__outer');
    if (event.composedPath().includes(outerPanel)) {
      this.showFlyout = false;
    }
  }

  didConnect() {
    super.didConnect();
    const { _clickedOutsideHandler } = this;
    document.addEventListener('mousedown', _clickedOutsideHandler);
    document.addEventListener('touchend', _clickedOutsideHandler);
  }

  didDisconnect() {
    super.didDisconnect();
    const { _clickedOutsideHandler } = this;
    document.removeEventListener('mousedown', _clickedOutsideHandler);
    document.removeEventListener('touchend', _clickedOutsideHandler);
  }

  render() {
    const {
      i18n,
      productName,
      displayName,
      globalNavigationPanelRef,
      showFlyout,
      customFlyoutPanelRef,
      toggleFlyoutPanel,
      handlePortalLinkClick,
    } = this;

    return html`
      <eui-icon name="app-launcher" color="white" @click=${toggleFlyoutPanel}></eui-icon>
      <e-custom-flyout-panel
        ${ref(customFlyoutPanelRef)}
        id="global-navigation-flyout"
        .show=${showFlyout}
        .panelClose=${PANEL_CLOSE_ICON}
        @onClose=${toggleFlyoutPanel}
      >
        <div slot="content">
          <e-global-navigation-panel
            ${ref(globalNavigationPanelRef)}
            .productName=${productName}
            .displayName=${displayName}
          ></e-global-navigation-panel>
        </div>
        <div slot="footer" id="global-navigation-flyout-footer">
          <eui-link @click=${handlePortalLinkClick}>${i18n.OPEN_ERICSSON_PORTAL}</eui-link>
        </div>
      </e-custom-flyout-panel>
    `;
  }
}

definition('e-systembar-global-navigation', {
  style,
  props: {
    showFlyout: {
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
  },
})(SystembarGlobalNavigation);

export { SystembarGlobalNavigation };
