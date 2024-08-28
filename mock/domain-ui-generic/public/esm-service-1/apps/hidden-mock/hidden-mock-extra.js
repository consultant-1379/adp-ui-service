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

  get meta() {
    return import.meta;
  }

  render() {
    return html`
      <div id="hidden">This is an extra file</div>
    `;
  }
}

definition('e-mock-portal', {
  props: {
    response: { attribute: false },
  },
})(MockPortal);

export default MockPortal;

MockPortal.register();
