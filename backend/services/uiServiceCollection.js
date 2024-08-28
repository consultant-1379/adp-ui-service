import ServiceCollection, { SERVICE_EVENTS } from '@adp/kubernetes/serviceCollection';
import k8sQueryService from './k8sQueryService.js';
import manualServiceConfigHandler from './manualServiceConfigHandler.js';
import { getLogger } from './logging.js';

const logger = getLogger();

const uiServiceCollection = new ServiceCollection(logger);

k8sQueryService.on(SERVICE_EVENTS.ADDED, (service) => {
  uiServiceCollection.addService(service);
});
k8sQueryService.on(SERVICE_EVENTS.MODIFIED, (service) => {
  uiServiceCollection.modifyService(service);
});
k8sQueryService.on(SERVICE_EVENTS.DELETED, (service) => {
  uiServiceCollection.deleteService(service);
});

manualServiceConfigHandler.on(SERVICE_EVENTS.ADDED, (service) => {
  uiServiceCollection.addService(service);
});
manualServiceConfigHandler.on(SERVICE_EVENTS.MODIFIED, (service) => {
  uiServiceCollection.modifyService(service);
});
manualServiceConfigHandler.on(SERVICE_EVENTS.DELETED, (service) => {
  uiServiceCollection.deleteService(service);
});

export default uiServiceCollection;
