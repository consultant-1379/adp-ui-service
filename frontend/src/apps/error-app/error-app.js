/**
 * Error app is defined as
 * `<e-error-app>`
 *
 * Imperatively create application
 * @example
 * let app = new ErrorApp();
 *
 * Declaratively create application
 * @example
 * <e-error-app></e-error-app>
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import { i18nMixin } from '@adp/ui-components';
import style from './error-app.css';

import { ErrorMessageDialog } from '../../components/error-message-dialog/error-message-dialog.js';

import defaultI18n from './locale/en-us.json' assert { type: 'json' };

const SESSION_EXPIRED = 'session-expired';

class ErrorApp extends i18nMixin(defaultI18n, App) {
  constructor() {
    super();
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  static get components() {
    return {
      'e-error-message-dialog': ErrorMessageDialog,
    };
  }

  get meta() {
    return import.meta;
  }

  getSessionExpiredContent() {
    const { i18n } = this;
    return {
      label: i18n.SESSION_EXPIRED.LABEL,
      content: html`
        <div class="error-reason">
          <div>${i18n.SESSION_EXPIRED.REASON}</div>
          <div>
            <span class="action" @click=${this.handleRefresh}>${i18n.SESSION_EXPIRED.ACTION}</span>
          </div>
        </div>
      `,
    };
  }

  handleRefresh() {
    window.location.reload();
  }

  getErrorContent() {
    if (this.metaData.options.error === SESSION_EXPIRED) {
      return this.getSessionExpiredContent();
    }
    return {};
  }

  render() {
    const { label, content, bottom } = this.getErrorContent();
    return html`
      <e-error-message-dialog .label=${label}>
        <div slot="custom-content">${content}</div>
        <div slot="custom-bottom">${bottom}</div>
      </e-error-message-dialog>
    `;
  }
}

definition('e-error-app', {
  style,
  props: {
    metaData: {
      type: Object,
      attribute: false,
      default: {},
    },
  },
})(ErrorApp);

export default ErrorApp;
