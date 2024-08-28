import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const NODEPORT_HOSTNAME = path.join(__dirname, '../../../../tilt.nodeport.hostname.txt');

const require = createRequire(import.meta.url);

const checkForLocalNodeport = () => fs.existsSync(NODEPORT_HOSTNAME);
class ConfigUtil {
  constructor(servicesToTest) {
    this.SERVICES = servicesToTest;
    this.tiltDeployment = false;
    const { KUBERNETES_MASTER_NODE, SERVICE_PATH } = process.env;

    switch (true) {
      case !!process.env.KUBERNETES_MASTER_NODE && !!process.env.SERVICE_PATH:
        this.INGRESS_SERVICE_URL = `https://${KUBERNETES_MASTER_NODE}`;
        this.SERVICE_URL = `https://${KUBERNETES_MASTER_NODE}${SERVICE_PATH}`;
        this.DISCOVERED_INGRESS = `http://${KUBERNETES_MASTER_NODE}/domainapp-eea-${SERVICE_PATH.substring(
          1,
        )}`;
        break;
      case !!process.env.NODEPORT && !!process.env.WORKER_NODE:
        this.SERVICE_URL = `http://${process.env.WORKER_NODE}.seli.gic.ericsson.se:${process.env.NODEPORT}`;
        this.DISCOVERED_INGRESS = '';
        this.INGRESS_SERVICE_URL = `http://${process.env.WORKER_NODE}.seli.gic.ericsson.se:${process.env.NODEPORT}`;
        break;
      case checkForLocalNodeport():
        this.SERVICE_URL = `http://${fs.readFileSync(NODEPORT_HOSTNAME, 'utf8')}`;
        this.DISCOVERED_INGRESS = `http://demo-ui-service-eea-http:4000/ui-manual`;
        this.INGRESS_SERVICE_URL = `http://${fs.readFileSync(NODEPORT_HOSTNAME, 'utf8')}`;
        this.tiltDeployment = true;
        break;
      default:
        this.INGRESS_SERVICE_URL = 'http://localhost:3001';
        this.SERVICE_URL = 'http://localhost:3001';
        this.DISCOVERED_INGRESS = 'http://localhost/domainapp-eea-';
        break;
    }

    this.getConfigs();
  }

  getConfigs() {
    this.APPS_RESP = [];
    this.GROUPS_RESP = [];
    this.COMPONENTS_RESP = [];
    this.ACTIONS_RESP = [];

    this.SERVICES.forEach((serviceToTest) => {
      const configJson = JSON.parse(
        // eslint-disable-next-line import/no-dynamic-require
        JSON.stringify(require(`${serviceToTest.folderPath}/config.json`)),
      );

      // needed for groupMappings integration tests, update it based on the PCR and DROP chart values
      const index = configJson.apps?.findIndex((app) => app.name === 'charts');
      if (index > -1) {
        configJson.apps[index].groupNames.push('mock-group');
      }

      const appList = (configJson.apps ?? []).map((app) => ({
        ...app,
        ...(app.url
          ? { url: app.url.startsWith('/') ? `${this.DISCOVERED_INGRESS}${app.url}` : app.url }
          : undefined),
        ...(serviceToTest.deploymentName ? { service: serviceToTest.deploymentName } : undefined),
      }));
      this.APPS_RESP = this.APPS_RESP.concat(appList);

      const componentList = (configJson.components ?? []).map((component) => ({
        ...component,
        service: serviceToTest.deploymentName,
      }));
      this.COMPONENTS_RESP = this.COMPONENTS_RESP.concat(componentList);

      this.GROUPS_RESP = this.GROUPS_RESP.concat(...(configJson.groups ?? []));

      this.ACTIONS_RESP = this.ACTIONS_RESP.concat(...(configJson.actions ?? []));
    });
  }

  getServiceUrl() {
    console.log('Service URL: ', this.SERVICE_URL);
    return this.SERVICE_URL;
  }

  getIngressURL() {
    return this.INGRESS_SERVICE_URL;
  }

  getAppsResponse() {
    return this.APPS_RESP;
  }

  getGroupsResponse() {
    return this.GROUPS_RESP;
  }

  getComponentResponse() {
    return this.COMPONENTS_RESP;
  }

  getActionsResponse() {
    return this.ACTIONS_RESP;
  }
}

export default ConfigUtil;
