/**
 * Component SystembarTitle is defined as
 * `<e-systembar-title>`
 *
 * Imperatively create component
 * @example
 * let component = new SystembarTitle();
 *
 * Declaratively create component
 * @example
 * <e-systembar-title></e-systembar-title>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition } from '@eui/lit-component';
import { Icon } from '@eui/theme';
import style from './systembar-title.css';
import router from '../../utils/router';
import CONSTANTS from '../../utils/constants';

const { DEFAULT_TITLE } = CONSTANTS;
class SystembarTitle extends LitComponent {
  constructor() {
    super();
    this.handleProductSelection = this.handleProductSelection.bind(this);
  }

  static get components() {
    return {
      'eui-icon': Icon,
    };
  }

  handleProductLinkClick(event) {
    event.stopPropagation();
    if (this.productName) {
      router.goToProduct(this.productName);
    } else {
      router.goToMainPage();
    }
  }

  handleProductSelection(event) {
    event.stopPropagation();
    this.productName = event.detail.productName;
    this.productDisplayName = event.detail.productDisplayName;
  }

  didConnect() {
    const { handleProductSelection } = this;
    window.addEventListener('product-selection-changed', handleProductSelection);
  }

  render() {
    const { productDisplayName } = this;
    return html`
      <div class="title" @click=${(event) => event.stopPropagation()}>
        <div class="portal-action" @click=${() => router.goToMainPage()}>
          <eui-icon name="econ"></eui-icon>
        </div>
        <div class="portal-action-margin"></div>
        <div class="product-action" @click=${(event) => this.handleProductLinkClick(event)}>
          ${productDisplayName || DEFAULT_TITLE}
        </div>
      </div>
    `;
  }
}

definition('e-systembar-title', {
  style,
  props: {
    productName: {
      type: String,
      default: null,
      attribute: false,
    },
    productDisplayName: {
      type: String,
      default: null,
      attribute: false,
    },
  },
})(SystembarTitle);

export { SystembarTitle };
