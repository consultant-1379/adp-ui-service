/**
 * CheckBoxes is defined as
 * `<e-checkboxes>`
 *
 * Imperatively create application
 * @example
 * let app = new CheckBoxes();
 *
 * Declaratively create application
 * @example
 * <e-checkboxes></e-checkboxes>
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import { Checkbox } from '@eui/base';

export default class CheckBoxes extends App {
  static get components() {
    return {
      'eui-checkbox': Checkbox,
    };
  }

  get meta() {
    return import.meta;
  }

  didConnect() {
    this.bubble('app:lineage', { metaData: this.metaData });
  }

  _onCheckboxChanged(event) {
    this.counter += event.detail.checked ? 1 : -1;
  }

  render() {
    return html`
      <h2>${this.i18n?.TITLE}</h2>
      <eui-checkbox name="checkbox1" @change="${(event) => this._onCheckboxChanged(event)}">
        ${this.i18n?.CHECKBOX_1}
      </eui-checkbox>
      <eui-checkbox name="checkbox2" @change="${(event) => this._onCheckboxChanged(event)}">
        ${this.i18n?.CHECKBOX_2}
      </eui-checkbox>
      <h3>${this.counter} of 2 is selected.</h3>
    `;
  }
}

definition('e-checkboxes', {
  props: {
    response: { attribute: false },
    counter: { type: Number, default: 0 },
  },
})(CheckBoxes);

CheckBoxes.register();
