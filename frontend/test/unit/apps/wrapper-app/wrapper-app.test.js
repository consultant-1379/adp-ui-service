import { expect, fixture, html } from '@open-wc/testing';
import { waitUntil } from '@open-wc/testing-helpers';
import lodash from 'lodash';
import WrapperApp from '../../../../src/apps/wrapper-app/wrapper-app.js';
import isRendered from '../../../test-utils/isRendered.js';
import loc from '../../../../src/apps/wrapper-app/locale/en-us.json' assert { type: 'json' };
import CONSTANT from '../../../test-utils/constants.js';
import { stubRestError, waitForError } from '../../../test-utils/utils.js';

const cssPaths = {
  contentSlot: 'div[slot="content"]',
  eErrorMessageContent: 'e-error-message-content',
  messageDiv: '.message',
};

async function renderApp(metaData) {
  const htmlTemplate = html`
    <e-wrapper-app .metaData=${metaData}></e-wrapper-app>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

async function waitForIFrame(app) {
  let iframe;
  await waitUntil(
    () => {
      iframe = app.shadowRoot.querySelector('iframe');
      return !lodash.isNull(iframe);
    },
    'IFrame should be rendered in time.',
    { interval: 50, timeout: CONSTANT.CHILDREN_WAIT_TIMEOUT },
  );
  return iframe;
}

const TEST_URL = 'http://test.url/';
const QUERY_STRING = 'name=bob&age=12';

describe('WrapperApp Application Tests', () => {
  before(async () => {
    WrapperApp.register();
  });

  describe('Basic component setup', () => {
    it('adds URL from the metadata', async () => {
      const app = await renderApp({
        options: {
          url: TEST_URL,
        },
      });
      const iframe = await waitForIFrame(app);
      expect(iframe.src).to.eq(TEST_URL);
      expect(iframe.title).to.eq(loc.I_FRAME_TITLE);
    });

    it('appends query string from the metadata', async () => {
      const app = await renderApp({
        options: {
          url: TEST_URL,
          query: `?${QUERY_STRING}`,
        },
      });
      const iframe = await waitForIFrame(app);
      expect(iframe.src).to.eq(`${TEST_URL}?${QUERY_STRING}`);
    });

    it('handles query string without question marks', async () => {
      const app = await renderApp({
        options: {
          url: TEST_URL,
          query: `${QUERY_STRING}`,
        },
      });
      const iframe = await waitForIFrame(app);
      expect(iframe.src).to.eq(`${TEST_URL}?${QUERY_STRING}`);
    });
  });

  it('shows error message if options is missing from the metadata', async () => {
    const app = await renderApp({});

    const errorMessageComponent = await waitForError(app);

    const contentSlot = errorMessageComponent.querySelector(cssPaths.contentSlot);
    const contentComponent = contentSlot.querySelector(cssPaths.eErrorMessageContent);
    const messageDiv = contentComponent.shadowRoot.querySelector(cssPaths.messageDiv);

    expect(messageDiv.innerText).to.equal(loc.OPTIONS_MISSING);
  });

  describe('Error handling test', () => {
    it('shows error message if the URL is missing from the metadata options', async () => {
      const app = await renderApp({
        options: {},
      });
      const errorMessageComponent = await waitForError(app);

      const contentSlot = errorMessageComponent.querySelector(cssPaths.contentSlot);
      const contentComponent = contentSlot.querySelector(cssPaths.eErrorMessageContent);
      const messageDiv = contentComponent.shadowRoot.querySelector(cssPaths.messageDiv);

      expect(messageDiv.innerText).to.equal(loc.URL_MISSING);
    });

    it('shows error message if getGroups REST request throws an error', async () => {
      const getGroupsStub = stubRestError({
        method: 'getGroups',
        status: 400,
        statusText: 'Bad Request',
        url: '',
      });

      const launcherComponent = await renderApp();
      const errorMessageComponent = await waitForError(launcherComponent);

      const contentSlot = errorMessageComponent.querySelector(cssPaths.contentSlot);
      const contentComponent = contentSlot.querySelector(cssPaths.eErrorMessageContent);
      const messageDiv = contentComponent.shadowRoot.querySelector(cssPaths.messageDiv);

      getGroupsStub.restore();

      expect(messageDiv.innerText).to.equal(loc.GROUP_METADATA_CANNOT_BE_LOADED);
    });
  });
});
