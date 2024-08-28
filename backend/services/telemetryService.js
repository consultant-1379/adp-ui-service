import Telemetry from '@adp/telemetry';
import certificateManager from './certificateManager.js';
import configManager from '../config/configManager.js';
import CONSTANTS from '../config/constants.js';

const telemetryService = new Telemetry({
  agent: certificateManager.getTLSOptions(CONSTANTS.TLS_TYPE_DST_COLLECTOR)?.tlsAgent || null,
  serviceName: configManager.getServiceName(),
});

telemetryService.refreshRatio(configManager.getDstCollectorConfig());

function refreshAgent() {
  const httpsAgent =
    certificateManager.getTLSOptions(CONSTANTS.TLS_TYPE_DST_COLLECTOR)?.tlsAgent || null;
  telemetryService.refreshAgent(httpsAgent);
}

certificateManager.on('certificates-changed', refreshAgent);
configManager.on('config-changed', ({ name }) => {
  if (name === CONSTANTS.DST_COLLECTOR_CONFIG_NAME) {
    telemetryService.refreshRatio(configManager.getDstCollectorConfig());
  }
});

export default telemetryService;
