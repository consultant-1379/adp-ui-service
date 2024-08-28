import { createRequire } from 'module';
import ConfigQueryService from '@adp/kubernetes/configQuery';
import uiServiceCollection from './uiServiceCollection.js';
import { getLogger } from './logging.js';
import { mergeConfigs } from '../utils/configUtil.js';
import ImportMapUtils from '../utils/ImportMapUtil.js';
import configManager from '../config/configManager.js';
import CONSTANTS from '../config/constants.js';
import certificateManager from './certificateManager.js';
import pmService from './pmService.js';
import telemetryService from './telemetryService.js';

const require = createRequire(import.meta.url);
const configPackageSchema = require('../schemas/ui.config.package.json');
const configSchema = require('../schemas/ui.config.json');
const appSchema = require('../schemas/ui.app.json');
const componentSchema = require('../schemas/ui.component.json');
const actionSchema = require('../schemas/ui.actions.json');
const entitySchema = require('../schemas/ui.entity.json');
const actionMetaIconSchema = require('../schemas/ui.actions.meta.icon.json');

const logger = getLogger();

class UiConfigQueryService extends ConfigQueryService {
  constructor(options) {
    super(options);

    this.importMap = {};
    this.apps = [];
    this.groups = [];
    this.components = [];
    this.actions = {};

    this.on('service-config-updated', ({ configName }) => {
      if (configName === CONSTANTS.CONFIG_QUERY_NAME) {
        this.updateConfig();
      }
      if (configName === CONSTANTS.PACKAGE_CONFIG_QUERY_NAME) {
        this.updateImportMap();
      }
    });

    this.on('service-config-deleted', () => {
      this.updateConfig();
      this.updateImportMap();
    });

    configManager.on(
      'config-changed',
      ({ name }) =>
        (name === CONSTANTS.MANUAL_CONFIG_NAME || name === CONSTANTS.MANUAL_OVERRIDES) &&
        this.updateConfig(),
    );
  }

  get configMap() {
    return this.getConfig(CONSTANTS.CONFIG_QUERY_NAME);
  }

  get packageMap() {
    return this.getConfig(CONSTANTS.PACKAGE_CONFIG_QUERY_NAME);
  }

  updateImportMap() {
    this.importMap = ImportMapUtils.calculateImportMap(this.packageMap);
  }

  overrideConfig(resultConfig, overrides) {
    const mismatchedOverrides = {
      apps: [],
      groups: [],
      components: [],
      groupMappings: [],
    };
    if (overrides) {
      for (const [subconfigKey, subconfig] of Object.entries(overrides)) {
        subconfig.forEach((override) => {
          const matchingOriginalIndex = resultConfig[subconfigKey]?.findIndex(
            (original) => original.name === override.name,
          );

          if (matchingOriginalIndex !== -1) {
            resultConfig[subconfigKey][matchingOriginalIndex] = {
              ...resultConfig[subconfigKey][matchingOriginalIndex],
              ...override,
            };
          } else {
            mismatchedOverrides[subconfigKey].push(override.name);
          }
        });
      }
    }
    return { resultConfig, mismatchedOverrides };
  }

  addGroupToApp(apps, groupMappings) {
    const mismatchedGroups = [];
    groupMappings.forEach((group) => {
      group.apps.forEach((appName) => {
        const appIndex = apps.findIndex((app) => app.name === appName);
        if (appIndex !== -1 && !apps[appIndex].groupNames.includes(group.group)) {
          apps[appIndex].groupNames.push(group.group);
        } else {
          mismatchedGroups.push(appName);
        }
      });
    });
    return { apps, mismatchedGroups };
  }

  updateConfig() {
    const manualConfig = {
      meta: {
        apps: configManager.getApps(),
        groups: configManager.getGroups(),
        actions: configManager.getActions(),
      },
    };

    const configList = [manualConfig, ...Object.values(this.configMap)];

    const { overrides, groupMappings } = configManager.getManualOverrides();

    const { resultConfig, mismatchedOverrides } = this.overrideConfig(
      mergeConfigs(configList),
      overrides,
    );

    if (groupMappings) {
      const { apps, mismatchedGroups } = this.addGroupToApp(resultConfig.apps, groupMappings);
      resultConfig.apps = apps;
      mismatchedOverrides.groupMappings = mismatchedGroups;
    }

    if (Object.values(mismatchedOverrides).some((subconfig) => subconfig?.length)) {
      logger.warning(
        `The following config overrides and group mappings have no matching originals: ${JSON.stringify(
          mismatchedOverrides,
        )}`,
      );
    }

    this.apps = resultConfig.apps;
    this.groups = resultConfig.groups;
    this.components = resultConfig.components;
    this.actions = resultConfig.actions;
  }

  /**
   * Returns the currently known applications.
   *
   * @returns {Array<Object>} apps
   * @memberof K8sService
   */
  getApps() {
    return this.apps;
  }

  /**
   * Returns the currently known actions.
   *
   * @returns {Array<Object>} actions
   * @memberof K8sService
   */
  getActions() {
    return this.actions;
  }

  /**
   * Returns the currently known groups.
   *
   * @returns {Array<Object>} groups
   * @memberof K8sService
   */
  getGroups() {
    return this.groups;
  }

  /**
   * Returns the currently known components.
   *
   * @returns {Array<Object>} components
   * @memberof K8sService
   */
  getComponents() {
    return this.components;
  }

  /**
   * Returns the currently known package map.
   *
   * @returns {Object>} packageMap
   */
  getPackages() {
    return this.packageMap;
  }

  /**
   * Returns the currently calculated import-map.
   *
   * @returns {Object>} packages
   */
  getImportMap() {
    return this.importMap;
  }
}

const configQueryService = new UiConfigQueryService({
  telemetryService,
  certificateManager,
  pmService,
  logger,
  serviceCollection: uiServiceCollection,
  configFetchRetryPeriod: CONSTANTS.CONFIG_FETCH_RETRY_PERIOD,
  configFetchMaxRetryPeriod: CONSTANTS.CONFIG_FETCH_MAX_RETRY_PERIOD,
  internalUiName: CONSTANTS.TLS_TYPE_INTERNAL_GUI,
  configQueryList: [
    {
      configName: CONSTANTS.CONFIG_QUERY_NAME,
      configFileName: CONSTANTS.CONFIG_FILE_NAME,
      schema: configSchema,
      additionalSchemaList: [
        appSchema,
        componentSchema,
        entitySchema,
        actionSchema,
        actionMetaIconSchema,
      ],
    },
    {
      configName: CONSTANTS.PACKAGE_CONFIG_QUERY_NAME,
      configFileName: CONSTANTS.PACKAGE_CONFIG_FILE_NAME,
      allowEmptyConfig: true,
      configDefault: CONSTANTS.DEFAULT_PACKAGE_CONFIG,
      schema: configPackageSchema,
      limitOfTries: CONSTANTS.CONFIG_PACKAGE_FETCH_TRY_LIMIT,
    },
  ],
});

export default configQueryService;
