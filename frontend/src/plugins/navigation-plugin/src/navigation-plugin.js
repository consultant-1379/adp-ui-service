import CONSTANTS from '../../../utils/constants';
import rest from '../../../utils/rest';
import { bubble } from '../../../utils/helper';

const { PRODUCT_TYPE, SYSTEM_TYPE } = CONSTANTS;
const SELECTORS = {
  NAV_MENU: 'eui-navigation-menu',
  NAV_ITEM: 'eui-navigation-item',
  NAV_GROUP: 'eui-navigation-group',
};

const addChild = (routeMap = [], configData = [], children = []) => {
  for (const childName of children) {
    const childApp = routeMap?.find((app) => app.name === childName);
    if (childApp) {
      configData.push(childApp);
      if (childApp.childNames?.length) {
        addChild(routeMap, configData, childApp.childNames);
      }
    }
  }
};

const activateMenuItem = (menuItemId) => {
  const navigationMenu = document.querySelector(SELECTORS.NAV_MENU);
  const navigationGroups = navigationMenu?.shadowRoot?.querySelectorAll(SELECTORS.NAV_GROUP) || [];
  const navigationItems = navigationMenu?.shadowRoot?.querySelectorAll(SELECTORS.NAV_ITEM) || [];
  let item = [...navigationItems].find((navigationItem) => navigationItem.id === menuItemId);

  if (!menuItemId || !item) {
    return;
  }

  [...navigationGroups].forEach((navigationGroup) => {
    navigationGroup.open = false;
  });

  [...navigationItems].forEach((navigationItem) => {
    navigationItem.open = false;
    if (navigationItem.id === menuItemId) {
      item = navigationItem;
    }
  });

  if (item) {
    const openParent = (parent) => {
      if (parent.parentElement) {
        openParent(parent.parentElement);
      }
      parent.open = true;
    };

    if (item.parentElement) {
      openParent(item.parentElement);
    }

    item.activate();
  }
};

export const buildAppTree = (appName) => {
  const { routeMap } = window.EUI.Router.getRouteMap();

  const configData = [];

  let parentApp = routeMap?.find((app) => app.name === appName);

  if (parentApp) {
    while (parentApp && parentApp.parentId) {
      const currentApp = parentApp;
      parentApp = routeMap.find((app) => app.routeId === currentApp.parentId);
    }
    configData.push(parentApp);
    if (parentApp.childNames?.length) {
      addChild(routeMap, configData, parentApp.childNames);
    }
  }

  return configData;
};

export const getProductOfApp = (appGroups = [], allGroups = []) => {
  let productDisplayName;

  // finding first matching product group from app's groups
  const productName = appGroups.find((appGroup) => {
    productDisplayName = allGroups.find(
      (group) =>
        (group.type === PRODUCT_TYPE || group.type === SYSTEM_TYPE) && group.name === appGroup,
    )?.displayName;
    return productDisplayName !== undefined;
  });

  return { productName, productDisplayName };
};

export const onBeforeAppLoad = (params) => async (resolve) => {
  const configData = buildAppTree(params.name);
  bubble(document.documentElement, 'app-config-data-updated', configData);

  try {
    const appGroups = configData[0].groupNames;
    const allGroups = await rest.getGroups();
    const product = getProductOfApp(appGroups, allGroups);
    bubble(document.documentElement, 'product-selection-changed', product);
  } catch (e) {
    // backend seems to have issues, better to use console than REST logger
    console.error('An error occurred while fetching groups metadata from backend:', e);
  }

  return resolve();
};

document.addEventListener('portal:set-local-menu', (event) => {
  bubble(document.documentElement, 'app-config-data-updated', event.detail);
});

document.addEventListener('portal:activate-menu-item', (event) => {
  activateMenuItem(event.detail);
});
