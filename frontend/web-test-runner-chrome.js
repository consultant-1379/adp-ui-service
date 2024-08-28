import { chromeLauncher } from '@web/test-runner';
import config from './web-test-runner.config.js';

export default {
  ...config,
  browsers: [
    chromeLauncher({
      launchOptions: {
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox'],
      },
    }),
  ],
};
