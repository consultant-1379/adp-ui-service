import { expect } from '@open-wc/testing';
import sinon from 'sinon';

const IMPORT_MAP_PATH = '/ui-serve/v1/import-map';
const ROOT_TEST_PATH = '/';
const TEST_PATH = '/ws';
const TEST_HOST = 'eic.com';
const TEST_PROTOCOL = 'https';

const getSrcFromDOM = (outerHTML) =>
  outerHTML
    .match(/src=".*"/)[0]
    .match(/".*"/)[0]
    .replaceAll('"', '');

describe('InitImportmap Tests', () => {
  let initImportmap;
  let appendChildStub;
  let importMapScript;

  const stubFetch = async (uiConfig) => {
    sinon.stub(window, 'fetch').callsFake(() => Promise.resolve({ json: async () => uiConfig }));
    appendChildStub = sinon.stub(document.body, 'appendChild');
    if (!initImportmap) {
      initImportmap = await import('http://localhost:8000/scripts/initImportmap.js');
    } else {
      await initImportmap.initImportmap();
    }
    [importMapScript] = appendChildStub.getCall(0).args;
  };

  before(async () => {
    await stubFetch({ rest: {} });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('creates importmap with default config if uiconfig is not set', async () => {
    expect(getSrcFromDOM(importMapScript.outerHTML)).to.eq(`..${IMPORT_MAP_PATH}`);
  });

  it('sets path to the root when "/" is set as path', async () => {
    await stubFetch({ rest: { path: ROOT_TEST_PATH } });
    expect(getSrcFromDOM(importMapScript.outerHTML)).to.eq(IMPORT_MAP_PATH);
  });

  it('sets path from uiconfig for the importmap', async () => {
    await stubFetch({ rest: { path: TEST_PATH } });
    expect(getSrcFromDOM(importMapScript.outerHTML)).to.eq(`${TEST_PATH}${IMPORT_MAP_PATH}`);
  });

  it('sets hostname and protocol from uiconfig for the importmap', async () => {
    await stubFetch({
      rest: { path: TEST_PATH, hostname: TEST_HOST, protocol: TEST_PROTOCOL },
    });
    expect(getSrcFromDOM(importMapScript.outerHTML)).to.eq(
      `${TEST_PROTOCOL}://${TEST_HOST}${TEST_PATH}${IMPORT_MAP_PATH}`,
    );
  });
});
