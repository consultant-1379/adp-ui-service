import rest from '../../../utils/rest';
import router from '../../../utils/router';
import constants from '../../../utils/constants';
import { setHierarchicAppStructure, handleAppStateChange } from '../../../utils/appUtils';

const { LAST_OPENED } = constants;

let apps;

document.addEventListener('app-status-change', handleAppStateChange);

export const onBeforeContainerLoad = () => async (resolve) => {
  try {
    apps = await rest.getApps();
    setHierarchicAppStructure(apps);
  } catch (e) {
    // backend seems to have issues, better to use console than REST logger
    console.error('An error occurred while fetching applications metadata from backend:', e);
  }
  return resolve();
};

export const onBeforeAppLoad = (params) => async (resolve) => {
  const { name } = params;
  if (name !== router.pageRoute) {
    await handleAppStateChange({
      detail: {
        appName: name,
        changed: { [LAST_OPENED]: Date.now() },
      },
    });
  }
  return resolve();
};
