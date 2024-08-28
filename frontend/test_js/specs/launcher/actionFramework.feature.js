import { createRequire } from 'module';
import { expect } from 'chai';
import { openProduct, openApp } from '../../utils/utils.js';
import LauncherPage from '../../page-objects/launcher/Launcher.page.js';
import ActionConsumerPage from '../../page-objects/mock/ActionConsumer.page.js';
import constants from '../../utils/constants.js';
import uiServiceDev from '../../../dev/ui-service-dev.js';

const require = createRequire(import.meta.url);
const actionProviderConfig = require('../../../../mock/domain-ui-generic/public/action-provider/config/config.json');

const { actions } = actionProviderConfig;
const { apps } = uiServiceDev;

const { ACTION_FWK_APPS_TITLE } = constants;

const ACTION_CONSUMER = 'Action Consumer';
const APPS_ACTION = 'Apps';

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
    expect(results).to.deep.eq(apps.map((app) => app.displayName));
  });
});
