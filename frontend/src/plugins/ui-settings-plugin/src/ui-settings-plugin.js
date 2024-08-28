import UISettings from '@adp/ui-settings';
import CONSTANTS from '../../../utils/constants.js';
import configManager from '../../../config/configManager.js';
import logger from '../../../utils/logger.js';

const { UI_SETTINGS_CHANGE } = CONSTANTS;

let username;
let broadcastChannel;
let resolveUserInfo;
let uiSettings;

const userInfoReady = new Promise((resolve) => {
  resolveUserInfo = resolve;
});

/**
 * Get the setting for a user from the storage.
 *
 * @param {object} params - Needed parameters for the get() method
 * @param {string} params.namespace - The namespace of the setting.
 * @param {string} params.key - The identifier of the setting.
 * @returns {*} - The value of the given key found in localStorage per user
 */
export const get = async (params) => {
  await userInfoReady;
  return uiSettings.get(params);
};

/**
 * Save the setting for a user into the storage.
 *
 * @param {object} params - Needed parameters for the set() method
 * @param {string} params.namespace - The namespace of the setting.
 * @param {string} params.key - The identifier of the setting.
 * @param {*} params.value - The value of the given key.
 */
export const set = async (params) => {
  await userInfoReady;
  return uiSettings.set(params);
};

/**
 * Removes the setting for a user from the storage if exist.
 *
 * @param {object} params - Needed parameters for the remove() method
 * @param {string} params.namespace - The namespace of the setting.
 * @param {string} params.key - The identifier of the setting.
 */
export const remove = async (params) => {
  await userInfoReady;
  return uiSettings.remove(params);
};

const initPlugin = (event) => {
  username = event.detail;
  const { storageMode, baseUrl } = configManager.getUiSettings();
  uiSettings = new UISettings({
    username,
    broadcastChannel,
    storageMode,
    baseUrl,
    logger,
  });
  resolveUserInfo();
};

export const onBeforeContainerLoad = () => async (resolve) => {
  document.body.addEventListener('set-username-finished', initPlugin);
  broadcastChannel = new BroadcastChannel(UI_SETTINGS_CHANGE);
  resolve();
};
