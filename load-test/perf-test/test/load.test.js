import playwright from 'playwright';
import lighthouse from 'lighthouse';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

const CHROME_PORT = 9222;
const { GAS_URL } = process.env;
const REPORT_DIR = 'perf-test/lighthouse-report';
const TIME_NAME = 'lh:runner:gather';
const PERF_REPORT_KPIS = [
  'speed-index',
  'first-contentful-paint',
  'largest-contentful-paint',
  'first-meaningful-paint',
];

describe('Performance test for the Ericsson Portal', () => {
  let browser;
  before(async () => {
    browser = await playwright.chromium.launch({
      args: [`--remote-debugging-port=${CHROME_PORT}`, '--ignore-certificate-errors'],
    });
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR);
    }
  });

  after(async () => {
    await browser.close();
  });

  [
    {
      path: '/ui/#launcher',
      reportFile: 'product-page.html',
      title: 'Product Page',
      performanceData: 'product-page.json',
    },
    {
      path: '/ui/#launcher?productName=eea:eea',
      reportFile: 'app-page.html',
      title: 'App Page',
      performanceData: 'app-page.json',
    },
  ].forEach((testCase) =>
    it(`can generate the ${testCase.title} Lighthouse report`, async () => {
      const options = {
        logLevel: 'info',
        output: 'html',
        onlyCategories: ['performance'],
        port: CHROME_PORT,
        screenEmulation: {
          width: 1920,
          height: 1080,
        },
        extraHeaders: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
      };
      const runnerResult = await lighthouse(`${GAS_URL}${testCase.path}`, options);

      const { report } = runnerResult;

      fs.writeFileSync(path.join(REPORT_DIR, testCase.reportFile), report);

      const { lhr } = runnerResult;
      // `.lhr` is the Lighthouse Result as a JS object

      const lighthouseObject = {};

      Object.keys(lhr.audits).forEach((kpi) => {
        if (PERF_REPORT_KPIS.includes(kpi)) {
          lighthouseObject[kpi] = lhr.audits[kpi];
        }
      });

      fs.writeFileSync(
        path.join(REPORT_DIR, testCase.performanceData),
        JSON.stringify(lighthouseObject),
      );

      console.log('Report is done for', lhr.finalUrl);
      console.log('Performance score was', lhr.categories.performance.score * 100);
      const { duration } = lhr.timing.entries.find((t) => t.name === TIME_NAME);
      expect(lhr.runtimeError).to.be.undefined;
      expect(lhr.runWarnings).to.have.lengthOf(0);
      expect(duration).to.be.lessThan(15000);
    }),
  );
});
