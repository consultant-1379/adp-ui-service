import { expect } from 'chai';
import { createRequire } from 'module';
import { EventEmitter } from 'events';
import td from '../testdouble.js';
import CONSTANTS from '../../config/constants.js';

const require = createRequire(import.meta.url);
const faultIndicationDefaultsMap = require('../../services/faultHandler/faultIndicationDefaultsMap.json');

let fMHandler;
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

const configManagerMock = new EventEmitter();
configManagerMock.getFaultManagerConfig = () => baseFaultManagerConfig;

const certificateManagerMock = new EventEmitter();
certificateManagerMock.getTLSOptions = () => ({ tlsAgent: true });

const loggingServiceMock = new EventEmitter();
const loggerMock = {
  loggingService: loggingServiceMock,
  logger: {
    error: () => true,
    info: () => true,
    debug: () => true,
  },
  getLogger() {
    return loggerMock.logger;
  },
};

const faultManagerConfig = configManagerMock.getFaultManagerConfig();

const fMConfig = {
  faultManagerConfig,
  faultIndicationMap: faultIndicationDefaultsMap,
  logger: loggerMock.getLogger(),
  tlsAgent: true,
  useHttps: faultManagerConfig.tls.enabled,
};

describe('Unit tests for fMHandler.js', () => {
  let produceFaultIndicationSpy;
  let setFaultManagerConfigSpy;
  let getFaultManagerConfigSpy;
  let getTLSOptionsSpy;
  const mockModules = async () => {
    await td.replaceEsm('../../config/configManager.js', null, configManagerMock);
    await td.replaceEsm('../../services/logging.js', loggerMock);
    await td.replaceEsm('../../services/certificateManager.js', null, certificateManagerMock);
    fMHandler = (await import('../../services/faultHandler/fMHandler.js')).default;
    td.reset();
  };

  beforeEach(async function before() {
    this.timeout(10_000);

    await mockModules();

    produceFaultIndicationSpy = td.replace(fMHandler, 'produceFaultIndication');
    getFaultManagerConfigSpy = td.spyProp(configManagerMock, 'getFaultManagerConfig');
    getTLSOptionsSpy = td.spyProp(certificateManagerMock, 'getTLSOptions');
    setFaultManagerConfigSpy = td.replace(fMHandler, 'setConfig');
  });

  afterEach(() => {
    td.reset();
  });

  it('should listen to "config-changed" event', () => {
    configManagerMock.emit('config-changed', { name: CONSTANTS.CONTAINER_CONFIG_NAME });

    expect(td.explain(getFaultManagerConfigSpy).callCount > 0).to.be.true;

    td.verify(setFaultManagerConfigSpy(fMConfig), {
      times: 1,
    });
  });

  it('should listen to certificate changes', () => {
    certificateManagerMock.emit('certificates-changed', 'faultHandler');

    expect(td.explain(getFaultManagerConfigSpy).callCount > 0).to.be.true;

    td.verify(setFaultManagerConfigSpy(fMConfig), { times: 1 });

    td.verify(getTLSOptionsSpy(), {
      ignoreExtraArgs: true,
    });
  });

  it('should produce fault indication on reading service certificate error', () => {
    const certDir = 'path/to/certificate';
    const fmHandlerArg = {
      fault: 'CERTIFICATE_ERROR',
      customConfig: {
        description: `Service certificate missing. Could not read certificate files for ${certDir}.`,
      },
    };
    certificateManagerMock.emit('certificates-read-error', certDir);

    td.verify(produceFaultIndicationSpy(fmHandlerArg), { times: 1 });
  });

  it('should produce fault indication on reading server certificate error', () => {
    const certDir = 'path/to/certificate';
    const fmHandlerArg = {
      fault: 'CERTIFICATE_ERROR',
      customConfig: {
        description: `Server certificate missing. Could not read certificate files for ${certDir}.`,
      },
    };
    certificateManagerMock.emit('server-certificates-read-error', certDir);

    td.verify(produceFaultIndicationSpy(fmHandlerArg), { times: 1 });
  });

  it('should produce fault indication on logging terminate connection', () => {
    const errorMessage = 'JsonTCP Error, connection terminated.';
    const fmHandlerArg = {
      fault: 'LOG_TRANSFORMER_ERROR',
      customConfig: {
        description: errorMessage,
      },
    };
    loggerMock.loggingService.emit('jsontcp-error', new Error(errorMessage));

    td.verify(produceFaultIndicationSpy(fmHandlerArg), { times: 1 });
  });
});
