import { EventEmitter } from 'events';
import { createRequire } from 'module';
import CONSTANTS from '../../../config/constants.js';

const require = createRequire(import.meta.url);
const defaultConfig = require('../../../config/backend-service-config-default.json');

class ConfigManagerMock extends EventEmitter {
  get(configName) {
    return configName === CONSTANTS.CONTAINER_CONFIG_NAME ? defaultConfig : {};
  }

  startConfigWatch() {
    return null;
  }

  stopAllConfigWatch() {
    return null;
  }

  getConfig() {
    return null;
  }

  getManualConfig() {
    return null;
  }

  getManualServiceConfig() {
    return null;
  }

  discoverIngress() {
    return null;
  }

  ingressPath() {
    return null;
  }

  useHttps() {
    return null;
  }

  verifyClientCertificate() {
    return null;
  }

  getCertificatePath() {
    return null;
  }

  getDependenciesConfig() {
    return null;
  }

  getK8sLabelPropertyName() {
    return null;
  }

  getK8sLabelValue() {
    return null;
  }

  getK8sExternalUrlAnnotation() {
    return null;
  }

  getConfigQueryProtocolAnnotation() {
    return null;
  }

  getUiContentConfigContextAnnotation() {
    return null;
  }

  getConfigQueryPortAnnotation() {
    return null;
  }

  getAppNameLabel() {
    return null;
  }

  getAppVersionLabel() {
    return null;
  }

  getLoggingConfig() {
    return null;
  }

  getApps() {
    return null;
  }

  getGroups() {
    return null;
  }

  getPromConfig() {
    return null;
  }

  getFaultManagerConfig() {
    return null;
  }

  getDstCollectorConfig() {
    return null;
  }

  getServiceName() {
    return null;
  }

  getHeadlessServiceName() {
    return null;
  }

  getServicePort() {
    return null;
  }

  getSynchronizationConfig() {
    return null;
  }
}

export default ConfigManagerMock;
