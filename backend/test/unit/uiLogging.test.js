import { expect } from 'chai';
import { formatUIInformation } from '../../services/uiLogging.js';

const DUMMY_REQUEST = {
  body: {
    timestamp: '2021-02-09T09:00:00.000Z',
    uniqueLogId: 'GAS-logging-testing-sequence',
    message: 'Test message',
    category: 'Test category',
    severity: 'info',
  },
};

describe('Unit tests for uiLogging.js', () => {
  it('should return the log level and log message formatted', () => {
    const formattedRequest = formatUIInformation(DUMMY_REQUEST);

    expect(formattedRequest.level).to.be.eq(DUMMY_REQUEST.body.severity);
    expect(formattedRequest.message).to.be.eq(
      `[${DUMMY_REQUEST.body.category}] [${DUMMY_REQUEST.body.uniqueLogId}] ${DUMMY_REQUEST.body.message}`,
    );
    expect(formattedRequest.timestamp).to.be.eq(DUMMY_REQUEST.body.timestamp);
  });
});
