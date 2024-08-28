import { createRequire } from 'module';
import fs from 'fs';
import extract from 'extract-json-from-string';

const require = createRequire(import.meta.url);
const { exec } = require('child_process');

const OUTDATED_COMMAND_RESULTS = 'outdated-command-results.json';
const OUTDATED_3PPS_CONFIG = 'outdated-3pps-config.json';

/**
 * Merge all 3pps configs to single one
 *
 * @param {Array<object>} outdated3ppsConfigs
 * @returns {Object}
 */
function merge3ppsConfigs(outdated3ppsConfigs) {
  return Object.assign(...outdated3ppsConfigs);
}

/**
 * Filter object to get production 3pps only
 *
 * @param {Object} outdated3ppsConfig
 * @returns {Object} config with production 3pps only
 */
function getProd3ppsConfig(outdated3ppsConfig) {
  const outdated3ppsMap = Object.entries(outdated3ppsConfig);
  const outdatedProd3ppsConfig = {};
  [...outdated3ppsMap].forEach((outdated3ppsArr) => {
    const { type, current, wanted, latest } = outdated3ppsArr[1];
    if (type === 'dependencies') {
      outdatedProd3ppsConfig[outdated3ppsArr[0]] = {
        current,
        wanted,
        latest,
      };
    }
  });
  return outdatedProd3ppsConfig;
}

/**
 * Async execution for child_proccess
 *
 * @param {String} command
 * @returns
 */
function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr && stderr.length > 0 && !stderr.includes('npm notice')) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Create a file with npm outdated results
 */
async function saveOutdatedCommandResult() {
  const outdated3ppCommands = process.argv.slice(2);
  const promises = [];
  outdated3ppCommands.forEach((outdated3ppCommand) => {
    const promise = execAsync(
      `npm run ${outdated3ppCommand} --json=true --depth=0 --long=true >> ${OUTDATED_COMMAND_RESULTS}`,
    ).catch((e) => {
      console.error(`Error occurs while running ${outdated3ppCommand} command: `, e);
    });
    promises.push(promise);
  });
  return Promise.all(promises);
}

/**
 * Read outdated command result and convert it to correct json
 *
 */
function main() {
  const outdatedCommandResult = fs.readFileSync(OUTDATED_COMMAND_RESULTS, 'utf8');
  const outdated3ppsConfigs = extract(outdatedCommandResult);
  if (!outdated3ppsConfigs.length) {
    console.error(`There are not outdated 3pps to be uplifted!`);
    return;
  }
  const mergedOutdated3ppsConfig = merge3ppsConfigs(outdated3ppsConfigs);
  const outdated3ppsConfig = getProd3ppsConfig(mergedOutdated3ppsConfig);

  try {
    fs.writeFileSync(OUTDATED_3PPS_CONFIG, JSON.stringify(outdated3ppsConfig));
    console.log(`SUCCESS: ${OUTDATED_3PPS_CONFIG} was created!`);
  } catch (err) {
    console.error(`Error occurs while generating ${OUTDATED_3PPS_CONFIG}:`, err);
  }
}

await saveOutdatedCommandResult();
main();
