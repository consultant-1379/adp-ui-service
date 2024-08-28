import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { Theme } from '@eui/theme/theme';
import { Container } from '@eui/container';
import configManager from '../../../../src/config/configManager.js';
import {
  applyPersistedTheme,
  registerThemeChangeHandler,
  themeChanged,
} from '../../../../src/plugins/settings-plugin/src/gas-settings-plugin.js';
import { stubRouter } from '../../../test-utils/utils.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';
import CONSTANTS from '../../../../src/utils/constants.js';

const { COMMON_NAMESPACE } = CONSTANTS;

const renderTheme = async () => {
  const template = html`
    <eui-theme theme="dark"></eui-theme>
  `;

  return fixture(template);
};

const renderContainer = async () => {
  const template = html`
    <eui-container></eui-container>
  `;

  return fixture(template);
};

describe('Settings plugin Tests', () => {
  let uiSettingsUtilGetStub;
  before(async () => {
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get');
    Theme.register();
    Container.register();

    await configManager.initConfig();
    window.esmsInitOptions = {
      shimMode: true,
      async fetch(url, options) {
        const res = await fetch(url, options);
        if (!res.ok) {
          return res;
        }
        return res;
      },
    };
  });

  after(async () => {
    uiSettingsUtilGetStub.restore();
  });

  describe('Basic application setup', () => {
    before(async () => {
      stubRouter();
    });
    it('should set persisted theme', async () => {
      uiSettingsUtilGetStub.withArgs('theme', COMMON_NAMESPACE).returns('light');
      const theme = await renderTheme();
      const bubbleSpy = sinon.spy(theme, 'bubble');

      await applyPersistedTheme();
      expect(bubbleSpy.called).to.be.true;
      expect(bubbleSpy.calledWith('eui-theme-change', { theme: 'light' })).to.be.true;
    });

    it('should register theme change handler', async () => {
      const container = await renderContainer();
      const addEventListenerSpy = sinon.spy(container, 'addEventListener');

      registerThemeChangeHandler();
      expect(addEventListenerSpy.called).to.be.true;
      expect(addEventListenerSpy.calledWith('eui-theme-change', themeChanged)).to.be.true;
    });
  });
});
