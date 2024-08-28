import { expect } from '@open-wc/testing';
import {
  buildAppTree,
  getProductOfApp,
} from '../../../../src/plugins/navigation-plugin/src/navigation-plugin.js';
import { stubRouter } from '../../../test-utils/utils.js';
import getRouteMap from '../../../test-utils/mockdata/getRouteMap.json' assert { type: 'json' };

const SERVICE_NAME = 'hello-world-mock';
const PARENT_NAME = 'mock-portal';
const CHILD1_NAME = 'mock-portal-child-1';
const CHILD2_NAME = 'mock-portal-child-2';
const PARENT_ID = '4004cb3c-9baa-283f-3d81-2d903a67ba74-1678869354165';

const EXPECTED_CONFIG_DATA_FOR_TREE = [
  {
    service: SERVICE_NAME,
    name: PARENT_NAME,
    module: PARENT_NAME,
    displayName: 'Mock Portal',
    type: 'euisdk',
    route: PARENT_NAME,
    version: '0.0.1',
    childNames: [CHILD1_NAME, CHILD2_NAME],
    groupNames: ['mockapps'],
    menuPath: PARENT_NAME,
    urlPattern: {},
    routeId: PARENT_ID,
  },
  {
    service: SERVICE_NAME,
    name: CHILD1_NAME,
    module: CHILD1_NAME,
    displayName: 'Mock Child 1',
    type: 'euisdk',
    route: CHILD1_NAME,
    version: '0.0.1',
    groupNames: ['mockapps'],
    menuPath: 'mock-portal/mock-portal-child-1',
    urlPattern: {},
    routeId: '74845079-282d-48ad-42f8-2ca806808d54-1678869354167',
    parentId: PARENT_ID,
  },
  {
    service: SERVICE_NAME,
    name: CHILD2_NAME,
    module: CHILD2_NAME,
    displayName: 'Mock Child 2',
    type: 'euisdk',
    route: CHILD2_NAME,
    version: '0.0.1',
    groupNames: ['mockapps'],
    hidden: true,
    menuPath: 'mock-portal/mock-portal-child-2',
    urlPattern: {},
    routeId: 'adcc294c-ac5a-abf0-17b7-77fda8b596dc-1678869354167',
    parentId: PARENT_ID,
  },
];

const EXPECTED_CONFIG_DATA_FOR_SINGLE_APP = [
  {
    service: 'e-ui-app-2',
    name: 'charts',
    module: 'charts',
    displayName: 'Charts',
    type: 'euisdk',
    route: 'charts',
    version: '0.0.1',
    groupNames: ['mockapps'],
    menuPath: 'charts',
    urlPattern: {},
    routeId: 'a2dfe969-df7a-398a-e3d4-0c37222ba141-1678869354165',
  },
];

const ALL_PRODUCTS = [
  {
    displayName: 'Ericsson Network Manager',
    version: '1.0.0',
    name: 'network_manager',
    descriptionShort: 'ENM',
    type: 'product',
  },
  {
    displayName: 'Ericsson Cloud Manager',
    version: '1.0.0',
    name: 'ecm',
    type: 'product',
    descriptionShort: 'ECM',
    descriptionLong: 'Ericsson Cloud Manager provides something.',
  },
  {
    displayName: 'Mock Applications',
    version: '0.0.1',
    name: 'mockapps',
    type: 'product',
    descriptionLong: 'Demo applications with E-UI SDK v2 frontend.',
    descriptionShort: 'E-UI demo apps',
  },
];

describe('Location handler plugin Tests', () => {
  it('should build navigation tree', async () => {
    stubRouter({ hash: CHILD1_NAME, getRouteMap });
    const configData = buildAppTree(CHILD1_NAME);
    expect(configData).to.deep.eq(EXPECTED_CONFIG_DATA_FOR_TREE);
  });

  it('should show only one app, if there is no child', async () => {
    stubRouter({ hash: 'charts', getRouteMap });
    const configData = buildAppTree('charts');
    expect(configData).to.deep.eq(EXPECTED_CONFIG_DATA_FOR_SINGLE_APP);
  });

  it('configData should be empty', async () => {
    stubRouter({ hash: 'not-existing-app', getRouteMap });
    const configData = buildAppTree('not-existing-app');
    expect(configData).to.deep.eq([]);
  });

  it('should find matching product of an app', async () => {
    const appGroups = ['ecm', 'category'];
    const { productName, productDisplayName } = getProductOfApp(appGroups, ALL_PRODUCTS);
    expect(productName).to.eq(ALL_PRODUCTS[1].name);
    expect(productDisplayName).to.eq(ALL_PRODUCTS[1].displayName);
  });

  it('should select the first matching product of an app if there are more', async () => {
    const appGroups = ['mockapps', 'ecm', 'category'];
    const { productName, productDisplayName } = getProductOfApp(appGroups, ALL_PRODUCTS);
    expect(productName).to.eq(ALL_PRODUCTS[2].name);
    expect(productDisplayName).to.eq(ALL_PRODUCTS[2].displayName);
  });

  it('should not return matching product if app has no group', async () => {
    const appGroups = undefined;
    const { productName, productDisplayName } = getProductOfApp(appGroups, ALL_PRODUCTS);
    expect(productName).to.eq(undefined);
    expect(productDisplayName).to.eq(undefined);
  });

  it('should not return matching product if there are no groups', async () => {
    const appGroups = ['mockapps', 'ecm', 'category'];
    const { productName, productDisplayName } = getProductOfApp(appGroups, undefined);
    expect(productName).to.eq(undefined);
    expect(productDisplayName).to.eq(undefined);
  });
});
