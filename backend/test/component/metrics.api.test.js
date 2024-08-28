import os from 'os';
import { expect } from 'chai';
import k8sClientMock from '../mocks/modules/k8s.client.mock.js';
import nodeFetchMock, { HeadersMock, RequestMock } from '../mocks/modules/nodeFetch.mock.js';
import chokidarMock from '../mocks/modules/chokidarMock.js';
import fsMock from '../mocks/modules/fsMock.js';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import factory from './factory.js';

// the first test case's before hook will load app.js and its dependencies
// not all dependencies are mocked, as metrics.api.test is also kind of integration test
// the first import of some non-mocked 3pp libs can take up to 5 seconds
// see ADPRS-415 for more details
const INITAL_LOAD_TIMEOUT = 120_000;

const DEFAULT_METRICS = [
  'process_cpu_user_seconds_total',
  'process_cpu_system_seconds_total',
  'process_cpu_seconds_total',
  'process_start_time_seconds',
  'process_resident_memory_bytes',
  'nodejs_eventloop_lag_seconds',
  'nodejs_eventloop_lag_min_seconds',
  'nodejs_eventloop_lag_max_seconds',
  'nodejs_eventloop_lag_mean_seconds',
  'nodejs_eventloop_lag_stddev_seconds',
  'nodejs_eventloop_lag_p50_seconds',
  'nodejs_eventloop_lag_p90_seconds',
  'nodejs_eventloop_lag_p99_seconds',
  'nodejs_active_handles',
  'nodejs_active_handles_total',
  'nodejs_active_requests',
  'nodejs_active_requests_total',
  'nodejs_heap_size_total_bytes',
  'nodejs_heap_size_used_bytes',
  'nodejs_external_memory_bytes',
  'nodejs_heap_space_size_total_bytes',
  'nodejs_heap_space_size_used_bytes',
  'nodejs_heap_space_size_available_bytes',
  'nodejs_version_info',
  'nodejs_gc_duration_seconds',
  'http_request_duration_seconds',
];

if (os.type() !== 'Windows_NT') {
  DEFAULT_METRICS.push('process_virtual_memory_bytes', 'process_heap_bytes', 'process_open_fds');
}

const CUSTOM_COUNTERS = [
  'ui_meta_v1_apps_http_requests_total',
  'ui_meta_v1_groups_http_requests_total',
  'ui_meta_v1_apps_http_requests_total',
  'ui_meta_v1_components_http_requests_total',
  'ui_meta_v1_components_http_requests_total',
  'ui_http_requests_total',
  'ui_serve_v1_static_http_requests_total',
  'ui_meta_v1_apps_http_response_times_total',
  'ui_meta_v1_groups_http_response_times_total',
  'ui_meta_v1_components_http_response_times_total',
  'ui_http_response_times_total',
  'ui_logging_v1_logs_http_response_times_total',
  'gas_internal_http_response_times_total',
  'ui_serve_v1_import_map_http_response_times_total',
  'ui_serve_v1_list_packages_http_response_times_total',
  'ui_serve_v1_static_http_response_times_total',
];

const K8_METRICS = ['pod_num', 'service_num', 'endpoint_num'];

const responseCheck = (response) => {
  const { text } = response;
  [...DEFAULT_METRICS, ...CUSTOM_COUNTERS, ...K8_METRICS].forEach((metric) => {
    expect(text).to.have.string(metric);
  });
};

const checkEndpoint = async (request, endpoint, httpCode) =>
  request
    .get(`${endpoint}`)
    .set('Accept', 'application/json')
    .expect(httpCode)
    .expect(responseCheck);

describe('Component tests for metrics API', () => {
  const { loadServerWithMetrics, closeServerWithMetrics } = factory();

  let request;

  // eslint-disable-next-line func-names
  beforeEach(async function () {
    this.timeout(INITAL_LOAD_TIMEOUT);
    const localConfigMock = {
      libName: 'fs',
      namedExports: fsMock({ uiServiceConfig: { k8sLabelValue: 'workspace-gui' } }),
    };

    request = await loadServerWithMetrics(
      { libName: '@kubernetes/client-node', defaultExport: k8sClientMock },
      {
        libName: 'node-fetch',
        namedExports: { Headers: HeadersMock, Request: RequestMock },
        defaultExport: nodeFetchMock,
      },
      { libName: 'chokidar', defaultExport: chokidarMock },
      { libName: '../../services/logging.js', namedExports: loggingMock },
      localConfigMock,
    );
  });

  afterEach(async () => {
    await closeServerWithMetrics();
  });

  it('Successfully returns all required metrics', async () => {
    await checkEndpoint(request, '/metrics', 200);
  });
});
