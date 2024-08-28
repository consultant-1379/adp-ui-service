import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  onBeforeContainerLoad,
  onBeforeAppLoad,
} from '../../../../src/plugins/appstate-plugin/src/appstate-plugin.js';
import router from '../../../../src/utils/router.js';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

const INTEGRATED_APP_NAME = 'integrated-app';

describe('AppStates plugin Tests', () => {
  let uiSettingsUtilSetStub;
  let uiSettingsUtilGetStub;
  before(async () => {
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    uiSettingsUtilSetStub = sinon.stub(UiSettingsUtil, 'set').returns(null);
    await onBeforeContainerLoad()(() => {});
  });

  after(async () => {
    uiSettingsUtilGetStub.restore();
    uiSettingsUtilSetStub.restore();
  });

  it('integrated up is added to the localstorage', async () => {
    await onBeforeAppLoad({ name: INTEGRATED_APP_NAME })(() => {});
    const expected = uiSettingsUtilSetStub.getCall(0).args;
    expect(expected[0]).to.equal('appStates');
    expect(expected[1][INTEGRATED_APP_NAME].lastOpened).to.be.a('number');
  });

  it('root application is not added to the localstorage', async () => {
    onBeforeAppLoad({ name: router.pageRoute })(() => {});
    const expected = uiSettingsUtilSetStub.getCall(0).args;
    expect(expected[0]).to.equal('appStates');
    expect(expected[1]).to.not.have.keys(router.pageRoute);
  });
});
