import { ConfigManager } from '@adp/base';
import { createRequire } from 'module';
import CONSTANTS from './constants.js';
import { getLogger, addConfigListener } from '../services/logging.js';

const require = createRequire(import.meta.url);
const defaultBackendConfig = require('./backend-service-config-default.json');
const defaultlogControl = require('./logcontrol-default.json');
const manualConfigSchema = require('../schemas/ui.config.json');
const manualConfigOverrideSchema = require('../schemas/ui.config.override.json');
const manualOverridesSchema = require('../schemas/ui.manual.overrides.json');
const appSchema = require('../schemas/ui.app.json');
const componentSchema = require('../schemas/ui.component.json');
const groupMappingSchema = require('../schemas/ui.config.groupMappings.json');
const entitySchema = require('../schemas/ui.entity.json');
const appOverrideSchema = require('../schemas/ui.app.override.json');
const componentOverrideSchema = require('../schemas/ui.component.override.json');
const entityOverrideSchema = require('../schemas/ui.entity.override.json');
const logControlSchema = require('../schemas/logcontrol.json');
const dstCollectorSamplingConfigSchema = require('../schemas/dstCollectorSamplingConfig.json');
const actionSchema = require('../schemas/ui.actions.json');
const actionMetaIconSchema = require('../schemas/ui.actions.meta.icon.json');

const logger = getLogger();

class BackendConfigManager extends ConfigManager {
  getConfig() {
    return this.get(CONSTANTS.CONTAINER_CONFIG_NAME);
  }

  getManualServiceConfig() {
    return this.get(CONSTANTS.MANUAL_SERVICE_CONFIG_NAME)?.serviceList;
  }

  getManualConfig() {
    return this.get(CONSTANTS.MANUAL_CONFIG_NAME);
  }

  getManualOverrides() {
    return this.get(CONSTANTS.MANUAL_OVERRIDES);
  }

  getDstCollectorConfig() {
    return this.get(CONSTANTS.DST_COLLECTOR_CONFIG_NAME);
  }

  discoverIngress() {
    return this.getConfig().discoverIngress;
  }

  ingressPath() {
    return this.getConfig().ingressPath;
  }

  useHttps() {
    return this.getConfig().useHttps;
  }

  verifyClientCertificate() {
    return this.getConfig().verifyClientCertificate === 'required';
  }

  getCertificatePath() {
    return CONSTANTS.CERTIFICATES_DIR;
  }

  getDependenciesConfig() {
    return this.getConfig().dependencies;
  }

  getLoggingConfig() {
    if (!this.getConfig().logging) {
      return undefined;
    }
    const { defaultLogLevel } = this.getConfig().logging;
    const logControl = this.get(CONSTANTS.LOG_CONTROL_NAME);
    // Use the severity from log-control for the defaultLogLevel if exists
    const desiredDefaultLogLevel =
      logControl.find((control) => control.container === 'main')?.severity ?? defaultLogLevel;
    return {
      ...this.getConfig().logging,
      ...{ defaultLogLevel: desiredDefaultLogLevel },
      ...this.getConfig().dependencies?.logtransformer,
      ...{ tls: { enabled: this.useHttps() } },
    };
  }

  getApps() {
    return this.getManualConfig().apps || [];
  }

  getActions() {
    return this.getManualConfig().actions || {};
  }

  getGroups() {
    return this.getManualConfig().groups || [];
  }

  getPromConfig() {
    return this.getConfig().dependencies?.prometheus || {};
  }

  getFaultManagerConfig() {
    return {
      ...this.getConfig().faultIndications,
      ...this.getConfig().dependencies?.faultHandler,
      tls: {
        ...this.getConfig().dependencies?.faultHandler?.tls,
        enabled: this.useHttps(),
      },
    };
  }

  getServiceName() {
    return this.getConfig().serviceName;
  }

  getServicePort() {
    return this.getConfig().servicePort;
  }

  getK8sQueryServiceConfig() {
    return {
      labelName: this.getConfig().k8sLabelPropertyName,
      labelValue: this.getConfig().k8sLabelValue,
      configFetch: {
        configFetchTlsOption: CONSTANTS.TLS_TYPE_INTERNAL_GUI,
        configFetchMaxTry: CONSTANTS.CONFIG_FETCH_MAX_TRY,
        configFetchRetryPeriod: CONSTANTS.CONFIG_FETCH_RETRY_PERIOD,
      },
      queryProtocolAnnotation: this.getConfig().configQueryProtocolAnnotation,
      queryPortAnnotation: this.getConfig().configQueryPortAnnotation,
      extraAnnotations: { externalURLPrefix: this.getConfig().k8sExternalUrlAnnotation },
      appNameLabel: this.getConfig().appNameLabel,
      appVersionLabel: this.getConfig().appVersionLabel,
      uiContentConfigContextAnnotation: this.getConfig().uiContentConfigContextAnnotation,
      discoverIngress: this.discoverIngress(),
      ingressTlsPort: CONSTANTS.INGRESS_TLS_PORT,
      ingressHttpPort: CONSTANTS.INGRESS_HTTP_PORT,
      nodeEnvironment: process.env.NODE_ENV,
      bridge: {
        kubernetesServiceHost: process.env.KUBERNETES_SERVICE_HOST,
        kubernetesServicePort: process.env.KUBERNETES_SERVICE_PORT,
      },
      useHttps: this.getConfig().useHttps,
    };
  }

  getSynchronizationConfig() {
    return {
      headlessServiceName: this.getConfig().headlessServiceName,
      servicePort: this.getConfig().servicePort,
      useHttps: this.getConfig().useHttps,
    };
  }

  getUserPermissionConfig() {
    return this.getConfig().dependencies.gasIam;
  }

  getGuiContext() {
    return this.getConfig().guiContext;
  }
}

const configManager = new BackendConfigManager(
  [
    {
      name: CONSTANTS.CONTAINER_CONFIG_NAME,
      filePath: CONSTANTS.CONTAINER_CONFIG_FILE,
      defaultValue: defaultBackendConfig,
    },
    {
      name: CONSTANTS.LOG_CONTROL_NAME,
      filePath: CONSTANTS.LOG_CONTROL_FILE,
      schema: logControlSchema,
      defaultValue: defaultlogControl,
    },
    {
      name: CONSTANTS.DST_COLLECTOR_CONFIG_NAME,
      filePath: CONSTANTS.DST_CONTROLLER_CONFIG_FILE,
      schema: dstCollectorSamplingConfigSchema,
    },
    {
      name: CONSTANTS.MANUAL_SERVICE_CONFIG_NAME,
      filePath: CONSTANTS.MANUAL_SERVICE_CONFIG_FILE,
    },
    {
      name: CONSTANTS.MANUAL_OVERRIDES,
      filePath: CONSTANTS.MANUAL_OVERRIDES_FILE,
      schema: manualOverridesSchema,
      additionalSchemaList: [
        manualConfigOverrideSchema,
        appOverrideSchema,
        componentOverrideSchema,
        entityOverrideSchema,
        groupMappingSchema,
      ],
    },
    {
      name: CONSTANTS.MANUAL_CONFIG_NAME,
      filePath: CONSTANTS.MANUAL_CONFIG_FILE,
      schema: manualConfigSchema,
      additionalSchemaList: [
        appSchema,
        componentSchema,
        entitySchema,
        actionSchema,
        actionMetaIconSchema,
      ],
    },
  ],
  logger,
);

addConfigListener(configManager);

export default configManager;
