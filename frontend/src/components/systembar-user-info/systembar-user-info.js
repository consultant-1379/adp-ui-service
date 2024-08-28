/**
 * Component SystembarUserInfo is defined as
 * `<e-systembar-user-info>`
 *
 * Imperatively create component
 * @example
 * let component = new SystembarUserInfo();
 *
 * Declaratively create component
 * @example
 * <e-systembar-user-info></e-systembar-user-info>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition } from '@eui/lit-component';
import { Icon } from '@eui/theme';
import style from './systembar-user-info.css';

class SystembarUserInfo extends LitComponent {
  constructor() {
    super();
    this.userNameHandler = this.userNameHandler.bind(this);
  }

  static get components() {
    return {
      'eui-icon': Icon,
    };
  }

  clickHandler() {
    this.bubble('system:panel', {
      panel: 'e-custom-user-settings-panel',
    });
  }

  userNameHandler(event) {
    this.userName = event.detail;
  }

  didConnect() {
    document.body.addEventListener('set-username-finished', this.userNameHandler);
  }

  didDisconnect() {
    document.body.removeEventListener('set-username-finished', this.userNameHandler);
  }

  render() {
    const { userName } = this;
    return html`
      <div class="system-action" @click=${() => this.clickHandler()}>
        <eui-icon name="profile"></eui-icon>
        <span>${userName}</span>
      </div>
    `;
  }
}

definition('e-systembar-user-info', {
  style,
  props: {
    userName: {
      type: String,
      default: '',
      attribute: false,
    },
  },
})(SystembarUserInfo);

export { SystembarUserInfo };
