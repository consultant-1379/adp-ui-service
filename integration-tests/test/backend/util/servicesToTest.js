const MOCK_BASE = '../../../../mock/domain-ui-generic/public';
const FRONTEND_BASE = '../../../../frontend/public';
const INTEGRATION_TEST_BASE = '../../../../integration-tests/test/manualconfig';
const SERVICE_NAME_PREFIX = 'demo-ui-service';

export const servicesToTest = [
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-eea`,
    folderPath: `${MOCK_BASE}/ui-generic-eea`,
    filesToCheck: ['config.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-ecm`,
    folderPath: `${MOCK_BASE}/ui-generic-ecm`,
    filesToCheck: ['config.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-enm`,
    folderPath: `${MOCK_BASE}/ui-generic-enm`,
    filesToCheck: ['config.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-esma`,
    folderPath: `${MOCK_BASE}/esm-container`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-esmb`,
    folderPath: `${MOCK_BASE}/esm-service-1/config`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-esmc`,
    folderPath: `${MOCK_BASE}/esm-service-2`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-eui1`,
    folderPath: `${MOCK_BASE}/e-ui-app-1/config`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-eui2`,
    folderPath: `${MOCK_BASE}/e-ui-app-2/config`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-tree`,
    folderPath: `${MOCK_BASE}/e-ui-tree-apps/config`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-3pp`,
    folderPath: `${MOCK_BASE}/third-party-app`,
    filesToCheck: ['config.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-action-consumer`,
    folderPath: `${MOCK_BASE}/action-consumer/config`,
    filesToCheck: ['config.json'],
  },
  {
    deploymentName: `${SERVICE_NAME_PREFIX}-action-provider`,
    folderPath: `${MOCK_BASE}/action-provider/config`,
    filesToCheck: ['config.json'],
  },
  {
    deploymentName: 'eric-adp-gui-aggregator-service',
    folderPath: `${FRONTEND_BASE}`,
    filesToCheck: ['config.json', 'config.package.json'],
  },
  {
    folderPath: `${INTEGRATION_TEST_BASE}`,
    filesToCheck: ['config.json'],
  },
];
