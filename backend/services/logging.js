import { logger } from '@adp/base';
import CONSTANTS from '../config/constants.js';

const { configureLogger, LOG_LEVELS, getLogger, setTelemetryService } = logger;

const loggingService = logger;

const DIRECT_LOG_SERVICE = 'logtransformer';
const DIRECT_LOG_POD_NAME = process.env.K8S_POD || 'N/A';
const DIRECT_LOG_METADATA = {
  namespace: process.env.K8S_NAMESPACE || 'N/A',
  node_name: process.env.K8S_NODE_NAME || 'N/A',
  container_name: process.env.K8S_CONTAINER || 'N/A',
  service_version: process.env.K8S_CHART_VERSION || 'N/A',
};

let configManager;
let certificateManager;

function getFullLogginConfig() {
  const loggerConfig = configManager.getLoggingConfig();
  const tlsOptions = certificateManager && certificateManager.getTLSOptions(DIRECT_LOG_SERVICE);
  const protocolOptions = tlsOptions
    ? {
        secureContext: tlsOptions.secureContext,
        ...tlsOptions.tlsAgent.options,
      }
    : undefined;
  if (loggerConfig.jsonTCPLog?.enabled) {
    loggerConfig.jsonTCPLog.tls = { ...loggerConfig?.tls, protocolOptions };
    loggerConfig.jsonTCPLog.metadata = DIRECT_LOG_METADATA;
    loggerConfig.jsonTCPLog.podName = DIRECT_LOG_POD_NAME;
  }
  if (loggerConfig.stdout.format === 'json') {
    loggerConfig.stdout.metadata = DIRECT_LOG_METADATA;
    loggerConfig.stdout.podName = DIRECT_LOG_POD_NAME;
  }

  return loggerConfig;
}

function addConfigListener(configManagerReference) {
  configManager = configManagerReference;
  configureLogger(getFullLogginConfig());
  configManager.on('config-changed', ({ name }) => {
    if (name === CONSTANTS.CONTAINER_CONFIG_NAME || name === CONSTANTS.LOG_CONTROL_NAME) {
      configureLogger(getFullLogginConfig());
    }
  });
}

function addCertificateListener(certificateManagerRef) {
  certificateManager = certificateManagerRef;
  configureLogger(getFullLogginConfig());
  certificateManager.on('certificates-changed', (serviceName) => {
    if (configManager && serviceName === DIRECT_LOG_SERVICE) {
      configureLogger(getFullLogginConfig());
    }
  });
}

export {
  loggingService,
  getLogger,
  addConfigListener,
  addCertificateListener,
  LOG_LEVELS,
  setTelemetryService,
};
