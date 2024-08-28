/**
 * Component CustomUserSettingsPanel is defined as
 * `<e-custom-user-settings-panel>`
 *
 * Imperatively create component
 * @example
 * let component = new CustomUserSettingsPanel();
 *
 * Declaratively create component
 * @example
 * <e-custom-user-settings-panel></e-custom-user-settings-panel>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition, classMap } from '@eui/lit-component';
import { Icon } from '@eui/theme';
import { Button, Switch } from '@eui/base';
import dateFormatter from '@adp/auth/dateFormatter';
import { i18nMixin } from '@adp/ui-components';
import style from './custom-user-settings-panel.css';

import UiSettingsUtil from '../../utils/uiSettingsUtil';
import replaceInLocale from '../../utils/replaceInLocale';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };
import CONSTANTS from '../../utils/constants';

const { COMMON_NAMESPACE } = CONSTANTS;

export default class CustomUserSettingsPanel extends i18nMixin(defaultI18n, LitComponent) {
  /**
   * @public
   * @function constructor
   * @description The constructor for the component, set options and bind events
   */
  constructor() {
    super();
    this._handleThemeToggle = this._handleThemeToggle.bind(this);
    this._handleLogout = this._handleLogout.bind(this);
    this._handleUserAccount = this._handleUserAccount.bind(this);
    this._isUserAccountRouteAvailable = this._isUserAccountRouteAvailable.bind(this);
  }

  static get components() {
    return {
      'eui-button': Button,
      'eui-switch': Switch,
      'eui-icon': Icon,
    };
  }

  get meta() {
    return import.meta;
  }

  async getTheme() {
    return (await UiSettingsUtil.get('theme', COMMON_NAMESPACE)) || 'dark';
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

  /**
   * @private
   * @function didConnect
   * @description Component did connect callback
   */
  async didConnect() {
    this.timestamp = await this.callPlugin('getLastLoginTime');
    this.editURL = await this.callPlugin('getUserAccountEditorRoute');
    this.userName = await this.callPlugin('getUsername');
    this.theme = await this.getTheme();
  }

  /**
   * @private
   * @function _handleThemeToggle
   * @description Handles dispatching the switch theme event
   */
  _handleThemeToggle(e) {
    const theme = e.detail.on ? 'dark' : 'light';
    this.bubble('eui-theme-change', { theme });
  }

  _handleLogout() {
    this.callPlugin('clearSession');
  }

  _handleUserAccount() {
    this.callPlugin('openUserAccountEditor');
  }

  async _isUserAccountRouteAvailable() {
    const route = await this.callPlugin('getUserAccountEditorRoute');
    return !!route;
  }

  _renderLogoutButton() {
    const { SIGN_OUT } = this.i18n.SETTINGS_PANEL;
    if (this.userName) {
      return html`
        <eui-button class="logoutButton" icon="logout" @click="${this._handleLogout}">
          ${SIGN_OUT}
        </eui-button>
      `;
    }
    return html``;
  }

  _renderUserAccountButton() {
    const { ACCOUNT_LABEL, EDIT_USER_ACCOUNT } = this.i18n.SETTINGS_PANEL;
    if (this.userName && this.editURL) {
      return html`
        <div class="title">${ACCOUNT_LABEL}</div>
        <eui-button class="userEditButton" @click="${this._handleUserAccount}">
          ${EDIT_USER_ACCOUNT}
        </eui-button>
      `;
    }
    return html``;
  }

  _renderSettings() {
    const { MY_SETTINGS, SWITCH_THEME, LIGHT, DARK } = this.i18n.SETTINGS_PANEL;
    return html`
      <div class="title">${MY_SETTINGS}</div>
      <div class="item">
        <div class="left">${SWITCH_THEME}</div>
        <div class="right">
          <eui-switch
            class=${classMap({ align__right: true })}
            label-on="${DARK}"
            label-off="${LIGHT}"
            ?on=${this.theme === 'dark'}
            @eui-switch:change=${this._handleThemeToggle}
          ></eui-switch>
        </div>
      </div>
    `;
  }

  _renderLastLogin() {
    const { SIGN_IN, LAST_LOG_IN_MISSING } = this.i18n.SETTINGS_PANEL;
    const { timestamp } = this;

    const loginText = timestamp
      ? replaceInLocale(this.i18n.LAST_LOG_IN_TEXT, [
          {
            name: 'lastLoginTime',
            value: dateFormatter.formatDayMonthYearTimeShort(timestamp),
          },
        ])
      : LAST_LOG_IN_MISSING;

    return html`
      <div class="title">${SIGN_IN}</div>
      <div class="item">
        <div class="left" id="loginText">${loginText}</div>
      </div>
    `;
  }

  render() {
    const { userName } = this;
    return html`
      <div class="settings-panel">
        <div class="content">
          <div class="column sm-12 container">
            <div class="profile">
              <eui-icon name="profile" size="44px"></eui-icon>
              <div class="username">${userName}</div>
            </div>
            <div class="content">
              ${this._renderSettings()} ${this._renderLastLogin()}
              ${this._renderUserAccountButton()}
            </div>
            <div class="content"></div>
              ${this._renderLogoutButton()}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

definition('e-custom-user-settings-panel', {
  style,
  props: {
    timestamp: {
      type: String,
      default: null,
      attribute: false,
    },
    editURL: {
      type: String,
      default: null,
      attribute: false,
    },
    userName: {
      type: String,
      default: null,
      attribute: false,
    },
    theme: {
      type: String,
      default: 'dark',
      attribute: false,
    },
  },
})(CustomUserSettingsPanel);
