import { updateToAbsoluteUrl } from './URLUtil.js';
import { getLogger } from '../services/logging.js';

const logger = getLogger();

/**
 * Class resolves possible conflicts of common components during config merge.
 *
 * Each component of merged config is being processed separately, running through the pre-configured list of resolver/updater functions.
 *
 * Resolver functions receive competition config as the input: {
 *  oldObject : {component, source} //object in store
 *  newObject: {component, source} //incoming object,
 *  reason: String
 * }
 *
 * The resolvers run one by one, assigning winning object to 'newObject' and justification to 'reason' fields.
 * If resolver can not determine which entity is winning, it passes turn to next one by returning the incoming config.
 *
 * By default, the conflict is resolved in favor of newer - by order of config merge - component.
 *
 * Updater function gets as an input: {
 *  component: Object // Component to be updated
 *  source: String // name of the components service
 * }
 * The returned value should have the same fields.
 *
 * @class ConfigCollisionsResolver
 */
class ConfigCollisionsResolver {
  constructor() {
    this._apps = {};
    this._groups = {};
    this._components = {};
    this._actions = [];
  }

  get apps() {
    return Object.values(this._apps).map((_app) => _app.component);
  }

  get groups() {
    return Object.values(this._groups).map((_group) => _group.component);
  }

  get components() {
    return Object.values(this._components).map((_component) => _component.component);
  }

  get actions() {
    return this._actions.map((uiAction) => uiAction.component);
  }

  /**
   * Component conflict resolver.
   *
   * Defines winner by type.
   * Defines winner according to precedence: type is 'euisdk*' > other defined value > undefined || "".
   *
   * @param {Object} contestConfig Base configuration for the resolution
   * @return {Object} Updated contestConfig, or initial config in case of a draw scenario.
   * @memberof configCollisionsResolver
   */
  _resolveEntityByType(contestConfig) {
    const { oldObj, newObj } = contestConfig;

    const PREFERRED_TYPE = 'euisdk';

    const newObjType = newObj.component.type || '';
    const oldObjType = oldObj.component.type || '';

    // Draw, passing turn to next resolver
    if (
      oldObjType === newObjType ||
      (oldObjType.startsWith(PREFERRED_TYPE) && newObjType.startsWith(PREFERRED_TYPE))
    ) {
      return contestConfig;
    }

    if (oldObjType === '' || newObjType.startsWith(PREFERRED_TYPE)) {
      return Object.assign(contestConfig, {
        reason: `Collision resolved according to type preference - type '${newObj.type}' preferred to '${oldObj.type}'`,
      });
    }
    return Object.assign(contestConfig, {
      newObj: oldObj,
      reason: `Collision resolved according to type preference - type '${oldObj.type}' preferred to '${newObj.type}'`,
    });
  }

  /**
   * Updates the url of the component to the absolute using the ingressBaseUrl.
   *
   * @param {Object} item
   * @return {Object}
   * @memberof configCollisionsResolver
   */
  _updateItemToAbsoluteUrl(item) {
    const { component, source } = item;

    const objMeta = source ? { service: source, ...component } : component;

    updateToAbsoluteUrl(objMeta, this.config.ingressBaseurl);

    return {
      component: objMeta,
      source,
    };
  }

  /**
   * Adds the source field to the component.
   *
   * @param {Object} item
   * @return {Object} Updated item, suitable as an input to the possible next updater function
   * @memberof configCollisionsResolver
   */
  _updateItemWithSource(item) {
    const { component, source } = item;

    if (source) {
      return {
        component: { service: source, ...component },
        source,
      };
    }
    return item;
  }

  /**
   * Adds component to the store.
   * Resolves conflicts and logs result, updates components on demand.
   *
   * @param {Object} store
   * @param {Object} component
   * @param {Object} [resolutionConfig={}]
   * @memberof configCollisionsResolver
   */
  addEntity(store, component, resolutionConfig = {}) {
    let itemToAdd;
    const source = this.config.name;
    const { resolvers = [], updaters = [], getLog = () => '' } = resolutionConfig;
    const storedEntity = store[component.name];

    // if there are no entities alike item, add it.
    if (!storedEntity) {
      itemToAdd = { component, source };
    } else {
      // define the winner via running stored and candidate entities through the resolvers
      const {
        oldObj,
        newObj: winner,
        reason,
      } = resolvers.reduce((results, resolverFunc) => resolverFunc(results), {
        oldObj: storedEntity,
        newObj: { component, source },
        reason: 'Collision resolved in favor of newer item', // default resolution
      });

      // logging message
      logger.warning(
        getLog({
          name: component.name,
          oldSource: oldObj.source,
          newSource: winner.source,
          reason,
        }),
      );

      itemToAdd = winner;
    }

    // applying updaters
    const updatedEntity = updaters.reduce((result, func) => func(result), itemToAdd);

    store[component.name] = updatedEntity;
  }

  /**
   * Adds actions to the store.
   * Resolves conflicts and logs result, updates actions on demand.
   *
   * @param {Object} store
   * @param {Object} component
   * @param {Object} [resolutionConfig={}]
   * @memberof configCollisionsResolver
   */
  addAction(store, component, resolutionConfig = {}) {
    let itemToAdd;
    const source = this.config.name;
    const { resolvers = [], updaters = [], getLog = () => '' } = resolutionConfig;
    const storedEntity = store.find((element) => element.id === component.id);
    // if there are no entities alike item, add it.
    if (!storedEntity) {
      itemToAdd = { component, source };
    } else {
      // define the winner via running stored and candidate entities through the resolvers
      const {
        oldObj,
        newObj: winner,
        reason,
      } = resolvers.reduce((results, resolverFunc) => resolverFunc(results), {
        oldObj: storedEntity,
        newObj: { component, source },
        reason: 'Collision resolved in favor of newer item', // default resolution
      });

      console.log('logger.warning');

      // logging message
      logger.warning(
        getLog({
          name: component.id,
          oldSource: oldObj.source,
          newSource: winner.source,
          reason,
        }),
      );

      itemToAdd = winner;
    }

    // applying updaters
    const updatedEntity = updaters.reduce((result, func) => func(result), itemToAdd);

    const updatedEntityIndex = store.findIndex((element) => element.id === component.id);

    if (updatedEntityIndex > -1) {
      store.splice(updatedEntityIndex, 1, updatedEntity);
    } else {
      store.push(updatedEntity);
    }
  }

  _resolveApps(apps) {
    const resolutionConfig = {
      resolvers: [this._resolveEntityByType],
      updaters: [this._updateItemToAbsoluteUrl.bind(this)], // as .reduce method callbacks always called with this = undefined
      getLog: ({ name, oldSource, newSource, reason }) =>
        `Conflict resolved for app ${name}. ${oldSource} item is replaced by ${newSource}. ${reason}`,
    };

    apps.forEach((app) => this.addEntity(this._apps, app, resolutionConfig));
  }

  _resolveGroups(groups) {
    const resolutionConfig = {
      resolvers: [this._resolveEntityByType],
      getLog: ({ name, oldSource, newSource, reason }) =>
        `Conflict resolved for group ${name}. ${oldSource} item is replaced by ${newSource}. ${reason}`,
    };

    groups.forEach((group) => this.addEntity(this._groups, group, resolutionConfig));
  }

  _resolveComponents(components) {
    const resolutionConfig = {
      resolvers: [this._resolveEntityByType],
      updaters: [this._updateItemWithSource],
      getLog: ({ name, oldSource, newSource, reason }) =>
        `Conflict resolved for component ${name}. ${oldSource} item is replaced by ${newSource}. ${reason}`,
    };

    components.forEach((component) =>
      this.addEntity(this._components, component, resolutionConfig),
    );
  }

  _resolveActions(actions) {
    const resolutionConfig = {
      resolvers: [this._resolveEntityByType],
      getLog: ({ name, oldSource, newSource, reason }) =>
        `Conflict resolved for group ${name}. ${oldSource} item is replaced by ${newSource}. ${reason}`,
    };

    actions?.forEach((uiAction) => this.addAction(this._actions, uiAction, resolutionConfig));
  }

  /**
   * Process the config object
   *
   * @param {Object} config
   * @memberof configCollisionsResolver
   */
  processConfig(config) {
    this.config = config;

    if (config.meta.apps) {
      this._resolveApps(config.meta.apps);
    }

    if (config.meta.groups) {
      this._resolveGroups(config.meta.groups);
    }

    if (config.meta.components) {
      this._resolveComponents(config.meta.components);
    }

    if (config.meta.actions && Object.keys(config.meta.actions).length) {
      this._resolveActions(config.meta.actions);
    }
  }
}

/**
 * Merge a list of Configs into apps, groups and component lists.
 *
 * @param {Array<Config>} configs
 * @returns {Merged}
 * @memberof K8sService
 */
function mergeConfigs(configs) {
  const resolver = new ConfigCollisionsResolver();

  configs.forEach((config) => {
    resolver.processConfig(config);
  });

  return {
    apps: resolver.apps,
    groups: resolver.groups,
    components: resolver.components,
    actions: resolver.actions,
  };
}

export { mergeConfigs };
