import { expect } from 'chai';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { glob } from 'glob';
import { schemaValidator } from '../../utils/schemaValidator.js';

const FILE_SEARCH_TIMEOUT = 240_000;

const require = createRequire(import.meta.url);
const gasAPIConfig = require('../../config/api-config.json');
const launcherAPIConfig = require('../../../frontend/src/config/api-config.json');

const SKIPPED_CONFIG = ['manualconfig-invalid-test.config.json'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validateConfigFile = async (fileName, dirPath = '') => {
  console.time(fileName);
  let content = await fs.promises.readFile(path.join(dirPath, fileName));
  content = JSON.parse(content);
  let result;
  if (fileName.includes('package.json')) {
    result = schemaValidator.validatePackageConfig(content);
  } else {
    result = schemaValidator.validateConfig(content);
  }
  console.timeEnd(fileName);
  return { result, fileName };
};

describe('API Config', () => {
  it('api-config.json is same in GAS and Launcher', () => {
    expect(gasAPIConfig.meta).to.deep.equal(launcherAPIConfig.meta);
    expect(gasAPIConfig.logging).to.deep.equal(launcherAPIConfig.logging);
    expect(gasAPIConfig.serve).to.deep.equal(launcherAPIConfig.serve);
  });
});

describe('Mock config files', () => {
  it('are all valid', async () => {
    const dirPath = path.join(__dirname, '../mocks/configs');
    const dir = await fs.promises.opendir(dirPath);
    const errors = [];

    let dirEntry;
    // eslint-disable-next-line no-cond-assign
    while ((dirEntry = dir.readSync()) !== null) {
      if (
        dirEntry.isFile() &&
        !SKIPPED_CONFIG.includes(dirEntry.name) &&
        // eslint-disable-next-line no-await-in-loop
        !(await validateConfigFile(dirEntry.name, dirPath))?.result?.valid
      ) {
        errors.push(dirEntry.name);
      }
    }
    dir.closeSync();
    expect(errors).has.lengthOf(
      0,
      `The following mock config(s) are not valid: ${errors.join(', ')}`,
    );
  });
});

describe('Demo configs and package configs', () => {
  // eslint-disable-next-line func-names
  it('are all valid', async function () {
    console.time('overall');
    // The glob command can take very long times in Jenkins.
    this.timeout(FILE_SEARCH_TIMEOUT);
    const filesUnderPublicPath = glob.sync(
      `${path.join(__dirname, '../../../mock/domain-ui-generic/public')}/**/config?(.package).json`,
    );
    console.timeLog('overall', 'glob found all files');
    const results = await Promise.allSettled(
      filesUnderPublicPath.map((file) => validateConfigFile(file)),
    );
    console.timeLog('overall', 'results all settled');
    const errors = results
      .filter((result) => result.status !== 'fulfilled' && !result.value?.result?.valid)
      .map((result) => result?.value?.fileName);
    console.timeLog('overall', 'errors are processed');
    expect(errors).has.lengthOf(
      0,
      `The following demo config(s) are not valid: ${errors.join(', ')}`,
    );
    console.log(`Expectation error length: ${errors.length}`);
    console.timeEnd('overall');
  });
});
