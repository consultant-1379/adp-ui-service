import { FaultHandler } from '@adp/fault-handler';
import { createRequire } from 'module';
import configManager from '../../config/configManager.js';
import certificateManager from '../certificateManager.js';
import { loggingService, getLogger } from '../logging.js';
import CONSTANTS from '../../config/constants.js';

const require = createRequire(import.meta.url);
const faultIndicationMap = require('./faultIndicationDefaultsMap.json');

const SERVICE_NAME = 'faultHandler';

function getFaultManagerConfig() {
  const faultManagerConfig = configManager.getFaultManagerConfig();

  const { tlsAgent } = certificateManager?.getTLSOptions(SERVICE_NAME) || {};
  return {
    faultManagerConfig,
    faultIndicationMap,
    logger: getLogger(),
    tlsAgent,
    useHttps: faultManagerConfig.tls.enabled,
  };
}

const fMHandler = new FaultHandler(getFaultManagerConfig());

configManager.on('config-changed', ({ name }) => {
  if (name === CONSTANTS.CONTAINER_CONFIG_NAME) {
    const config = getFaultManagerConfig();
    if (config) {
      fMHandler.setConfig(config);
    }
  }
});

certificateManager.on('certificates-changed', (serviceName) => {
  if (serviceName === SERVICE_NAME) {
    const config = getFaultManagerConfig();
    if (config) {
      fMHandler.setConfig(config);
    }
  }
});

certificateManager.on('certificates-read-error', (certDir) => {
  fMHandler.produceFaultIndication({
    fault: 'CERTIFICATE_ERROR',
    customConfig: {
      description: `Service certificate missing. Could not read certificate files for ${certDir}.`,
    },
  });
});

certificateManager.on('server-certificates-read-error', (certDir) => {
  fMHandler.produceFaultIndication({
    fault: 'CERTIFICATE_ERROR',
    customConfig: {
      description: `Server certificate missing. Could not read certificate files for ${certDir}.`,
    },
  });
});

loggingService.on('jsontcp-error', (err) => {
  const errorMessage = err?.message || 'JsonTCP Logging Error';
  fMHandler.produceFaultIndication({
    fault: 'LOG_TRANSFORMER_ERROR',
    customConfig: {
      description: errorMessage,
    },
  });
});

export default fMHandler;
