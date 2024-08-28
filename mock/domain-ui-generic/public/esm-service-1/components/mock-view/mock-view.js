/**
 * Component MockView is defined as
 * `<e-mock-view>`
 *
 * Imperatively create component
 * @example
 * let component = new MockView();
 *
 * Declaratively create component
 * @example
 * <e-mock-view></e-mock-view>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition } from '@eui/lit-component';

class MockView extends LitComponent {
  get meta() {
    return import.meta;
  }

  /**
   * Render the <e-mock-view> component. This function is called each time a
   * prop changes.
   */
  render() {
    return html`
      <h2>This is a sample component.</h2>
      <h3>View properties:</h3>
      <ul>
        <li>property-one (boolean): ${this.propOne}</li>
        <li>property-two (text): ${this.propTwo}</li>
      </ul>
    `;
  }
}

/**
 * @property {Boolean} propOne - show active/inactive state.
 * @property {String} propTwo - shows the "Hello World" string.
 */
definition('e-mock-view', {
  home: 'mock-view',
  props: {
    propOne: { attribute: true, type: Boolean },
    propTwo: { attribute: true, type: String, default: 'Have a nice day!' },
  },
})(MockView);

MockView.register();

export { MockView };
