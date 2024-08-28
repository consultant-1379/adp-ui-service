import K8sQueryService from '@adp/kubernetes/k8sQueryService';
import configManager from '../config/configManager.js';
import { getLogger } from './logging.js';
import fMHandler from './faultHandler/fMHandler.js';
import pmService from './pmService.js';

const logger = getLogger();

const k8sQueryService = new K8sQueryService({
  k8sConfig: configManager.getK8sQueryServiceConfig(),
  logger,
  fMHandler,
  pmService,
});

export default k8sQueryService;
