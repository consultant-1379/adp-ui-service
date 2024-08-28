import readyEndpoint from './mocks/serviceobjects/ready.endpointobject.js';
import k8sClientMock from './mocks/modules/k8s.client.mock.js';

const RESOURCE_CHANGE_TYPE = {
  ADD: 'ADDED',
  DELETE: 'DELETED',
  MODIFY: 'MODIFIED',
};

const SERVICE_CHANGE_TYPE = {
  ADD: 'service-added',
  DELETE: 'service-deleted',
  MODIFY: 'service-modified',
};

export default {
  RESOURCE_CHANGE_TYPE,
  SERVICE_CHANGE_TYPE,

  async requestDomainService(serviceObject, headless = false) {
    const servicePromise = k8sClientMock.Watch.servicesCallback(
      RESOURCE_CHANGE_TYPE.ADD,
      serviceObject,
    );
    if (!headless) {
      await k8sClientMock.Watch.endpointsCallback(
        RESOURCE_CHANGE_TYPE.ADD,
        Object.assign(readyEndpoint, { metadata: { name: serviceObject.metadata.name } }),
      );
    }
    return servicePromise;
  },
};
