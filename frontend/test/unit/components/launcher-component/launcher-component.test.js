import { expect, fixture, html } from '@open-wc/testing';
import lodash from 'lodash';
import { waitUntil } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import { LauncherComponent } from '../../../../src/components/launcher-component/launcher-component.js';
import isRendered from '../../../test-utils/isRendered.js';
import eeaMock from '../../../test-utils/mockdata/ericsson.expert.analytics.config.json' assert { type: 'json' };
import router from '../../../../src/utils/router.js';
import constants from '../../../../src/utils/constants.js';
import { stubRestError, waitForError } from '../../../test-utils/utils.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

import defaultI18n from '../../../../src/components/launcher-component/locale/en-us.json' assert { type: 'json' };

const { SYSTEM_TYPE, PRODUCT_TYPE, EXTERNAL_TYPE } = constants;

const TEST_PRODUCT = eeaMock.groups.find((group) => group.type === PRODUCT_TYPE && !group.hidden);
const TEST_SYSTEM = eeaMock.groups.find((group) => group.type === SYSTEM_TYPE && !group.hidden);
const TEST_APP = eeaMock.apps.find((app) => app.type !== EXTERNAL_TYPE && !app.hidden);
const EXTERNAL_TEST_APP = eeaMock.apps.find((app) => app.type === EXTERNAL_TYPE && !app.hidden);
const HANDLE_SEARCH_SELECTION_EVENT = 'handle-search-selection';

const cssPaths = {
  contentSlot: 'div[slot="content"]',
  eErrorMessageContent: 'e-error-message-content',
  messageDiv: '.message',
};

async function renderApp(productName = null) {
  const htmlTemplate = html`
    <e-launcher-component productName=${productName}></e-launcher-component>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

describe('LauncherComponent Component Tests', () => {
  let productView;
  let goToProductStub;
  let openStub;
  let uiSettingsUtilGetStub;
  before(async () => {
    LauncherComponent.register();
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    goToProductStub = sinon.stub(router, 'goToProduct');
    openStub = sinon.stub(window, 'open');
  });

  after(() => {
    goToProductStub.restore();
    openStub.restore();
    uiSettingsUtilGetStub.restore();
  });

  describe('Basic component setup', () => {
    it('should create a new <e-launcher-component>', async () => {
      const launcher = await renderApp();
      const { shadowRoot } = launcher;

      expect(shadowRoot, 'Shadow root does not exist').to.exist;
      expect(launcher).to.not.null;
    });

    it('should hide hidden apps', async () => {
      const launcher = await renderApp('eea');

      await waitUntil(() => {
        productView = launcher.shadowRoot.querySelector('e-product-view');
        return !lodash.isNull(productView);
      });

      expect(launcher.apps.map((app) => app.name)).to.not.include('call_browser');
      expect(launcher).to.not.null;
    });

    it('should hide children of hidden apps', async () => {
      const launcher = await renderApp('eea');

      await waitUntil(() => {
        productView = launcher.shadowRoot.querySelector('e-product-view');
        return !lodash.isNull(productView);
      });

      expect(launcher.apps.map((app) => app.name)).to.not.include('call_browser_child');
      expect(launcher).to.not.null;
    });

    it(`opens product defined as product`, () => {
      productView.bubble(HANDLE_SEARCH_SELECTION_EVENT, {
        menuItems: [
          {
            value: TEST_PRODUCT.name,
          },
        ],
      });

      expect(openStub.calledOnce).to.be.false;
      expect(goToProductStub.calledOnce).to.be.true;
      expect(goToProductStub.getCall(0).args[0]).to.eq(TEST_PRODUCT.name);
    });

    it(`opens product defined as system`, () => {
      productView.bubble(HANDLE_SEARCH_SELECTION_EVENT, {
        menuItems: [
          {
            value: TEST_SYSTEM.name,
          },
        ],
      });

      expect(openStub.calledTwice).to.be.false;
      expect(goToProductStub.calledTwice).to.be.true;
      expect(goToProductStub.getCall(1).args[0]).to.eq(TEST_SYSTEM.name);
    });

    [
      {
        type: 'internal app',
        app: TEST_APP,
        args: [TEST_APP.route, '_self'],
      },
      {
        type: 'external app',
        app: EXTERNAL_TEST_APP,
        args: [EXTERNAL_TEST_APP.url, '_blank'],
      },
    ].forEach((testCase, index) => {
      it(`opens ${testCase.type}`, () => {
        productView.bubble(HANDLE_SEARCH_SELECTION_EVENT, {
          menuItems: [
            {
              value: testCase.app.name,
            },
          ],
        });

        expect(openStub.callCount).to.eq(index + 1);
        expect(openStub.getCall(index).args).to.deep.eq(testCase.args);
      });
    });
  });

  describe('Error handling test', () => {
    beforeEach(() => {
      sinon.restore();
      uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    });

    after(async () => {
      uiSettingsUtilGetStub.restore();
    });

    it('should handle getApps REST error', async () => {
      const getAppsStub = stubRestError({
        method: 'getApps',
        status: 400,
        statusText: 'Cannot fetch applications',
        url: '/ui-meta/v1/apps',
      });

      const launcherComponent = await renderApp();
      const errorMessageComponent = await waitForError(launcherComponent);

      const contentSlot = errorMessageComponent.querySelector(cssPaths.contentSlot);
      const contentComponent = contentSlot.querySelector(cssPaths.eErrorMessageContent);
      const messageDiv = contentComponent.shadowRoot.querySelector(cssPaths.messageDiv);

      getAppsStub.restore();

      expect(messageDiv.innerText).to.equal(defaultI18n.APP_METADATA_CANNOT_BE_LOADED);
    });

    it('should handle getGroups REST error', async () => {
      const getGroupsStub = stubRestError({
        method: 'getGroups',
        status: 400,
        statusText: 'Cannot fetch groups',
        url: '/ui-meta/v1/groups',
      });

      const launcherComponent = await renderApp();
      const errorMessageComponent = await waitForError(launcherComponent);

      const contentSlot = errorMessageComponent.querySelector(cssPaths.contentSlot);
      const contentComponent = contentSlot.querySelector(cssPaths.eErrorMessageContent);
      const messageDiv = contentComponent.shadowRoot.querySelector(cssPaths.messageDiv);

      getGroupsStub.restore();

      expect(messageDiv.innerText).to.equal(defaultI18n.GROUP_METADATA_CANNOT_BE_LOADED);
    });

    it('should handle both getApps and getGroups REST error together', async () => {
      const getAppsStub = stubRestError({
        method: 'getApps',
        status: 400,
        statusText: 'Error with apps',
        url: '/ui-meta/v1/apps',
      });

      const getGroupsStub = stubRestError({
        method: 'getGroups',
        status: 400,
        statusText: 'Error with groups',
        url: '/ui-meta/v1/groups',
      });

      const launcherComponent = await renderApp();
      const errorMessageComponent = await waitForError(launcherComponent);

      const contentSlot = errorMessageComponent.querySelector(cssPaths.contentSlot);
      const contentComponent = contentSlot.querySelector(cssPaths.eErrorMessageContent);
      const messageDiv = contentComponent.shadowRoot.querySelector(cssPaths.messageDiv);

      getAppsStub.restore();
      getGroupsStub.restore();

      expect(messageDiv.innerText).to.equal(defaultI18n.METADATA_CANNOT_BE_LOADED);
    });
  });
});
