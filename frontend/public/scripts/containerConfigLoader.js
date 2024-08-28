import rest from '../src/utils/rest.js';

// load the config into the Container...
export const getConfig = async () => {
  // fetch app, group and component configs from ui-meta endpoints...
  const appConfig = await rest.getApps();
  const groupConfig = await rest.getGroups();
  const componentConfig = await rest.getComponents();
  return {
    apps: appConfig,
    groups: groupConfig,
    components: componentConfig,
  };
};

export const getActionsUrl = () => `${rest.getBaseContext()}${rest.getActionsUrl()}`;
