import { definition } from '@eui/lit-component';
import { FlyoutPanel } from '@eui/layout';

import CONSTANTS from '../../utils/constants';

const { LOCATION_CHANGE_EVENT } = CONSTANTS;

class CustomFlyoutPanel extends FlyoutPanel {
  constructor() {
    super();
    this.closeFlyoutPanel = this.closeFlyoutPanel.bind(this);
    this.locationChangeHandler = this.locationChangeHandler.bind(this);
  }

  get meta() {
    return import.meta;
  }

  didConnect() {
    super.didConnect();
    const { closeFlyoutPanel, locationChangeHandler, closeButton } = this;
    closeButton.addEventListener('click', closeFlyoutPanel);
    document.addEventListener(LOCATION_CHANGE_EVENT, locationChangeHandler);
  }

  locationChangeHandler() {
    const { show } = this;
    if (show) {
      this.closeFlyoutPanel();
    }
  }

  didDisconnect() {
    super.didDisconnect();
    const { closeFlyoutPanel, locationChangeHandler, closeButton } = this;
    closeButton.removeEventListener('click', closeFlyoutPanel);
    document.removeEventListener(LOCATION_CHANGE_EVENT, locationChangeHandler);
  }

  closeFlyoutPanel() {
    this.bubble('onClose');
  }
}

definition('e-custom-flyout-panel', {
  props: {},
})(CustomFlyoutPanel);

export { CustomFlyoutPanel };
