import * as td from 'testdouble';
import Util from '../Utils.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';

const { SERVICE_CHANGE_TYPE } = Util;

const LOCALHOST_CONTEXT = 'http://localhost/context';

const SERVICE_ONE = {
  name: 'domain1',
  serviceurl: 'domain1:4000',
  ingressBaseurl: LOCALHOST_CONTEXT,
  protocol: 'http:',
  version: '1.0',
};

const SERVICE_ONE_MODIFIED = {
  name: 'domain1',
  serviceurl: 'domain1:5000',
  ingressBaseurl: LOCALHOST_CONTEXT,
  protocol: 'http:',
  version: '1.5',
};

const SERVICE_TWO = {
  name: 'domain2',
  serviceurl: 'domain2:4000',
  ingressBaseurl: LOCALHOST_CONTEXT,
  protocol: 'http:',
  version: '2.0',
};

const queryServiceMock = {
  on(eventType, callback) {
    switch (eventType) {
      case SERVICE_CHANGE_TYPE.ADD:
        this.addedEvent = callback;
        break;
      case SERVICE_CHANGE_TYPE.MODIFY:
        this.modifyEvent = callback;
        break;
      case SERVICE_CHANGE_TYPE.DELETE:
        this.deletedEvent = callback;
        break;
      default:
    }
  },
};

const copy = (object) => ({ ...object });

describe('Unit tests for UIServiceCollection', () => {
  let uiServiceCollection;
  let addedEventSpy;
  let deletedEventSpy;
  let modifiedEventSpy;

  const addSpies = () => {
    addedEventSpy = td.func();
    deletedEventSpy = td.func();
    modifiedEventSpy = td.func();
    uiServiceCollection.on(SERVICE_CHANGE_TYPE.ADD, addedEventSpy);
    uiServiceCollection.on(SERVICE_CHANGE_TYPE.DELETE, deletedEventSpy);
    uiServiceCollection.on(SERVICE_CHANGE_TYPE.MODIFY, modifiedEventSpy);
  };

  const addUID = (service) => {
    service.uid = uiServiceCollection.getServiceUID(service);
    return service;
  };

  const mockModules = async () => {
    await td.replaceEsm('../../services/k8sQueryService.js', null, queryServiceMock);
    await td.replaceEsm('../../services/manualServiceConfigHandler.js', null, queryServiceMock);
    await td.replaceEsm('../../services/logging.js', { ...loggingMock });
    uiServiceCollection = (await import('../../services/uiServiceCollection.js')).default;
    addSpies();
    td.reset();
  };

  beforeEach(async () => {
    await mockModules();
  });

  afterEach(() => {
    td.reset();
  });

  it('can trigger service added event from k8sQueryService', () => {
    queryServiceMock.addedEvent(copy(SERVICE_ONE));
    td.verify(addedEventSpy(addUID(copy(SERVICE_ONE))), {
      times: 1,
    });
    td.reset();
    queryServiceMock.addedEvent(copy(SERVICE_TWO));
    td.verify(addedEventSpy(addUID(copy(SERVICE_TWO))), {
      times: 1,
    });
  });

  it('can trigger service modified event from k8sQueryService', () => {
    queryServiceMock.addedEvent(copy(SERVICE_ONE));
    queryServiceMock.addedEvent(copy(SERVICE_TWO));
    queryServiceMock.modifyEvent(copy(SERVICE_ONE_MODIFIED));
    td.verify(modifiedEventSpy(addUID(copy(SERVICE_ONE_MODIFIED))), {
      times: 1,
    });
  });

  it('can trigger service deleted event from k8sQueryService', () => {
    queryServiceMock.addedEvent(copy(SERVICE_ONE));
    queryServiceMock.modifyEvent(copy(SERVICE_ONE_MODIFIED));
    queryServiceMock.deletedEvent(copy(SERVICE_ONE_MODIFIED));
    td.verify(deletedEventSpy(addUID(copy(SERVICE_ONE_MODIFIED))), {
      times: 1,
    });
  });

  it('can trigger service added event from manualService', () => {
    queryServiceMock.addedEvent(copy(SERVICE_ONE));
    td.verify(addedEventSpy(addUID(copy(SERVICE_ONE))), {
      times: 1,
    });
  });

  it('can trigger service modified event from manualService', () => {
    queryServiceMock.addedEvent(copy(SERVICE_ONE));
    queryServiceMock.modifyEvent(copy(SERVICE_ONE_MODIFIED));
    td.verify(modifiedEventSpy(addUID(copy(SERVICE_ONE_MODIFIED))), {
      times: 1,
    });
  });

  it('can trigger service deleted event from manualService', () => {
    queryServiceMock.addedEvent(copy(SERVICE_ONE));
    queryServiceMock.deletedEvent(copy(SERVICE_ONE));
    td.verify(deletedEventSpy(addUID(copy(SERVICE_ONE))), {
      times: 1,
    });
  });
});
