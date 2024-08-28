import { expect } from 'chai';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import ConfigManagerMock from '../mocks/modules/configManagerMock.js';

describe('Unit tests for certificateManager.js', () => {
  let certificateManager;
  const mockedAddCertificateListener = td.func();
  const mockModules = async () => {
    await td.replaceEsm('../../services/logging.js', {
      ...loggingMock,
      addCertificateListener: mockedAddCertificateListener,
    });
    await td.replaceEsm('../../config/configManager.js', null, new ConfigManagerMock());
    await td.replaceEsm('@adp/base', { CertificateManager: class {} });
    certificateManager = (await import('../../services/certificateManager.js')).default;
  };
  before(async () => {
    await mockModules();
  });

  after(() => {
    td.reset();
  });

  it('certificateManager instance should not be undefined', () => {
    expect(certificateManager).to.be.not.undefined;
  });

  it('certificateManager is registered for the logger', () => {
    td.verify(mockedAddCertificateListener(certificateManager), { times: 1 });
  });
});
