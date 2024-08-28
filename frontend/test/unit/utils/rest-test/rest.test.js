import { expect } from '@open-wc/testing';
import fetchMock from 'fetch-mock/esm/client';
import sinon from 'sinon';
import logger from '../../../../src/utils/logger.js';
import rest from '../../../../src/utils/rest.js';

const parsedResponse = {
  attribute1: 'some attribute',
  attribute2: 'other attribute',
  boolean: true,
};

const baseContextOpts = {
  protocol: 'http',
  hostname: 'www.test.com',
  path: '/test_path',
};
const validJsonResponse = JSON.stringify(parsedResponse);
const invalidJsonResponse = 'not a valid JSON string';

const TEST_URL = '/api/test';
const FULL_TEST_URL = 'http://www.test.com/test_path/api/test';
const LOG_URL = '../ui-logging/v1/logs';

describe('Unit test for rest module', () => {
  let logCall;

  before(async () => {
    rest.setBaseContext(baseContextOpts);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it(`JSON response should be parsed`, async () => {
    fetchMock.mock(FULL_TEST_URL, {
      status: 200,
      body: validJsonResponse,
    });
    const response = await rest.makeRequest(TEST_URL);
    expect(response).to.deep.equal(parsedResponse);
  });

  it(`non-JSON response should be passed as-is`, async () => {
    fetchMock.mock(FULL_TEST_URL, {
      status: 200,
      body: invalidJsonResponse,
    });

    const response = await rest.makeRequest(TEST_URL);
    expect(response).to.be.equal(invalidJsonResponse);
  });

  it('can set proper baseContext', async () => {
    rest.setBaseContext({ protocol: 'http', hostname: 'www.test.com', path: '/' });
    expect(rest.getBaseContext()).to.eq('http://www.test.com');

    rest.setBaseContext({ path: '/' });
    expect(rest.getBaseContext()).to.eq('');

    rest.setBaseContext();
    expect(rest.getBaseContext()).to.eq('..');

    rest.setBaseContext({ path: '/sub/path/to' });
    expect(rest.getBaseContext()).to.eq('/sub/path/to');

    rest.setBaseContext({ path: '../sub/path' });
    expect(rest.getBaseContext()).to.eq('../sub/path');
  });

  it(`NOK response from the log api should be logged to the console only`, async () => {
    rest.setBaseContext(null);
    const response = {
      status: 404,
      body: '',
    };
    logCall = sinon.spy(logger, 'error');
    const consoleCall = sinon.spy(console, 'error');
    fetchMock.mock(LOG_URL, response);

    try {
      await rest.sendLogEvent({});
    } catch (error) {
      expect(logCall.called).to.be.false;
      expect(consoleCall.called).to.be.true;
      expect(error.name).to.be.eq('HttpError');
    }
  });

  it(`NOK response should be logged, HttpError should be thrown`, async () => {
    rest.setBaseContext(baseContextOpts);
    const response = {
      status: 404,
      body: '',
    };

    const logResponse = {
      status: 200,
      body: '',
    };
    logCall.restore();
    logCall = sinon.spy(logger, 'error');
    fetchMock.mock(FULL_TEST_URL, response);
    fetchMock.mock(LOG_URL, logResponse);

    try {
      await rest.makeRequest(TEST_URL);
    } catch (error) {
      console.log(error);
      expect(logCall.calledOnce).to.be.true;
      expect(error.name).to.be.eq('HttpError');
    }
  });
});
