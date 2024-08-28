import { PerformanceMonitoring } from '@adp/pm-service';
import configManager from '../config/configManager.js';
import { getLogger } from './logging.js';

const logger = getLogger('metric');
const pmService = new PerformanceMonitoring({
  ...configManager.getPromConfig(),
  logger,
});

export default pmService;
