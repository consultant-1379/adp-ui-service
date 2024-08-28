import { playwrightLauncher } from '@web/test-runner-playwright';
import config from './web-test-runner.config.js';

export default {
  ...config,
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      concurrency: 1,
      launchOptions: {
        args: ['--no-sandbox'],
      },
    }),
    playwrightLauncher({
      product: 'firefox',
      concurrency: 1,
      launchOptions: {
        args: ['-headless'],
      },
    }),
  ],
};
