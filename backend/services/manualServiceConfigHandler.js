import ManualServiceConfigHandler from '@adp/kubernetes/manualConfigHandler';
import configManager from '../config/configManager.js';
import { getLogger } from './logging.js';
import CONSTANTS from '../config/constants.js';

const logger = getLogger();

const manualServiceConfigHandler = new ManualServiceConfigHandler({
  logger,
  serviceConfigList: configManager.getManualServiceConfig(),
});

configManager.on(
  'config-changed',
  ({ name }) =>
    name === CONSTANTS.MANUAL_SERVICE_CONFIG_NAME &&
    manualServiceConfigHandler.handleServiceConfigChange(configManager.getManualServiceConfig()),
);

export default manualServiceConfigHandler;
