import { App, html, definition } from '@eui/app';
import { ActionBar, ActionFrameworkLib } from '@eui/action-framework';
import style from './action-consumer.css';

export default class ActionConsumer extends App {
  static get components() {
    return {
      'eui-action-bar': ActionBar,
    };
  }

  async didConnect() {
    this.bubble('app:lineage', { metaData: this.metaData });
    this.actions = await ActionFrameworkLib.actions();
  }

  async handleEvent(event) {
    if (event.type === 'action:execute') {
      const { actionId } = event.detail;
      const action = this.actions.find((a) => a.id === actionId);

      try {
        const result = await ActionFrameworkLib.execute(actionId);
        this.result = {
          title: action.displayName,
          items: result,
        };
      } catch (error) {
        console.error(error);
      }
    }
  }

  renderItems(items = []) {
    return items.map(
      (item) => html`
        <div>${item.displayName}</div>
      `,
    );
  }

  render() {
    const ids = this.actions.map((action) => action.id);
    const { result } = this;

    return html`
      <div id="frame">
        <h2>Actions</h2>
        <eui-action-bar .ids=${ids} @action:execute=${this}></eui-action-bar>
        <div id="results">
          <h2>${result.title ?? ''}</h2>
          ${this.renderItems(result.items)}
        </div>
      </div>
    `;
  }
}

definition('e-action-consumer', {
  style,
  props: {
    actions: {
      type: Array,
      default: [],
      attribute: false,
    },
    result: {
      type: Object,
      default: {},
      attribute: false,
    },
  },
})(ActionConsumer);

ActionConsumer.register();
