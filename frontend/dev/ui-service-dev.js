import { createRequire } from 'module';

// eslint-disable-next-line import/no-relative-packages
import { schemaValidator } from '../../backend/utils/schemaValidator.js';
import importMap from './importMapGenerator.js';

const require = createRequire(import.meta.url);

const ENMConfig = require('../../mock/domain-ui-generic/public/ui-generic-enm/config.json');
const EEAConfig = require('../../mock/domain-ui-generic/public/ui-generic-eea/config.json');
const ESMConfig = require('../../mock/domain-ui-generic/public/esm-service-1/config/config.json');
const actionConsumerConfig = require('../../mock/domain-ui-generic/public/action-consumer/config/config.json');
const actionProviderConfig = require('../../mock/domain-ui-generic/public/action-provider/config/config.json');
const EUI1Config = require('../../mock/domain-ui-generic/public/e-ui-app-1/config/config.json');
const EUI2Config = require('../../mock/domain-ui-generic/public/e-ui-app-2/config/config.json');
const EUITreeConfig = require('../../mock/domain-ui-generic/public/e-ui-tree-apps/config/config.json');
const ECMConfig = require('../../mock/domain-ui-generic/public/ui-generic-ecm/config.json');
const ThirdPartyAppConfig = require('../../mock/domain-ui-generic/public/third-party-app/config.json');

const DummyProduct1Config = require('./config/dummy.product.1.config.json');
const DummyProduct2Config = require('./config/dummy.product.2.config.json');
const DummyProduct3Config = require('./config/dummy.product.3.config.json');
const launcherConfig = require('../public/config.json');
const userinfo = require('./config/userinfo.json');

importMap.imports['@adp/ui-components'] = '/libs/shared/@adp/ui-components/src/index.js';

const services = [
  {
    name: 'eric-network-manager',
    config: ENMConfig,
  },
  {
    name: 'eric-expert-analytics',
    config: EEAConfig,
  },
  {
    name: 'eric-cloud-manager',
    config: ECMConfig,
  },
  {
    name: 'hello-world-mock',
    config: ESMConfig,
  },
  {
    name: 'action-consumer',
    config: actionConsumerConfig,
  },
  {
    name: 'action-provider',
    config: actionProviderConfig,
  },
  {
    name: 'e-ui-app-1',
    config: EUI1Config,
  },
  {
    name: 'e-ui-app-2',
    config: EUI2Config,
  },
  {
    name: 'e-ui-tree-apps',
    config: EUITreeConfig,
  },
  {
    name: 'dummy-product-1',
    config: DummyProduct1Config,
  },
  {
    name: 'dummy-product-2',
    config: DummyProduct2Config,
  },
  {
    name: 'dummy-product-3',
    config: DummyProduct3Config,
  },
  {
    name: 'adp-marketplace',
    config: ThirdPartyAppConfig,
  },
];

let apps = [...launcherConfig.apps];
let groups = [...launcherConfig.groups];
const components = [...launcherConfig.components];
let actions = [];

services.forEach((service) => {
  const result = schemaValidator.validateConfig(service.config);

  if (!result.valid) {
    console.log(result.errors);
    process.exit(1);
  }

  if (service.config.apps) {
    apps = apps.concat(
      service.config.apps.map((application) => ({
        service: service.name,
        ...application,
      })),
    );
  }

  if (service.config.groups) {
    groups = groups.concat(service.config.groups);
  }

  if (service.config.actions) {
    actions = actions.concat(service.config.actions);
  }
});

export default { apps, groups, components, actions, userinfo };
