/* eslint-disable sonarjs/cognitive-complexity */
import http from 'k6/http';
import { sleep, check } from 'k6';

const { GAS_URL } = __ENV;

console.log(`Running get api test on url: ${GAS_URL}`);

export const options = {
  insecureSkipTLSVerify: true,
  iterations: 130,
};

export default function () {
  const res = http.get(`${GAS_URL}/ui-meta/v1/apps`);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    '/report/k6-get-api-test-report.json': JSON.stringify(data, null, 2),
  };
}
