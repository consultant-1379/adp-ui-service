/**
 * Component LauncherView is defined as
 * `<e-launcher-view>`
 *
 * Imperatively create component
 * @example
 * let component = new LauncherView();
 *
 * Declaratively create component
 * @example
 * <e-launcher-view></e-launcher-view>
 *
 * @extends {LitComponent}
 */
import { LitComponent, definition } from '@eui/lit-component';
import style from './launcher-view.css';

import CONSTANTS from '../../utils/constants';

const { COMPACT_VIEW_BREAKPOINT } = CONSTANTS;

class LauncherView extends LitComponent {
  constructor() {
    super();
    this.resizeHandler = this.resizeHandler.bind(this);
  }

  checkCompactView() {
    return window.innerWidth <= COMPACT_VIEW_BREAKPOINT || this.isInSysBar;
  }

  didConnect() {
    const { resizeHandler } = this;
    window.addEventListener('resize', resizeHandler);
    this.isCompactView = this.checkCompactView();
  }

  didDisconnect() {
    const { resizeHandler } = this;
    window.removeEventListener('resize', resizeHandler);
  }

  resizeHandler() {
    this.isCompactView = this.checkCompactView();
  }

  get classMap() {
    const { isCompactView } = this;
    return {
      'launcher-tile': true,
      'compact-view': isCompactView,
    };
  }
}

definition('e-launcher-view', {
  style,
  props: {
    isCompactView: {
      type: Boolean,
      default: false,
      attribute: true,
    },
    isInSysBar: {
      type: Boolean,
      default: false,
      attribute: true,
    },
  },
})(LauncherView);

export { LauncherView };
