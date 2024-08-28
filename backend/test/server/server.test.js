import { expect } from 'chai';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import ConfigManagerMock from '../mocks/modules/configManagerMock.js';
import CertificateManagerMock from '../mocks/modules/certificateManagerMock.js';

const loggerMock = {
  info: td.func(),
  warning: td.func(),
  error: td.func(),
  debug: td.func(),
  critical: td.func(),
};

describe('Node.js server tests', () => {
  const configManagerMock = new ConfigManagerMock();

  const appMock = {
    set: td.func(),
    close: td.func(),
  };

  const metricAppMock = {
    set: td.func(),
    close: td.func(),
  };

  const baseFaultManagerConfig = {
    enabled: false,
    tls: {
      enabled: false,
    },
    hostname: 'temp-hostname',
    tlsPort: 6006,
    httpPort: 6005,
    serviceName: 'service-name',
  };

  before(async () => {
    configManagerMock.getFaultManagerConfig = () => baseFaultManagerConfig;
    await td.replaceEsm('../../services/logging.js', {
      ...loggingMock,
      getLogger: () => loggerMock,
    });
    await td.replaceEsm('../../services/certificateManager.js', null, new CertificateManagerMock());
    await td.replaceEsm('../../config/configManager.js', null, configManagerMock);
    await td.replaceEsm('../../app.js', null, appMock);
    await td.replaceEsm('../../metricApp.js', null, metricAppMock);
    await import('../../bin/www.js');
  });

  after(() => {
    td.reset();
  });

  it('can shut down gracefully', async () => {
    process.kill(process.pid, 'SIGTERM');

    const wait = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          const closeExpl = td.explain(appMock.close);
          if (closeExpl.callCount === 1) {
            resolve(closeExpl);
          }
        }, 500);
      });

    const explanation = await wait();
    expect(explanation.callCount).to.eq(1);
  });
});
