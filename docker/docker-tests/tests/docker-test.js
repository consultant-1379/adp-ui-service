import { expect } from 'chai';
import { GenericContainer, Wait } from 'testcontainers';

const PORT = 3000;
const LISTENING_LOG = `listening on port ${PORT}`;
const ENTRYPOINT_SIGTERM_LOG = 'Caught SIGTERM signal!';
const NODEJS_SIGTERM_LOG = 'SIGTERM signal received: closing server';
const IMAGE_TAG = process.env.IMAGE_TAG || 'eric-adp-gui-aggregator-service';
const STOP_WAITING_TIME = 10; // seconds

describe('Docker container tests', async () => {
  let container;
  const consoleLogs = [];
  const errorLogs = [];

  it('can start the container', async () => {
    container = await new GenericContainer(IMAGE_TAG)
      .withWaitStrategy(Wait.forLogMessage(LISTENING_LOG))
      .withExposedPorts(PORT)
      .withLogConsumer((stream) => {
        stream.on('data', (line) => consoleLogs.push(line));
        stream.on('err', (line) => errorLogs.push(line));
        stream.on('end', () => console.log('Stream closed'));
      })
      .start();
  });

  it('can gracefully stop the container', async () => {
    await container.stop({ timeout: STOP_WAITING_TIME, remove: false });
    expect(errorLogs).to.have.lengthOf(0);
    expect(consoleLogs.join()).to.include(ENTRYPOINT_SIGTERM_LOG);
    expect(consoleLogs.join()).to.include(NODEJS_SIGTERM_LOG);
  });
});
