import { createRequire } from 'module';

import crypto from 'crypto';
import * as fs from 'fs';
import path from 'path';
import marge from 'mochawesome-report-generator';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
const { name } = require('../../package.json');

const isPassed = (test) => test.passed;
const isFailed = (test) => !test.skipped && !test.passed;
const isSkipped = (test) => test.skipped;

const getSums = (testResults) => {
  const returnObj = {
    numberOfSuites: testResults.suites.length,
    numberOfTests: testResults.tests.length,
    numberOfPasses: testResults.tests.filter(isPassed).length,
    numberOfFailures: testResults.tests.filter(isFailed).length,
    numberOfSkipped: testResults.tests.filter(isSkipped).length,
  };

  const suites = [...testResults.suites];

  while (suites.length !== 0) {
    const suite = suites.pop();
    returnObj.numberOfSuites += suite.suites.length;
    returnObj.numberOfTests += suite.tests.length;
    returnObj.numberOfPasses += suite.tests.filter(isPassed).length;
    returnObj.numberOfFailures += suite.tests.filter(isFailed).length;
    returnObj.numberOfSkipped += suite.tests.filter(isSkipped).length;
    suites.push(...suite.suites);
  }

  return returnObj;
};

const mapError = (testError, errors) => {
  if (testError) {
    return {
      message: `${testError.name}: ${testError.message}`,
      estack: testError.stack,
      diff: `- ${testError.actual}\n+ ${testError.expected}\n`,
    };
  }
  if (errors.length !== 0) {
    const error = errors[0];
    return {
      message: `${error.name}: ${error.message}`,
      estack: error.stack,
    };
  }
  return {};
};

const getState = (test) => {
  if (isSkipped(test)) {
    return 'skipped';
  }
  if (isFailed(test)) {
    return 'failed';
  }
  return 'passed';
};

const mapTest = (test, parentUUID, errors, title) => {
  const uuid = crypto.randomUUID();
  const duration = test.duration ?? 0;
  return {
    title: test.name,
    fullTitle: title + test.name,
    timedOut: false,
    duration,
    state: getState(test),
    speed: duration > 100 ? 'slow' : 'fast',
    pass: isPassed(test),
    fail: isFailed(test),
    pending: false,
    code: '',
    err: isFailed(test) ? mapError(test.error, errors) : {},
    uuid,
    parentUUID,
    isHook: false,
    skipped: !!isSkipped(test),
  };
};

const pathSelector = /\/test\/.*/;

const mapSuite = (suite, testFile, errors, title = '') => {
  const uuid = crypto.randomUUID();
  const tests = suite.tests.map((test) => mapTest(test, uuid, errors, title + suite.name));
  const suites = suite.suites.map((s) => mapSuite(s, testFile, errors, title + suite.name));

  const mapUUID = (test) => test.uuid;
  return {
    uuid,
    title: suite.name,
    fullFile: testFile,
    file: testFile.match(pathSelector)[0],
    beforeHooks: [],
    afterHooks: [],
    tests,
    suites,
    passes: tests.filter((test) => test.pass).map(mapUUID),
    failures: tests.filter((test) => test.fail).map(mapUUID),
    pending: [],
    skipped: tests.filter((test) => test.skipped).map(mapUUID),
    duration: tests.reduce((prev, curr) => prev + curr.duration, 0),
    root: false,
    rootEmpty: false,
  };
};

const mapTestData = (testData) => {
  const { testResults, testFile, errors } = testData;
  return testResults.suites.map((suite) => mapSuite(suite, testFile, errors));
};

class ConfigMapper {
  constructor(sessions) {
    this.sessions = sessions;
    this.browsers = [];
    this.testData = {};
    this.stats = {};
    this.results = {};
  }

  initBrowsers() {
    this.sessions.forEach((session) => {
      if (!this.browsers.includes(session.browser.name)) {
        this.browsers.push(session.browser.name);
      }
    });
  }

  collectTestData() {
    this.browsers.forEach((browser) => {
      this.testData[browser] = [];
      const testData = this.sessions.filter((session) => session.browser.name === browser);

      testData.forEach((session) =>
        this.testData[browser].push({
          testFile: session.testFile,
          testResults: session.testResults,
          errors: session.errors,
        }),
      );
    });
  }

  generateStats(startTime, endTime) {
    const stats = {
      duration: endTime - startTime,
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
    };

    this.browsers.forEach((browser) => {
      const testData = this.testData[browser];

      const sums = testData.reduce(
        (prev, curr) => {
          const returnObj = {};
          const currSums = getSums(curr.testResults);

          Object.keys(prev).forEach((key) => {
            returnObj[key] = prev[key] + currSums[key];
          });

          return returnObj;
        },
        {
          numberOfSuites: 0,
          numberOfTests: 0,
          numberOfPasses: 0,
          numberOfFailures: 0,
          numberOfSkipped: 0,
        },
      );

      this.stats[browser] = {
        suites: sums.numberOfSuites,
        tests: sums.numberOfTests,
        passes: sums.numberOfPasses,
        pending: 0,
        failures: sums.numberOfFailures,
        testsRegistered: sums.numberOfTests,
        passPercent: ((sums.numberOfTests - sums.numberOfFailures) / sums.numberOfTests) * 100,
        pendingPercent: 0,
        other: 0,
        hasOther: false,
        skipped: sums.numberOfSkipped,
        hasSkipped: sums.numberOfSkipped > 0,
        ...stats,
      };
    });
  }

  mapResults() {
    this.browsers.forEach((browser) => {
      const testData = this.testData[browser];
      const resultContainer = {
        uuid: crypto.randomUUID(),
        title: '',
        fullFile: '',
        file: '',
        beforeHooks: [],
        afterHooks: [],
        tests: [],
        suites: [],
        passes: [],
        failures: [],
        pending: [],
        skipped: [],
        duration: 0,
        root: true,
        rootEmpty: true,
      };

      testData.forEach((td) => {
        const mappedTestData = mapTestData(td);
        resultContainer.suites.push(...mappedTestData);
      });

      this.results[browser] = [resultContainer];
    });
  }

  getMargeInput(browser) {
    return {
      stats: this.stats[browser],
      results: this.results[browser],
    };
  }

  async generateReport() {
    const REPORT_PATH = path.join(__dirname, '../../testReport/');
    if (!fs.existsSync(REPORT_PATH)) {
      fs.mkdirSync(REPORT_PATH);
    }

    return Promise.allSettled(
      this.browsers.map((browser) => {
        const REPORT_FOR_BROWSER = path.join(REPORT_PATH, `./${browser}`);
        if (!fs.existsSync(REPORT_FOR_BROWSER)) {
          fs.mkdirSync(REPORT_FOR_BROWSER);
        }

        return marge.create(this.getMargeInput(browser), {
          inline: 'true',
          reportDir: `testReport/${browser}`,
          reportFilename: 'mochawesome',
          reportTitle: name,
          reportPageTitle: name,
          saveHtml: true,
          saveJson: true,
        });
      }),
    );
  }
}

export default function myReporter() {
  let st;

  return {
    start({ startTime }) {
      st = startTime;
    },

    async stop({ sessions }) {
      const endTime = Date.now();
      const configMapper = new ConfigMapper(sessions);
      configMapper.initBrowsers();
      configMapper.collectTestData();
      configMapper.generateStats(st, endTime);
      configMapper.mapResults();
      const results = await configMapper.generateReport();
      const rejected = results.filter((result) => result.status === 'rejected');
      const fulfilled = results.filter((result) => result.status === 'fulfilled');

      rejected.forEach((reject) => {
        console.error(reject.reason);
      });

      fulfilled.forEach((promise) => {
        const [htmlFile, jsonFile] = promise.value;
        if (!htmlFile && !jsonFile) {
          console.error('No files were generated');
        } else {
          if (jsonFile) {
            console.log(`Report JSON saved to ${jsonFile}`);
          }
          if (htmlFile) {
            console.log(`Report HTML saved to ${htmlFile}`);
          }
        }
      });
    },
  };
}
