import { expect } from '@open-wc/testing';
import {
  get,
  set,
  remove,
  onBeforeContainerLoad,
} from '../../../../src/plugins/ui-settings-plugin/src/ui-settings-plugin.js';

import CONSTANTS from '../../../../src/utils/constants.js';

const { DEFAULT_NAMESPACE } = CONSTANTS;

describe('Unit test for UI Settings plugin', () => {
  const DEFAULT_USER = 'defaultUser';
  const testKey = 'testKey';
  const testValue = 'test value';
  const testNamespace = 'my-app';
  const expectedDefaultKey = `${DEFAULT_USER}/${DEFAULT_NAMESPACE}/${testKey}`;

  before(async () => {
    await onBeforeContainerLoad()(() => {});
    document.body.dispatchEvent(new CustomEvent('set-username-finished', { detail: DEFAULT_USER }));
    localStorage.clear();
  });

  after(() => {
    localStorage.clear();
  });

  it('get() should return the previously set item', async () => {
    await set({ namespace: DEFAULT_NAMESPACE, key: testKey, value: testValue });
    expect(localStorage.length).to.be.eq(1);
    expect(localStorage.getItem(expectedDefaultKey)).not.to.be.null;
    expect(await get({ namespace: DEFAULT_NAMESPACE, key: testKey })).to.be.eq(testValue);
  });

  it('remove() should remove the previously set item if found', async () => {
    const expectedKey = `${DEFAULT_USER}/${testNamespace}/${testKey}`;
    await set({ namespace: testNamespace, key: testKey, value: testValue });
    const valueBeforeRemove = localStorage.getItem(expectedKey);
    await remove({ namespace: testNamespace, key: testKey });
    expect(valueBeforeRemove).not.to.be.null;
    expect(localStorage.getItem(expectedKey)).to.be.null;
  });

  it('set() should be able to persist array', async () => {
    const key = 'array';
    const expectedArrayKey = `${DEFAULT_USER}/${testNamespace}/${key}`;
    const testArray = ['value1', 'value2', 'value3'];
    await set({ namespace: testNamespace, key, value: testArray });

    expect(await get({ namespace: testNamespace, key })).to.deep.equal(testArray);
    expect(JSON.parse(localStorage.getItem(expectedArrayKey))).to.deep.equal(testArray);
  });
});
