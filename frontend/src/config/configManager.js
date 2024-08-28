import { ConfigManager as CM } from '@adp/ui-common';
import defaultConfig from './launcher-config-default.js';
import constants from '../utils/constants.js';
import { getStaticPath } from '../utils/helper.js';

import deploymentConfigSchema from '../schemas/ui.deployment.config.json' assert { type: 'json' };

const { CONFIG_LOCATION } = constants;

class ConfigManager extends CM {
  constructor() {
    super({
      defaultConfig,
      schema: deploymentConfigSchema,
      path: `${getStaticPath()}${CONFIG_LOCATION}`,
    });
  }

  getUserPermissionConfig() {
    return this.config.userPermission;
  }

  getLoggerConfig() {
    return this.config.logging;
  }

  getLogLevel() {
    return this.getLoggerConfig().logLevel;
  }

  getLogoutURL() {
    return this.config.logoutURL;
  }

  getUserAccountURL() {
    return this.config.userAccountURL;
  }

  getUiSettings() {
    return this.config.uiSettings;
  }
}

export default new ConfigManager();
