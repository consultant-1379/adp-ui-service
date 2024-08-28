import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  appHasChildren,
  getFavoriteStateOfApp,
  setHierarchicAppStructure,
  updateHiddenStates,
  handleAppStateChange,
} from '../../../../src/utils/appUtils.js';
import constants from '../../../../src/utils/constants';
import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

const { FAVORITE_STATE, LAST_OPENED } = constants;

const APPS_WITHOUT_CHILDREN = [{ name: 'App1' }, { name: 'App2' }];
const APPS_WITHOUT_CHILDREN_RESULT = [
  {
    name: 'App1',
    favoriteState: FAVORITE_STATE.NOT_FAVORITE,
  },
  {
    name: 'App2',
    favoriteState: FAVORITE_STATE.NOT_FAVORITE,
  },
];

const APPS_WITH_CHILDREN = [
  {
    name: 'Parent',
    childNames: ['child1', 'child2'],
  },
  {
    name: 'child1',
  },
  {
    name: 'child2',
  },
];

const HIDDEN_APPS_WITH_CHILDREN = [
  {
    name: 'Parent',
    childNames: ['child1', 'child2'],
    hidden: true,
  },
  {
    name: 'child1',
  },
  {
    name: 'child2',
  },
];

const HIDDEN_APPS_WITH_CHILDREN_RESULT = [
  {
    name: 'Parent',
    childNames: ['child1', 'child2'],
    hidden: true,
  },
  {
    name: 'child1',
    hidden: true,
  },
  {
    name: 'child2',
    hidden: true,
  },
];

const APPS_WITH_CHILDREN_RESULT = [
  {
    name: 'Parent',
    childNames: ['child1', 'child2'],
    childApps: [
      { name: 'child1', isChild: true, favoriteState: FAVORITE_STATE.NOT_FAVORITE },
      { name: 'child2', isChild: true, favoriteState: FAVORITE_STATE.NOT_FAVORITE },
    ],
    favoriteState: FAVORITE_STATE.NOT_FAVORITE,
  },
  { name: 'child1', isChild: true, favoriteState: FAVORITE_STATE.NOT_FAVORITE },
  { name: 'child2', isChild: true, favoriteState: FAVORITE_STATE.NOT_FAVORITE },
];

const appStateEvent1 = {
  detail: {
    appName: 'Recent App1',
    changed: { [LAST_OPENED]: Date.now() },
  },
};

const appStateEvent2 = {
  detail: {
    appName: 'Recent App2',
    changed: { [LAST_OPENED]: Date.now() },
  },
};

const recentApp1 = {
  'Recent App1': { [LAST_OPENED]: Date.now() },
};

const recentApp2 = {
  'Recent App2': { [LAST_OPENED]: Date.now() },
};

describe('Unit test for AppUtils', () => {
  it('can determine if app has children', () => {
    expect(appHasChildren({})).to.be.false;
    expect(appHasChildren({ childApps: [] })).to.be.false;
    expect(appHasChildren({ childApps: [{}] })).to.be.true;
  });

  it('can determine the favorite state of the app', () => {
    expect(getFavoriteStateOfApp({ isFavorite: true })).to.eq(FAVORITE_STATE.FAVORITE);
    expect(getFavoriteStateOfApp({ childApps: [{ isFavorite: true }] })).to.eq(
      FAVORITE_STATE.PARTIALLY_FAVORITE,
    );
    expect(getFavoriteStateOfApp({ isFavorite: false })).to.eq(FAVORITE_STATE.NOT_FAVORITE);
  });

  it('can set hierarchical app structure', () => {
    setHierarchicAppStructure(APPS_WITHOUT_CHILDREN);
    setHierarchicAppStructure(APPS_WITH_CHILDREN);

    expect(APPS_WITHOUT_CHILDREN).to.deep.eq(APPS_WITHOUT_CHILDREN_RESULT);
    expect(APPS_WITH_CHILDREN).to.deep.eq(APPS_WITH_CHILDREN_RESULT);
  });

  it('can add hidden status to all children of the hidden app', () => {
    const hiddenApps = updateHiddenStates(HIDDEN_APPS_WITH_CHILDREN);
    expect(hiddenApps).to.deep.eq(HIDDEN_APPS_WITH_CHILDREN_RESULT);
  });

  it('can handle appstate change event', async () => {
    const uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(null);
    const uiSettingsUtilSetStub = sinon.stub(UiSettingsUtil, 'set');
    await handleAppStateChange(appStateEvent1);
    expect(uiSettingsUtilSetStub.calledOnce).to.be.true;
    expect(uiSettingsUtilSetStub.calledWithExactly('appStates', recentApp1)).to.be.true;
    uiSettingsUtilSetStub.restore();
    uiSettingsUtilGetStub.restore();
  });

  it('can handle multiple appstate change event', async () => {
    const uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get').returns(recentApp1);
    const uiSettingsUtilSetStub = sinon.stub(UiSettingsUtil, 'set');
    await handleAppStateChange(appStateEvent2);
    expect(uiSettingsUtilSetStub.calledOnce).to.be.true;
    expect(uiSettingsUtilSetStub.calledWithExactly('appStates', { ...recentApp1, ...recentApp2 }))
      .to.be.true;
    uiSettingsUtilSetStub.restore();
    uiSettingsUtilGetStub.restore();
  });
});
