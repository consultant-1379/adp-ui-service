/* eslint-disable sonarjs/cognitive-complexity */
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

const {
  GAS_URL,
  MAX_VUS,
  RESPONSE_TIME_THRESHOLD,
  INCLUDE_STATIC_ASSETS,
  FAIL_ON_THRESHOLD,
  SLEEP_UNIT = 2,
} = __ENV;

const MOCK_SERVICE_ROOTS = [
  'demo-ui-service-esmb-1.0.0-0',
  'demo-ui-service-eui1-1.0.0-0',
  'demo-ui-service-eui2-1.0.0-0',
];

console.log(`Running load tests on url: ${GAS_URL}`);
console.log(`Max VUs: ${MAX_VUS}`);

export const options = {
  insecureSkipTLSVerify: true,
  batchPerHost: 6,
  scenarios: {
    contacts: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '60s', target: MAX_VUS },
        { duration: '60s', target: 0 },
      ],
      gracefulRampDown: '0s',
    },
  },
  thresholds: {
    // set abortOnFail to true to see how many VUs caused the threshold breach. Note that the script
    // itself will fail in that case.
    http_req_duration: [
      { threshold: `p(95)<${RESPONSE_TIME_THRESHOLD}`, abortOnFail: FAIL_ON_THRESHOLD !== 'False' },
    ],
  },
};

export const errorRate = new Rate('errors');

export default function () {
  for (let userRequest = 0; userRequest < 10; userRequest += 1) {
    const portalRes = http.get(`${GAS_URL}/ui/#launcher`);

    if (!check(portalRes, { 'status was 200 for UI HTML': (r) => r.status === 200 })) {
      errorRate.add(1);
    }

    const initialFetches = {
      importMap: `${GAS_URL}/ui-serve/v1/import-map`,
      apps: `${GAS_URL}/ui-meta/v1/apps`,
      groups: `${GAS_URL}/ui-meta/v1/groups`,
      components: `${GAS_URL}/ui-meta/v1/components`,
    };

    const initialResponses = http.batch(initialFetches);

    if (
      !check(initialResponses.importMap, {
        'status was 200 for import-map endpoint': (r) => r.status === 200,
      })
    ) {
      errorRate.add(1);
    }

    if (
      !check(initialResponses.apps, { 'status was 200 for apps endpoint': (r) => r.status === 200 })
    ) {
      errorRate.add(1);
    }

    if (
      !check(initialResponses.groups, {
        'status was 200 for groups endpoint': (r) => r.status === 200,
      })
    ) {
      errorRate.add(1);
    }

    if (
      !check(initialResponses.components, {
        'status was 200 for components endpoint': (r) => r.status === 200,
      })
    ) {
      errorRate.add(1);
    }

    sleep(SLEEP_UNIT);

    if (INCLUDE_STATIC_ASSETS !== 'False') {
      const mockService = MOCK_SERVICE_ROOTS[Math.floor(Math.random() * MOCK_SERVICE_ROOTS.length)];
      const batchedRequests = [];
      for (let n = 0; n < 10; n += 1) {
        batchedRequests.push([
          'GET',
          `${GAS_URL}/ui-serve/v1/static/${mockService}/assets/content${n}.txt`,
        ]);
      }
      const responses = http.batch(batchedRequests);

      responses.forEach((response) => {
        if (!check(response, { 'status was 200 for static assets': (r) => r.status === 200 })) {
          errorRate.add(1);
        }
      });
    }
  }

  sleep(SLEEP_UNIT * 2);
}

export function handleSummary(data) {
  return {
    '/report/load-test-report.json': JSON.stringify(data, null, 2),
  };
}
