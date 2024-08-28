import { Rest as RestCommon } from '@adp/ui-common';
import configManager from '../config/configManager.js';

import gasApiUrls from '../config/api-config.json' assert { type: 'json' };

const REQUEST_HEADER = {
  'Content-type': 'application/json',
};

class Rest extends RestCommon {
  constructor() {
    super();
    this.apiUrls = { ...gasApiUrls };
  }

  async getApps() {
    return this.makeRequest(`${this.apiUrls.meta.prefix}${this.apiUrls.meta.routes.apps.path}`);
  }

  setApiUrls(urls) {
    this.apiUrls = urls;
  }

  getApiUrls() {
    return this.apiUrls;
  }

  async getGroups() {
    return this.makeRequest(`${this.apiUrls.meta.prefix}${this.apiUrls.meta.routes.groups.path}`);
  }

  async getComponents() {
    return this.makeRequest(
      `${this.apiUrls.meta.prefix}${this.apiUrls.meta.routes.components.path}`,
    );
  }

  async sendLogEvent(logevent) {
    const options = {
      method: 'POST',
      headers: REQUEST_HEADER,
      body: JSON.stringify(logevent),
    };
    return this.makeRequest(
      `${this.apiUrls.logging.prefix}${this.apiUrls.logging.routes.logs.path}`,
      options,
      true,
    );
  }

  async getUserInfo() {
    return this.makeRequest(
      `${this.apiUrls.userPermission.prefix}${this.apiUrls.userPermission.routes.userInfo.path}`,
    );
  }

  getActionsUrl() {
    return `${this.apiUrls.meta.prefix}${this.apiUrls.meta.routes.actions.path}`;
  }
}

const rest = new Rest();

const config = await configManager.getConfig();
const isLocal = config?.rest && config.rest.hostname === 'localhost';

rest.setBaseContext(!isLocal ? config?.rest : null);

export default rest;
