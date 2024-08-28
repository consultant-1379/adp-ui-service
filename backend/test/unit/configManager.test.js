import { expect } from 'chai';
import { createRequire } from 'module';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import chokidarMock from '../mocks/modules/chokidarMock.js';
import fsMock from '../mocks/modules/fsMock.js';

const require = createRequire(import.meta.url);
const defaultConfig = require('../../config/backend-service-config-default.json');
const testConfig = require('../../config/backend-service-config/backend-service-config.json');
const testManualConfig = require('../mocks/configs/manualconfig-test.config.json');
const testLoggingConfig = require('../mocks/dummyfiles/logControl-config.json');

describe('Unit tests for configManager.js', () => {
  let configManager;

  const mockModules = async () => {
    await td.replaceEsm('../../services/logging.js', { ...loggingMock });
    await td.replaceEsm('chokidar', null, chokidarMock);
    await td.replaceEsm(
      'fs',
      fsMock({
        uiServiceConfig: testConfig,
        manualConfig: testManualConfig,
        logControlConfig: testLoggingConfig,
      }),
    );
    configManager = (await import('../../config/configManager.js')).default;
    td.reset();
  };

  before(async () => {
    await mockModules();
  });

  after(() => {
    configManager.stopAllConfigWatch();
  });

  it('configManager instance should not be undefined', () => {
    expect(configManager).to.be.not.undefined;
  });

  it('configManager should have required methods', () => {
    expect(configManager.on).to.be.not.undefined;
    expect(configManager.get).to.be.not.undefined;
    expect(configManager.startConfigWatch).to.be.not.undefined;
    expect(configManager.stopAllConfigWatch).to.be.not.undefined;
  });

  it('can successfully read the default configuration', () => {
    const verifyCertDefault = defaultConfig.verifyClientCertificate === 'required';
    expect(configManager.verifyClientCertificate()).to.eq(verifyCertDefault);
    expect(configManager.getServicePort()).to.eq(defaultConfig.servicePort);
  });

  it('can successfully read the manual configuration', () => {
    expect(JSON.stringify(configManager.getManualConfig())).to.eq(JSON.stringify(testManualConfig));
  });

  it('getLoggingConfig() should return the merged logging config with logtransformer and log-control config', () => {
    const loggingConf = configManager.getLoggingConfig();
    expect(loggingConf.defaultLogLevel).to.exist;
    expect(loggingConf.defaultLogLevel).to.equal('debug');
    expect(loggingConf.tls.enabled).to.exist;
  });

  it('can successfully read the K8S service configuration', () => {
    const k8sConfig = configManager.getK8sQueryServiceConfig();
    expect(k8sConfig.labelName).to.exist;
    expect(k8sConfig.configFetch.configFetchMaxTry).to.exist;
  });

  it('can successfully fetch Synchronization service configuration', () => {
    const syncConfig = configManager.getSynchronizationConfig();
    expect(syncConfig.headlessServiceName).to.exist;
    expect(syncConfig.servicePort).to.exist;
    expect(syncConfig.useHttps).to.exist;
  });
});
