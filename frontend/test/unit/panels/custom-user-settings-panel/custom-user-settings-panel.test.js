import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import CustomUserSettingsPanel from '../../../../src/panels/custom-user-settings-panel/custom-user-settings-panel';
import isRendered from '../../../test-utils/isRendered.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil';

const renderCustomUserSettingsPanel = async () => {
  const template = html`
    <e-custom-user-settings-panel></e-custom-user-settings-panel>
  `;
  const element = await fixture(template);
  await isRendered(element);
  return element;
};

const mockAndRender = async ({ username, timestamp, userAccountURL }) => {
  sinon.stub(UiSettingsUtil, 'get').returns(null);
  const eventHandler = (event) => {
    let value;
    switch (event.detail.method) {
      case 'getLastLoginTime':
        value = timestamp;
        break;
      case 'getUserAccountEditorRoute':
        value = userAccountURL;
        break;
      case 'getUsername':
        value = username;
        break;
      default:
    }
    event.detail.params.callback(value);
  };
  document.addEventListener('eui-plugins:execute', eventHandler);

  const revokeMocks = () => {
    sinon.restore();
    document.removeEventListener('eui-plugins:execute', eventHandler);
  };
  return {
    userSettingsPanel: await renderCustomUserSettingsPanel(),
    revokeMocks,
  };
};

describe('CustomUserSettingsPanel Component Tests', () => {
  let shadowRoot;
  let userSettingsPanel;
  const defaultUsername = '';
  before(() => {
    CustomUserSettingsPanel.register();
  });

  describe('Basic component setup', () => {
    let revokeMocks;
    before(async () => {
      ({ userSettingsPanel, revokeMocks } = await mockAndRender({ username: null }));
      ({ shadowRoot } = userSettingsPanel);
    });

    after(() => {
      revokeMocks();
    });

    it('should create a new <e-custom-user-settings-panel>', () => {
      expect(shadowRoot, 'shadow root does not exist').to.exist;
      expect(userSettingsPanel, 'user settings panel component does not exist').to.exist;
    });

    it('should render empty username by default', () => {
      const renderedUsername = shadowRoot.querySelectorAll('.username')[0].textContent;
      expect(defaultUsername).to.equal(renderedUsername);
    });
  });

  describe('Logged in user without userAccountURL', () => {
    const TEST_USER_NAME = 'test user';
    const TEST_TIMESTAMP = '1663951238';
    let revokeMocks;

    before(async () => {
      ({ userSettingsPanel, revokeMocks } = await mockAndRender({
        username: TEST_USER_NAME,
        timestamp: TEST_TIMESTAMP,
      }));
      ({ shadowRoot } = userSettingsPanel);
    });

    after(() => {
      revokeMocks();
    });

    it('should render test user username', () => {
      const renderedUsername = shadowRoot.querySelectorAll('.username')[0].textContent;
      expect(TEST_USER_NAME).to.equal(renderedUsername);
    });

    it('last login time is shown', () => {
      const renderedLoginText = shadowRoot.querySelector('#loginText').textContent.trim();
      expect(renderedLoginText).to.match(/^Last sign in was/);
    });

    it('should not render an user edit button', () => {
      const userEditButton = shadowRoot.querySelector('.userEditButton');
      expect(userEditButton).not.to.exist;
    });
  });

  describe('User account URL', () => {
    const TEST_USER_NAME = 'test user';
    const TEST_URL = '#internalURL';
    let revokeMocks;

    beforeEach(async () => {
      ({ userSettingsPanel, revokeMocks } = await mockAndRender({
        username: TEST_USER_NAME,
        userAccountURL: TEST_URL,
      }));
      ({ shadowRoot } = userSettingsPanel);
    });

    afterEach(() => {
      revokeMocks();
    });

    it('should render an user edit button', () => {
      const userEditButton = shadowRoot.querySelector('.userEditButton');
      expect(userEditButton).to.exist;
    });
  });
});
