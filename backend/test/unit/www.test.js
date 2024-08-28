import EventEmitter from 'events';

import td from '../testdouble.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import ConfigManagerMock from '../mocks/modules/configManagerMock.js';

const loggerMock = {
  info: td.func(),
  warning: td.func(),
  error: td.func(),
  debug: td.func(),
  critical: td.func(),
};

const loggingModule = {
  ...loggingMock,
  getLogger: () => loggerMock,
};

const fmHandlerMock = {
  produceFaultIndication: td.func(),
};

const appMock = { close: td.func(), set: td.func() };
const metricAppMock = { close: td.func(), set: td.func() };

const serverMock = {
  setSecureContext: td.func(),
  address: td.func(),
  listen: td.func(),
  on: td.func(),
  close: td.func(),
};

const httpsMock = { createServer: () => serverMock };

const certificateManagerMock = new EventEmitter();
const httpsOptsMock = { ca: 'mockCa', cert: 'mockCert' };
certificateManagerMock.getServerHttpsOpts = () => httpsOptsMock;

const CERT_CHANGE_EVENT_NAME = 'server-certificates-changed';

describe('Unit tests for WWW', () => {
  const configManagerMock = new ConfigManagerMock();
  configManagerMock.useHttps = () => true;

  let getLoggerSpy;
  let configManagerSpy;
  let httpsSpy;
  let certManagerSpy;

  before(async () => {
    await td.replaceEsm('../../services/logging.js', loggingModule);
    await td.replaceEsm('../../config/configManager.js', null, configManagerMock);
    await td.replaceEsm('../../services/faultHandler/fMHandler.js', null, fmHandlerMock);
    await td.replaceEsm('../../app.js', null, appMock);
    await td.replaceEsm('../../metricApp.js', null, metricAppMock);
    await td.replaceEsm('../../services/certificateManager.js', null, certificateManagerMock);
    await td.replaceEsm('https', null, httpsMock);

    getLoggerSpy = td.spyProp(loggingModule, 'getLogger');
    configManagerSpy = td.spyProp(configManagerMock, 'useHttps');
    httpsSpy = td.spyProp(httpsMock, 'createServer');
    certManagerSpy = td.spyProp(certificateManagerMock, 'getServerHttpsOpts');

    await import('../../bin/www.js');
  });

  after(() => {
    td.reset();
  });

  it('Should start and properly configure https server', async () => {
    td.verify(getLoggerSpy());
    td.verify(configManagerSpy());
    td.verify(certManagerSpy());
    td.verify(httpsSpy(httpsOptsMock, td.matchers.anything()));
  });

  it('Should watch the cert manager and update the server on CA changes', () => {
    certificateManagerMock.emit(CERT_CHANGE_EVENT_NAME);
    td.verify(certificateManagerMock.getServerHttpsOpts(), { times: 2 });
    td.verify(serverMock.setSecureContext(httpsOptsMock), { times: 2 });
  });
});
