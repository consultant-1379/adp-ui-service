import { expect } from 'chai';
import { createRequire } from 'module';
import dateFormatter from '@adp/auth/dateFormatter';
import { enableUserinfoEndpoint, disableUserinfoEndpoint } from '../../utils/userinfoUtil.js';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import CONSTANTS from '../../../src/utils/constants.js';

const require = createRequire(import.meta.url);
const launcherLocale = require('../../../src/apps/launcher/locale/en-us.json');
const settingsPanelLocale = require('../../../src/panels/custom-user-settings-panel/locale/en-us.json');
const userinfo = require('../../../dev/config/userinfo.json');

const { LAST_LOGIN_TIME_RESPONSE_KEY, USERNAME_RESPONSE_KEY } = CONSTANTS;
const FORMATTED_LAST_LOGIN = dateFormatter.formatDayMonthYearTimeShort(
  dateFormatter.convertISODate(userinfo[LAST_LOGIN_TIME_RESPONSE_KEY]),
);

const dictionary = { ...launcherLocale, ...settingsPanelLocale };

const LAST_LOGIN_TIME = '{{lastLoginTime}}';

const getTime = (minutesAgo) => Math.floor((Date.now() - minutesAgo * 60000) / 1000) * 1000;

const ALTERNATIVE_USERNAME = 'alt-user';
const ALTERNATIVE_DATE_1 = getTime(1) / 1000;
const ALTERNATIVE_DATE_2 = new Date(getTime(2)).toISOString();
const ALTERNATIVE_DATE_3 = new Date(getTime(3)).toUTCString();

const USER_COOKIE_KEY = 'userName';
const AUTH_TIME_COOKIE_KEY = 'authTime';

describe('Authentication', () => {
  let settingsPanel;
  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  after(async () => {
    await enableUserinfoEndpoint();
  });

  it('can load user info from the userinfo endpoint', async () => {
    await LauncherPage.clickAndWaitToDisplaySettingsPanel();
    settingsPanel = await LauncherPage.settingsPanel();

    const notification = await LauncherPage.notification();
    const notificationText = await LauncherPage.notificationText();

    expect(await settingsPanel.username()).to.eq(userinfo[USERNAME_RESPONSE_KEY]);
    expect(await settingsPanel.loginText()).to.eq(
      dictionary.LAST_LOG_IN_TEXT.replace(LAST_LOGIN_TIME, FORMATTED_LAST_LOGIN),
    );
    expect(await settingsPanel.signoutButton()).to.exist;
    expect(notification).to.exist;
    expect(notificationText).to.eq(
      dictionary.LOG_IN_NOTIFICATION_TEXT.replace(LAST_LOGIN_TIME, FORMATTED_LAST_LOGIN),
    );
  });

  it('can show default username if the endpoint is disabled', async () => {
    await disableUserinfoEndpoint();
    await browser.refresh();
    await LauncherPage.waitForLoading();

    await LauncherPage.clickAndWaitToDisplaySettingsPanel();
    settingsPanel = await LauncherPage.settingsPanel();

    expect(await settingsPanel.username()).to.eq('');
    expect(await settingsPanel.loginText()).to.eq(dictionary.SETTINGS_PANEL.LAST_LOG_IN_MISSING);
  });

  describe('Alternative Authentication Solutions', () => {
    [
      {
        NAME: 'Unix timestamp',
        DATE_STRING: ALTERNATIVE_DATE_1.toString(),
      },
      {
        NAME: 'ISO string format',
        DATE_STRING: ALTERNATIVE_DATE_2,
      },
      {
        NAME: 'UTC string format',
        DATE_STRING: ALTERNATIVE_DATE_3,
      },
    ].forEach((TEST_CASE) => {
      it(`can load username and last login time in ${TEST_CASE.NAME}`, async () => {
        await browser.deleteCookies([USER_COOKIE_KEY, AUTH_TIME_COOKIE_KEY]);
        await browser.setCookies([
          { name: USER_COOKIE_KEY, value: ALTERNATIVE_USERNAME },
          { name: AUTH_TIME_COOKIE_KEY, value: TEST_CASE.DATE_STRING },
        ]);

        await browser.refresh();
        await LauncherPage.waitForLoading();
        await LauncherPage.clickAndWaitToDisplaySettingsPanel();
        settingsPanel = await LauncherPage.settingsPanel();

        expect(await settingsPanel.username()).to.eq('');
        expect(await settingsPanel.loginText()).to.eq(
          dictionary.LAST_LOG_IN_TEXT.replace(
            LAST_LOGIN_TIME,
            dateFormatter.formatDayMonthYearTimeShort(TEST_CASE.DATE_STRING),
          ),
        );
        expect(await settingsPanel.signoutButton()).to.exist;
      });
    });
  });
});
