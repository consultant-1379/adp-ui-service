/**
 * Component ErrorMessageDialog is defined as
 * `<e-error-message-dialog>`
 *
 * Imperatively create component
 * @example
 * let component = new ErrorMessageDialog();
 *
 * Declaratively create component
 * @example
 * <e-error-message-dialog></e-error-message-dialog>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition } from '@eui/lit-component';
import { Dialog } from '@eui/base';

class ErrorMessageDialog extends LitComponent {
  static get components() {
    return {
      'eui-dialog': Dialog,
    };
  }

  render() {
    const { label, noCancel } = this;
    return html`
      <eui-dialog label=${label} show="true" .noCancel=${noCancel}>
        <div slot="content"><slot name="custom-content"></slot></div>
        <div slot="bottom"><slot name="custom-bottom"></slot></div>
      </eui-dialog>
    `;
  }
}

definition('e-error-message-dialog', {
  props: {
    label: {
      type: String,
      default: '',
      attribute: false,
    },
    noCancel: {
      type: Boolean,
      default: true,
      attribute: false,
    },
  },
})(ErrorMessageDialog);

export { ErrorMessageDialog };
