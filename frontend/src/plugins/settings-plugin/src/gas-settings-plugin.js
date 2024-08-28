// eslint-disable-next-line camelcase
import UiSettingsUtil from '../../../utils/uiSettingsUtil';
import CONSTANTS from '../../../utils/constants';

const { COMMON_NAMESPACE } = CONSTANTS;
/**
 * Settings Persistence
 * ---------------------------------------------------------------------
 * The plugin is used to persist the theme.
 */

/**
 * Persist the theme in session storage
 *
 * @function themeChanged
 * @param {Event} event The theme changed event
 * @private
 */
export const themeChanged = async (event) => {
  const { theme } = event.detail;
  await UiSettingsUtil.set('theme', theme, COMMON_NAMESPACE);
};

/**
 * Register for the theme changed event
 *
 * @function registerThemeChangeHandler
 * @private
 */
export const registerThemeChangeHandler = () => {
  const euiContainer = document.querySelector('eui-container');
  euiContainer.addEventListener('eui-theme-change', themeChanged);
};

/**
 * Set the persisted theme into the Container
 *
 * @function applyPersistedTheme
 * @private
 */
export const applyPersistedTheme = async () => {
  const storedTheme = await UiSettingsUtil.get('theme', COMMON_NAMESPACE);
  if (storedTheme) {
    const euiTheme = document.querySelector('eui-theme');
    const currentTheme = euiTheme?.getAttribute('theme');
    if (storedTheme !== currentTheme) {
      euiTheme.bubble('eui-theme-change', { theme: storedTheme });
    }
  }
};

/**
 * Lifecycle hook executed automatically before
 * the Container loads.
 * Implement this function when you want code in
 * the plugin to execute before the Container loads.
 *
 * @function onBeforeContainerLoad
 * @public
 */
export const onBeforeContainerLoad = () => async (resolve) => {
  registerThemeChangeHandler();

  resolve();
};

export const onBeforeAppLoad = () => (resolve) => {
  resolve();
};

document.body.addEventListener('set-username-finished', () => {
  applyPersistedTheme();
});
