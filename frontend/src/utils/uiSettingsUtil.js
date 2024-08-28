import CONSTANTS from './constants';

const { DEFAULT_NAMESPACE } = CONSTANTS;
class UiSettingsUtil {
  constructor() {
    this.namespace = DEFAULT_NAMESPACE;
    this.context = document.querySelector('eui-container');
  }

  async #callUiSettingsPlugin(method, params) {
    return new Promise((resolve) => {
      const event = new CustomEvent('eui-plugins:execute', {
        bubbles: true,
        composed: true,
        detail: {
          plugin: 'ui-settings-plugin',
          method,
          params: {
            ...params,
            namespace: params.namespace || this.namespace,
            callback: resolve,
          },
        },
      });
      this.context.dispatchEvent(event);
    });
  }

  async get(key, namespace) {
    return this.#callUiSettingsPlugin('get', {
      key,
      namespace,
    });
  }

  async set(key, value, namespace) {
    return this.#callUiSettingsPlugin('set', {
      key,
      value,
      namespace,
    });
  }

  async remove(key, namespace) {
    return this.#callUiSettingsPlugin('remove', {
      key,
      namespace,
    });
  }
}

export default new UiSettingsUtil();
