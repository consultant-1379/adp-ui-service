import configQueryService from '../services/configQueryService.js';
import configManager from '../config/configManager.js';

const isReady = () =>
  configQueryService.getApps().find((object) => object.service === configManager.getServiceName())
    ? 200
    : 503;

export { isReady };
