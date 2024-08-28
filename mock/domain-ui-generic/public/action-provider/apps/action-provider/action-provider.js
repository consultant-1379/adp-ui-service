import { App, html, definition } from '@eui/app';
import style from './action-provider.css';

export default class ActionProvider extends App {
  didConnect() {
    this.bubble('app:lineage', { metaData: this.metaData });
  }

  render() {
    return html`
      <div id="frame">Go to the Action Consumer to use the provided actions.</div>
    `;
  }
}

definition('e-action-provider', {
  style,
  props: {},
})(ActionProvider);

ActionProvider.register();
