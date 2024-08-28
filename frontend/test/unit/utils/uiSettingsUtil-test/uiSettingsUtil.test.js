import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import CONSTANTS from '../../../../src/utils/constants.js';

const { COMMON_NAMESPACE, DEFAULT_NAMESPACE } = CONSTANTS;

const renderContainer = async () => {
  const template = html`
    <eui-container></eui-container>
  `;

  return fixture(template);
};

const KEY = 'test-key';
const VALUE = 'test value';

const getDetail = (method, params) => ({
  plugin: 'ui-settings-plugin',
  method,
  params: {
    ...params,
    namespace: params.namespace || DEFAULT_NAMESPACE,
  },
});

const eventDetailWithoutCallback = (detail) => ({
  plugin: detail.plugin,
  method: detail.method,
  params: {
    key: detail.params.key,
    namespace: detail.params.namespace,
    ...(detail.method === 'set' && { value: detail.params.value }),
  },
});

describe('Unit tests for Ui Settings Util', () => {
  let UiSettingsUtil;
  let contextSpy;
  before(async () => {
    await renderContainer();
    UiSettingsUtil = await import('../../../../src/utils/uiSettingsUtil.js');
  });

  beforeEach(() => {
    contextSpy = sinon.spy(UiSettingsUtil.default.context, 'dispatchEvent');
  });

  afterEach(() => {
    contextSpy.restore();
  });

  it('can call set()', () => {
    UiSettingsUtil.default.set(KEY, VALUE);
    const { detail } = contextSpy.getCall(0).args[0];
    expect(eventDetailWithoutCallback(detail)).to.deep.eq(
      getDetail('set', { key: KEY, value: VALUE }),
    );
    expect(UiSettingsUtil.default.set(KEY, VALUE)).to.be.a('promise');
    // check if original callback is function type
    expect(detail.params.callback instanceof Function).to.be.true;
  });

  it('can call set() with other namespace', () => {
    UiSettingsUtil.default.set(KEY, VALUE, COMMON_NAMESPACE);
    const { detail } = contextSpy.getCall(0).args[0];
    expect(eventDetailWithoutCallback(detail)).to.deep.eq(
      getDetail('set', { key: KEY, value: VALUE, namespace: COMMON_NAMESPACE }),
    );
    expect(UiSettingsUtil.default.set(KEY, VALUE, COMMON_NAMESPACE)).to.be.a('promise');
  });

  it('can call get()', () => {
    UiSettingsUtil.default.get(KEY);
    const { detail } = contextSpy.getCall(0).args[0];
    expect(eventDetailWithoutCallback(detail)).to.deep.eq(getDetail('get', { key: KEY }));
    expect(UiSettingsUtil.default.set(KEY)).to.be.a('promise');
  });

  it('can call get() with other namespace', () => {
    UiSettingsUtil.default.get(KEY, COMMON_NAMESPACE);
    const { detail } = contextSpy.getCall(0).args[0];
    expect(eventDetailWithoutCallback(detail)).to.deep.eq(
      getDetail('get', { key: KEY, namespace: COMMON_NAMESPACE }),
    );
    expect(UiSettingsUtil.default.get(KEY, COMMON_NAMESPACE)).to.be.a('promise');
  });

  it('can call remove()', () => {
    UiSettingsUtil.default.remove(KEY);
    const { detail } = contextSpy.getCall(0).args[0];
    expect(eventDetailWithoutCallback(detail)).to.deep.eq(getDetail('remove', { key: KEY }));
    expect(UiSettingsUtil.default.set(KEY)).to.be.a('promise');
  });

  it('can call remove() with other namespace', () => {
    UiSettingsUtil.default.remove(KEY, COMMON_NAMESPACE);
    const { detail } = contextSpy.getCall(0).args[0];
    expect(eventDetailWithoutCallback(detail)).to.deep.eq(
      getDetail('remove', { key: KEY, namespace: COMMON_NAMESPACE }),
    );
    expect(UiSettingsUtil.default.remove(KEY, COMMON_NAMESPACE)).to.be.a('promise');
  });
});
