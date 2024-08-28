/**
 * MockPortal is defined as
 * `<e-mock-portal>`
 *
 * Imperatively create application
 * @example
 * let app = new MockPortal();
 *
 * Declaratively create application
 * @example
 * <e-mock-portal></e-mock-portal>
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import { MockView } from '../../components/mock-view/mock-view.js';

class MockPortal extends App {
  static get components() {
    return {
      'e-mock-view': MockView,
    };
  }

  didConnect() {
    this.bubble('app:lineage', { metaData: this.metaData });
  }

  render() {
    return html`
      <div id="child">This is a child app</div>
    `;
  }
}

definition('e-child-mock-portal', {
  props: {
    response: { attribute: false },
  },
})(MockPortal);

export default MockPortal;

MockPortal.register();
