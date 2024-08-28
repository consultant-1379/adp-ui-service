/**
 * WrapperApp is defined as
 * `<e-wrapper-app>`
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import { Loader } from '@eui/base';
import { Icon } from '@eui/theme';
import { ErrorMessageContent, ErrorMessage, i18nMixin } from '@adp/ui-components';
import style from './wrapper-app.css';
import defaultI18n from './locale/en-us.json' assert { type: 'json' };
import CONSTANTS from '../../utils/constants';
import rest from '../../utils/rest';

const { SYSTEM_TYPE, PRODUCT_TYPE, GROUP_META } = CONSTANTS;

export default class WrapperApp extends i18nMixin(defaultI18n, App) {
  static get components() {
    return {
      'eui-loader': Loader,
      'eui-icon': Icon,
      'e-error-message': ErrorMessage,
      'e-error-message-content': ErrorMessageContent,
    };
  }

  get meta() {
    return import.meta;
  }

  async didConnect() {
    this.isLoading = true;

    try {
      const groups = await rest.getGroups();
      this.products = groups.filter(
        (group) => group.type === PRODUCT_TYPE || group.type === SYSTEM_TYPE,
      );
    } catch (e) {
      // backend seems to have issues, better to use console than REST logger
      console.error(`Fetching groups failed: ${e.message}`);
      this.error = { type: GROUP_META };
    }

    this.isLoading = false;
    this.bubble('app:lineage', { metaData: this.metaData });
  }

  get formattedQuery() {
    const {
      metaData: {
        options: { query },
      },
    } = this;

    if (!query) {
      return '';
    }

    return query.startsWith('?') ? query : `?${query}`;
  }

  render() {
    const { error, isLoading } = this;

    // handling getGroups REST errors
    if (Object.keys(error).length && error.type === GROUP_META) {
      return html`
        <e-error-message .title=${defaultI18n.FAILED_TO_LOAD_APPLICATION}>
          <div slot="content">
            <e-error-message-content
              .message=${defaultI18n.GROUP_METADATA_CANNOT_BE_LOADED}
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

    const { i18n, metaData } = this;

    if (!metaData.options || !metaData.options.url) {
      return html`
        <e-error-message .title=${defaultI18n.CONFIG_ERROR_TITLE}>
          <div slot="content">
            <e-error-message-content
              .message=${!metaData.options ? i18n.OPTIONS_MISSING : i18n.URL_MISSING}
            ></e-error-message-content>
          </div>
        </e-error-message>
      `;
    }

    const { url } = metaData.options;
    const { formattedQuery } = this;

    return html`
      <iframe
        src="${encodeURI(url)}${encodeURI(formattedQuery)}"
        title=${i18n.I_FRAME_TITLE}
      ></iframe>
    `;
  }
}

definition('e-wrapper-app', {
  style,
  props: {
    metaData: {
      type: Object,
    },
    isLoading: {
      type: Boolean,
      default: true,
      attribute: false,
    },
    error: {
      type: Object,
      attribute: false,
      default: {},
    },
  },
})(WrapperApp);

WrapperApp.register();
