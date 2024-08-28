import constants from './constants';
import UiSettingsUtil from './uiSettingsUtil';

const { FAVORITE_STATE } = constants;

export function appHasChildren(app) {
  return !!(app.childApps && app.childApps.length);
}

export function getFavoriteStateOfApp(app) {
  const hasChildren = appHasChildren(app);
  if (app.isFavorite) {
    return FAVORITE_STATE.FAVORITE;
  }
  if (hasChildren && app.childApps.filter((child) => child.isFavorite).length) {
    return FAVORITE_STATE.PARTIALLY_FAVORITE;
  }

  return FAVORITE_STATE.NOT_FAVORITE;
}

export function setHierarchicAppStructure(apps) {
  apps.forEach((app) => {
    if (app.childNames && app.childNames.length) {
      app.childApps = app.childNames
        .map((childName) => {
          const childApp = apps.find((a) => a.name === childName);
          if (childApp) {
            childApp.isChild = true;
            if (childApp.route) {
              childApp.route = childApp.route.includes(`${app.route}/`)
                ? childApp.route
                : `${app.route}/${childApp.route}`;
            }
            childApp.favoriteState = getFavoriteStateOfApp(childApp);
          }
          return childApp;
        })
        .filter((child) => child);
    }
    app.favoriteState = getFavoriteStateOfApp(app);
  });
}

export function updateHiddenStates(apps) {
  return apps.map((app) => {
    if (app.hidden && app.childNames && app.childNames.length) {
      app.childNames.forEach((childName) => {
        const childApp = apps.find((a) => a.name === childName);
        if (childApp) {
          childApp.hidden = true;
        }
      });
    }
    return app;
  });
}

export async function handleAppStateChange(event) {
  const updateAppState = (previousState, appName, changedProperty) => {
    const newState = { ...previousState[appName], ...changedProperty };
    return { ...previousState, [appName]: newState };
  };
  const { detail } = event;
  let state = (await UiSettingsUtil.get('appStates')) || {};
  state = updateAppState(state, detail.appName, detail.changed);
  await UiSettingsUtil.set('appStates', state);
}
