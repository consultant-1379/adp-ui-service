import { expect } from 'chai';
import https from 'https';
import { createRequire } from 'module';
import { EventEmitter } from 'events';
import td from '../testdouble.js';
import nodeFetchMock, { HeadersMock, RequestMock } from '../mocks/modules/nodeFetch.mock.js';
import PmServiceMock from '../mocks/services/pmServiceMock.js';
import TelemetryServiceMock from '../mocks/services/telemetryServiceMock.js';
import CONSTANTS from '../mocks/modules/constants.js';

const require = createRequire(import.meta.url);
const appConfig = require('../mocks/configs/domain-app1.config.json');
const packageConfig = require('../mocks/configs/domain-app1.config.package.json');
const appConfigForConfigContext = require('../mocks/configs/domain-app3.config.json');
const packageConfigForConfigContext = require('../mocks/configs/domain-app3.config.package.json');
const manualConfigJson = require('../mocks/configs/manualconfig-test.config.json');
const manualConfigWithNonMatchingOverrides = require('../mocks/configs/manualconfig-test-with-not-matching-overrides.config.json');
const manualConfigForUpdate = require('../mocks/configs/manualconfig-for-update-test.config.json');
const manualOverridesTestConfig = require('../mocks/configs/manualoverrides-test.config.json');
const expectedManualConfigMerged = require('../mocks/configs/manualconfig-merged.json');

const CONFIG_EVENT = 'config-changed';

const UID = 'domain-service-1-1.0.2-2';
const LOCALHOST_CONTEXT = 'http://localhost/context';
const CUSTOM_CONFIG_CONTEXT = '/configContext';
const SERVICE_URL = 'domain1:4000';

const SERVICE_WITH_BASEURL = {
  protocol: 'http',
  name: 'domain1',
  uid: UID,
  serviceurl: SERVICE_URL,
  ingressBaseurl: LOCALHOST_CONTEXT,
  uiContentConfigContext: CONSTANTS.DEFAULT_UI_CONTEXT,
};

const SERVICE_WITHOUT_PACKAGE_CONFIG = {
  protocol: 'http',
  name: 'domain101',
  uid: UID,
  serviceurl: 'domain4:4000',
  ingressBaseurl: LOCALHOST_CONTEXT,
  uiContentConfigContext: CONSTANTS.DEFAULT_UI_CONTEXT,
};

const SERVICE_WITH_CONFIG_CONTEXT_PATH = {
  protocol: 'http',
  name: 'domain1',
  uid: UID,
  serviceurl: SERVICE_URL,
  ingressBaseurl: LOCALHOST_CONTEXT,
  uiContentConfigContext: CUSTOM_CONFIG_CONTEXT,
};

const EXPECTED_APPS = [
  // eslint-disable-next-line sonarjs/no-duplicate-string
  { ...appConfig.apps[0], service: 'domain1', url: 'http://localhost/context/domain-app-1' },
];
const EXPECTED_APPS_MISSING_CONFIG = [
  { ...appConfig.apps[0], service: 'domain101', url: 'http://localhost/context/domain-app-1' },
];
const EXPECTED_COMPONENTS = [{ ...appConfig.components[0], service: 'domain1' }];
const EXPECTED_COMPONENTS_MISSING_CONFIG = [{ ...appConfig.components[0], service: 'domain101' }];

const EXPECTED_APPS_FROM_CONTEXT = [
  {
    ...appConfigForConfigContext.apps[0],
    service: 'domain1',
    url: 'http://localhost/context/domain-app-3',
  },
];
const EXPECTED_COMPONENTS_FROM_CONTEXT = [
  { ...appConfigForConfigContext.components[0], service: 'domain1' },
];

const EXPECTED_APPS_MERGED = [
  { ...expectedManualConfigMerged.apps[0] },
  { ...expectedManualConfigMerged.apps[1] },
  { ...expectedManualConfigMerged.apps[2], service: 'domain1' },
];
const EXPECTED_GROUP_OVERRIDE_APP = {
  displayName: 'GroupMapping mock',
  version: '0.1.0',
  route: 'http://localhost:1111/group-mapping',
  descriptionLong: 'Dummy external app for groupMapping test.',
  name: 'group-mapping-app',
  groupNames: ['group-mapping-group'],
};

const EXPECTED_PACKAGES = packageConfig.modules;
const EXPECTED_PACKAGES_FROM_CONTEXT = packageConfigForConfigContext.modules;

const EXPECTED_OVERRIDE_GROUP = {
  displayName: 'Nova explorer new group name',
  version: '0.1.0',
  name: 'nova',
  type: 'category',
  descriptionLong: 'New long description.',
};

const EXPECTED_OVERRIDE_APP = {
  displayName: 'Nova Explorer New Name',
  version: '0.1.0',
  url: 'http://localhost:9999/nova-explorer-new-route',
  descriptionLong: 'Dummy external app for testing purposes.',
  name: 'nova1',
  groupNames: ['nova', 'new_group'],
  type: 'external',
};
const uiServiceCollectionMock = {
  on: () => undefined,
};

const configManagerMock = new EventEmitter();
configManagerMock.getApps = () => [];
configManagerMock.getGroups = () => [];
configManagerMock.getActions = () => {};
configManagerMock.getManualOverrides = () => ({
  overrides: {
    apps: [],
    groups: [],
    components: [],
  },
  groupMappings: [],
});
configManagerMock.getServiceName = () => 'eric-oss-help-aggregator';
configManagerMock.ingressPath = () => '';

const certificateManagerMock = {
  getTLSOptions: () => ({
    secureContext: {},
    tlsAgent: new https.Agent(),
  }),
  on: () => true,
};

describe('Unit tests for ConfigQueryService', () => {
  let configQueryService;
  let telemetryCreateSpanSpy;
  let telemetryInjectContextSpy;
  let telemetrySetHttpResponseSpanOptionsSpy;

  const mockModules = async () => {
    await td.replaceEsm(
      'node-fetch',
      { Headers: HeadersMock, Request: RequestMock },
      nodeFetchMock,
    );
    await td.replaceEsm('../../config/constants.js', null, CONSTANTS);
    await td.replaceEsm('../../services/uiServiceCollection.js', null, uiServiceCollectionMock);
    await td.replaceEsm('../../config/configManager.js', null, configManagerMock);
    await td.replaceEsm('../../services/certificateManager.js', null, certificateManagerMock);
    await td.replaceEsm('../../services/pmService.js', null, PmServiceMock);
    await td.replaceEsm('../../services/telemetryService.js', null, TelemetryServiceMock);

    configQueryService = (await import('../../services/configQueryService.js')).default;
    td.reset();
  };

  const resetConfigQueryService = async () => {
    await configQueryService.deleteService(SERVICE_WITH_CONFIG_CONTEXT_PATH);
    await configQueryService.deleteService(SERVICE_WITH_BASEURL);
  };

  const mockOverrideConfig = async (config) => {
    const getApps = td.replace(configManagerMock, 'getApps');
    const getGroups = td.replace(configManagerMock, 'getGroups');
    const getManualOverrides = td.replace(configManagerMock, 'getManualOverrides');
    td.when(getApps(), { ignoreExtraArgs: true }).thenReturn(config.apps);
    td.when(getGroups(), { ignoreExtraArgs: true }).thenReturn(config.groups);
    td.when(getManualOverrides(), { ignoreExtraArgs: true }).thenReturn({
      overrides: config.overrides,
      groupMappings: config.groupMappings,
    });
  };

  const mockManualConfig = (config) => {
    const getApps = td.replace(configManagerMock, 'getApps');
    const getGroups = td.replace(configManagerMock, 'getGroups');
    const getActions = td.replace(configManagerMock, 'getActions');

    td.when(getApps(), { ignoreExtraArgs: true }).thenReturn(config.apps);
    td.when(getGroups(), { ignoreExtraArgs: true }).thenReturn(config.groups);
    td.when(getActions(), { ignoreExtraArgs: true }).thenReturn(config.actions);
  };

  describe('Basic tests', () => {
    // eslint-disable-next-line func-names
    before(async () => {
      await mockModules();
    });

    beforeEach(async () => {
      await resetConfigQueryService();
    });

    afterEach(() => {
      td.reset();
    });

    it('will get proper apps, components, groups and packages from annotated context root', async () => {
      await configQueryService.serviceHandler(SERVICE_WITH_CONFIG_CONTEXT_PATH);
      expect(configQueryService.getApps()).to.deep.eq(EXPECTED_APPS_FROM_CONTEXT);
      expect(configQueryService.getComponents()).to.deep.eq(EXPECTED_COMPONENTS_FROM_CONTEXT);
      expect(configQueryService.getGroups()).to.deep.eq(appConfigForConfigContext.groups);

      const packageMap = configQueryService.getPackages();
      expect(packageMap[SERVICE_WITH_CONFIG_CONTEXT_PATH.name].meta.modules).to.deep.eq(
        EXPECTED_PACKAGES_FROM_CONTEXT,
      );
    });

    it('will get proper apps, components, groups and packages after service was updated', async () => {
      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);
      expect(configQueryService.getApps()).to.deep.eq(EXPECTED_APPS);
      expect(configQueryService.getComponents()).to.deep.eq(EXPECTED_COMPONENTS);
      expect(configQueryService.getGroups()).to.deep.eq(appConfig.groups);

      const packageMap = configQueryService.getPackages();
      expect(packageMap[SERVICE_WITH_BASEURL.name].meta.modules).to.deep.eq(EXPECTED_PACKAGES);
    });

    it('will get proper apps, components, groups and packages from a service with missing package config', async () => {
      await configQueryService.serviceHandler(SERVICE_WITHOUT_PACKAGE_CONFIG);
      expect(configQueryService.getApps()).to.deep.eq(EXPECTED_APPS_MISSING_CONFIG);
      expect(configQueryService.getComponents()).to.deep.eq(EXPECTED_COMPONENTS_MISSING_CONFIG);
      expect(configQueryService.getGroups()).to.deep.eq(appConfig.groups);

      const packageMap = configQueryService.getPackages();
      expect(packageMap[SERVICE_WITHOUT_PACKAGE_CONFIG.name].meta.modules).to.be.empty;
    });

    it('can remove apps, components, groups and packages from configQueryService when a service was deleted', async () => {
      await configQueryService.serviceHandler(SERVICE_WITHOUT_PACKAGE_CONFIG);
      expect(configQueryService.getApps()).to.deep.eq(EXPECTED_APPS_MISSING_CONFIG);

      configQueryService.deleteService(SERVICE_WITHOUT_PACKAGE_CONFIG);
      expect(configQueryService.getApps()).to.have.lengthOf(0);
      expect(configQueryService.getComponents()).to.have.lengthOf(0);
      expect(configQueryService.getGroups()).to.have.lengthOf(0);
      expect(Object.keys(configQueryService.getPackages())).to.have.lengthOf(0);
    });
  });

  describe('Telemetry tests', () => {
    before(async () => {
      await mockModules();
    });

    beforeEach(async () => {
      await resetConfigQueryService();
      telemetryCreateSpanSpy = td.spyProp(TelemetryServiceMock, 'createSpan');
      telemetryInjectContextSpy = td.spyProp(TelemetryServiceMock, 'injectContext');
      telemetrySetHttpResponseSpanOptionsSpy = td.spyProp(
        TelemetryServiceMock,
        'setHttpResponseSpanOptions',
      );
    });

    afterEach(() => {
      td.reset();
    });

    it('can create spans for rest calls', async () => {
      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);

      td.verify(telemetryCreateSpanSpy(), {
        ignoreExtraArgs: true,
      });
      td.verify(telemetryInjectContextSpy(), {
        ignoreExtraArgs: true,
      });
      td.verify(telemetrySetHttpResponseSpanOptionsSpy(), {
        ignoreExtraArgs: true,
      });
    });
  });

  describe('Manual config', () => {
    before(async () => {
      await mockModules();
    });

    beforeEach(async () => {
      await resetConfigQueryService();
    });

    it('can fetch manual config', () => {
      mockManualConfig(manualConfigJson);

      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });

      expect(configQueryService.getGroups()).to.deep.eq([...manualConfigJson.groups]);
      expect(configQueryService.getApps()).to.deep.eq([...manualConfigJson.apps]);
      expect(configQueryService.getActions()).to.deep.eq(manualConfigJson.actions);
    });

    it('can replace existing manual config if manual config is updated again', () => {
      mockManualConfig(manualConfigForUpdate);

      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });

      expect(configQueryService.getGroups()).to.deep.eq([...manualConfigForUpdate.groups]);
      expect(configQueryService.getApps()).to.deep.eq([...manualConfigForUpdate.apps]);
      expect(configQueryService.getActions()).to.deep.eq(manualConfigForUpdate.actions);
    });

    it('can keep manual config after deleting service config', async () => {
      mockManualConfig(manualConfigJson);

      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);
      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });

      await new Promise((resolve) => {
        setTimeout(() => {
          configQueryService.deleteService(SERVICE_WITH_BASEURL);

          expect(configQueryService.getGroups()).to.deep.eq(manualConfigJson.groups);
          expect(configQueryService.getApps()).to.deep.eq([...manualConfigJson.apps]);
          expect(configQueryService.getActions()).to.deep.eq(manualConfigJson.actions);
          resolve();
        }, 0);
      });
    });

    it('can merge manual config to existing service config', async () => {
      mockManualConfig(manualConfigJson);

      // "SERVICE_WITH_BASEURL" service's config called to update not 'manualConfigForUpdate'
      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);
      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });
      await new Promise((resolve) => {
        setTimeout(() => {
          expect(configQueryService.getGroups()).to.deep.eq([...expectedManualConfigMerged.groups]);
          expect(configQueryService.getApps()).to.deep.eq(EXPECTED_APPS_MERGED);
          expect(configQueryService.getActions()).to.deep.eq(expectedManualConfigMerged.actions);
          resolve();
        }, 0);
      });
    });

    it('can merge service config to existing manual config', async () => {
      mockManualConfig(manualConfigJson);

      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });
      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);

      await new Promise((resolve) => {
        setTimeout(() => {
          expect(configQueryService.getApps()).to.deep.eq(EXPECTED_APPS_MERGED);
          expect(configQueryService.getGroups()).to.deep.eq([...expectedManualConfigMerged.groups]);
          expect(configQueryService.getActions()).to.deep.eq(expectedManualConfigMerged.actions);
          resolve();
        }, 0);
      });
    });
  });

  describe('Override config', () => {
    before(async () => {
      await mockModules();
    });

    beforeEach(async () => {
      await resetConfigQueryService();
    });

    afterEach(() => {
      td.reset();
    });

    it('can override config', async () => {
      mockOverrideConfig(manualConfigWithNonMatchingOverrides);

      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);
      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });

      await new Promise((resolve) => {
        setTimeout(() => {
          expect(configQueryService.getGroups().find((group) => group.name === 'nova')).to.deep.eq(
            EXPECTED_OVERRIDE_GROUP,
          );
          expect(configQueryService.getApps().find((app) => app.name === 'nova1')).to.deep.eq(
            EXPECTED_OVERRIDE_APP,
          );
          td.reset();
          resolve();
        }, 0);
      });
    });

    it('can override config with latter service discovery', async () => {
      mockOverrideConfig(manualConfigWithNonMatchingOverrides);

      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });
      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);

      await new Promise((resolve) => {
        setTimeout(() => {
          expect(configQueryService.getApps().find((app) => app.name === 'nova1')).to.deep.eq(
            EXPECTED_OVERRIDE_APP,
          );
          expect(configQueryService.getGroups().find((group) => group.name === 'nova')).to.deep.eq(
            EXPECTED_OVERRIDE_GROUP,
          );
          td.reset();
          resolve();
        }, 0);
      });
    });
  });

  describe('Group Mapping', () => {
    it('can add group to app with groupMapping', async () => {
      mockOverrideConfig(manualOverridesTestConfig);

      await configQueryService.serviceHandler(SERVICE_WITH_BASEURL);
      configManagerMock.emit(CONFIG_EVENT, { name: 'manualConfig' });

      await new Promise((resolve) => {
        setTimeout(() => {
          expect(
            configQueryService.getApps().find((app) => app.name === 'group-mapping-app'),
          ).to.deep.eq(EXPECTED_GROUP_OVERRIDE_APP);
        }, 0);
        td.reset();
        resolve();
      });
    });
  });
});
