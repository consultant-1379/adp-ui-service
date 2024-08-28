import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import configManager from '../../../../src/config/configManager.js';
import {
  openUserAccountEditor,
  getUserAccountEditorRoute,
  patchXMLHttpRequest,
  patchFetch,
  getLastLoginTime,
  getPreviousLoginTime,
} from '../../../../src/plugins/authentication/src/authentication.js';
import { stubRouter } from '../../../test-utils/utils.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

const USER_ACCOUNT_URL = 'https://useraccount.nip.io';
const USER_ACCOUNT_HASH = '#useraccount';
const FETCH_REQUEST_PATH = '/ui-meta/loginform';
const XML_REQUEST_PATH = '/ui-meta/xml/loginform';
const sessionExpiredEvent = 'user-session-expired';
const SESSION_EXPIRED_PAGE = 'session-expiration';

describe('Authentication plugin Tests', () => {
  let uiSettingsUtilGetStub;
  let uiSettingsUtilSetStub;
  before(async () => {
    await configManager.initConfig();
    uiSettingsUtilSetStub = sinon.stub(UiSettingsUtil, 'set');
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get');
    window.esmsInitOptions = {
      shimMode: true,
      fetch: (url, options) => fetch(url, options),
    };
  });

  after(async () => {
    uiSettingsUtilGetStub.restore();
    uiSettingsUtilSetStub.restore();
  });

  describe('Basic application setup', () => {
    let configManageUserAccountURLStub;
    let configManageUserLogoutURLStub;

    before(async () => {
      configManageUserAccountURLStub = sinon.stub(configManager, 'getUserAccountURL');
      configManageUserLogoutURLStub = sinon.stub(configManager, 'getLogoutURL');
      uiSettingsUtilGetStub.withArgs('lastLoginTime').returns('202210101201');
      uiSettingsUtilGetStub.withArgs('previousLoginTime').returns('202210101202');
      stubRouter();
    });
    after(() => {
      configManageUserAccountURLStub.restore();
      configManageUserLogoutURLStub.restore();
    });

    it('should get userAccountURL and open it in the current tab', async () => {
      configManageUserAccountURLStub.returns(USER_ACCOUNT_HASH);
      const routerGotoStub = sinon.stub(window.EUI.Router, 'goto');
      routerGotoStub.withArgs(USER_ACCOUNT_HASH).returns({ focus: () => {} });
      openUserAccountEditor();

      routerGotoStub.restore();

      expect(routerGotoStub.called).to.be.true;
      expect(routerGotoStub.calledWith(USER_ACCOUNT_HASH)).to.be.true;
    });

    it('should get userAccountURL and open new tab', async () => {
      configManageUserAccountURLStub.returns(USER_ACCOUNT_URL);
      const windowOpenStub = sinon.stub(window, 'open').returns({ focus: () => {} });
      openUserAccountEditor();

      windowOpenStub.restore();

      expect(windowOpenStub.called).to.be.true;
      expect(windowOpenStub.calledWith(USER_ACCOUNT_URL, '_blank')).to.be.true;
    });

    it('should get logoutURL', async () => {
      expect(getUserAccountEditorRoute()).to.be.eq(USER_ACCOUNT_URL);
    });

    it('should get last login time', async () => {
      expect(await getLastLoginTime()).to.be.eq('202210101201');
    });

    it('should get previous login time', async () => {
      expect(await getPreviousLoginTime()).to.be.eq('202210101202');
    });
  });

  describe('Request patch Tests', () => {
    let dispatchSpy;

    before(async () => {
      await configManager.initConfig();
      dispatchSpy = sinon.spy(document.body, 'dispatchEvent');
    });

    afterEach(() => {
      dispatchSpy.resetHistory();
    });

    it('session expiration should redirect to login page in case of XHTTP request', async () => {
      patchXMLHttpRequest();

      const req = new XMLHttpRequest();
      req.open('GET', XML_REQUEST_PATH);
      req.send(null);
      req.onload = () => {
        const event = new Event(sessionExpiredEvent);

        expect(dispatchSpy.called).to.be.true;
        expect(dispatchSpy.calledWith(event)).to.be.true;
      };
    });

    it('session expiration should redirect to login page in case of fetch request', async () => {
      patchFetch();
      const routerGotoStub = sinon.stub(window.EUI.Router, 'goto');
      routerGotoStub.withArgs(SESSION_EXPIRED_PAGE).returns({ focus: () => {} });
      await fetch(FETCH_REQUEST_PATH);
      const event = new Event(sessionExpiredEvent);

      routerGotoStub.restore();

      expect(dispatchSpy.called).to.be.true;
      expect(dispatchSpy.calledWith(event)).to.be.true;
      expect(routerGotoStub.called).to.be.true;
      expect(routerGotoStub.calledWith(SESSION_EXPIRED_PAGE)).to.be.true;
    });
  });
});
