import path from 'path';

import { execSync } from 'child_process';

const command =
  `${path.join('node_modules', '.bin', 'allure')}` +
  ` generate test_js/allure-results` +
  ` --clean` +
  ` --report-dir test_js/allure-report`;

console.log(`Executing command: ${command}`);

execSync(command, { stdio: 'inherit' });
