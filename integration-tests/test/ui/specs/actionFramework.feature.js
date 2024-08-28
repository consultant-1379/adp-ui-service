import { createRequire } from 'module';
import { expect } from 'chai';
import { openProduct, openApp } from '../../../../frontend/test_js/utils/utils.js';
import LauncherPage from '../../../../frontend/test_js/page-objects/launcher/Launcher.page.js';
import ActionConsumerPage from '../../../../frontend/test_js/page-objects/mock/ActionConsumer.page.js';
import constants from '../../../../frontend/test_js/utils/constants.js';
import ConfigUtilClass from '../../backend/util/config-util.js';
import { servicesToTest } from '../../backend/util/servicesToTest.js';

const require = createRequire(import.meta.url);
const actionProviderConfig = require('../../../../mock/domain-ui-generic/public/action-provider/config/config.json');

const { actions } = actionProviderConfig;

const { ACTION_FWK_APPS_TITLE } = constants;

const ACTION_CONSUMER = 'Action Consumer';
const APPS_ACTION = 'Apps';

const configUtil = new ConfigUtilClass(servicesToTest);
const apps = configUtil.getAppsResponse();

describe('Action framework tests', () => {
  before(async () => {
    await LauncherPage.open();
    await LauncherPage.waitForLoading();
  });

  it('can open the Action Consumer and the it has the actions provided by the Action Provider', async () => {
    await openProduct(ACTION_FWK_APPS_TITLE);
    await openApp(ACTION_CONSUMER);
    await ActionConsumerPage.waitForLoading();
    const titles = await ActionConsumerPage.actionTitles();
    expect(titles).to.deep.eq(actions.map((action) => action.displayName));
  });

  it('can execute the "Apps" action', async () => {
    const titles = await ActionConsumerPage.actionTitles();
    const index = titles.findIndex((title) => title === APPS_ACTION);
    const buttons = await ActionConsumerPage.actionButtons();
    await buttons[index].click();

    const results = await ActionConsumerPage.getResults();
    expect(results).to.have.lengthOf(apps.length);
  });
});
