<!-- markdownlint-disable MD025 -->

| Metrics Name | Description | Type | Status | Category | Labels |
|:-------------|:------------|:-----|:-------|:---------|:-------|
| eric_adp_gas_light_process_cpu_user_seconds_total | Total user CPU time spent in seconds. | counter | stable | Use | *app*: - |
| eric_adp_gas_light_process_cpu_system_seconds_total | Total system CPU time spent in seconds. | counter | stable | Use | *app*: - |
| eric_adp_gas_light_process_cpu_seconds_total | Total user and system CPU time spent in seconds. | counter | stable | Use | *app*: - |
| eric_adp_gas_light_process_start_time_seconds | Start time of the process since unix epoch in seconds. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_process_resident_memory_bytes | Resident memory size in bytes. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_process_virtual_memory_bytes | Virtual memory size in bytes. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_process_heap_bytes | Process heap size in bytes. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_process_open_fds | Number of open file descriptors. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_process_max_fds | Maximum number of open file descriptors. | gauge | stable | USe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_seconds | Lag of event loop in seconds. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_min_seconds | The minimum recorded event loop delay. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_max_seconds | The maximum recorded event loop delay. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_mean_seconds | The mean of the recorded event loop delays. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_stddev_seconds | The standard deviation of the recorded event loop delays. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_p50_seconds | The 50th percentile of the recorded event loop delays. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_p90_seconds | The 90th percentile of the recorded event loop delays. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_eventloop_lag_p99_seconds | The 99th percentile of the recorded event loop delays. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_active_handles | Number of active libuv handles grouped by handle type. Every handle type is C++ class name. | gauge | stable | Use | *type*: -;<br/>*app*: - |
| eric_adp_gas_light_nodejs_active_handles_total | Total number of active handles. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_nodejs_active_requests | Number of active libuv requests grouped by request type. Every request type is C++ class name. | gauge | stable | Red |  |
| eric_adp_gas_light_nodejs_active_requests_total | Total number of active requests. | gauge | stable | Red | *app*: - |
| eric_adp_gas_light_nodejs_heap_size_total_bytes | Process heap size from Node.js in bytes. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_nodejs_heap_size_used_bytes | Process heap size used from Node.js in bytes. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_nodejs_external_memory_bytes | Node.js external memory size in bytes. | gauge | stable | uSe | *app*: - |
| eric_adp_gas_light_nodejs_heap_space_size_total_bytes | Process heap space size total from Node.js in bytes. | gauge | stable | Use | *space*: -;<br/>*app*: - |
| eric_adp_gas_light_nodejs_heap_space_size_used_bytes | Process heap space size used from Node.js in bytes. | gauge | stable | Use | *space*: -;<br/>*app*: - |
| eric_adp_gas_light_nodejs_heap_space_size_available_bytes | Process heap space size available from Node.js in bytes. | gauge | stable | Use | *space*: -;<br/>*app*: - |
| eric_adp_gas_light_nodejs_version_info | Node.js version info. | gauge | stable |  | *version*: -;<br/>*major*: -;<br/>*minor*: -;<br/>*patch*: -;<br/>*app*: - |
| eric_adp_gas_light_nodejs_gc_duration_seconds | Garbage collection duration by kind, one of major, minor, incremental or weak callback. | histogram | stable | USE | *le*: -;<br/>*kind*: -;<br/>*app*: - |
| eric_adp_gas_light_http_request_duration_seconds | Duration histogram of http responses labeled with: status_code. | histogram | stable | reD | *le*: -;<br/>*status_code*: -;<br/>*app*: - |
| eric_adp_gas_light_service_num | Total number of Service K8s discovered resources. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_pod_num | Total number of Pod K8s discovered resources. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_endpoint_num | Total number of Endpoint K8s discovered resources. | gauge | stable | Use | *app*: - |
| eric_adp_gas_light_ui_meta_v1_apps_http_requests_total | Total number of requests to the "/ui-meta/v1/apps" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_meta_v1_groups_http_requests_total | Total number of requests to the "/ui-meta/v1/groups" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_meta_v1_components_http_requests_total | Total number of requests to the "/ui-meta/v1/components" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_http_requests_total | Total number of requests to the "/ui" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_logging_v1_logs_http_requests_total | Total number of requests to the "/ui-logging/v1/logs" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_gas_internal_http_requests_total | Total number of requests to the "/gas-internal" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_serve_v1_import_map_http_requests_total | Total number of requests to the "/ui-serve/v1/import-map" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_serve_v1_list_packages_http_requests_total | Total number of requests to the "/ui-serve/v1/list-packages" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_serve_v1_static_http_requests_total | Total number of requests to the "/ui-serve/v1/static" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_meta_v1_apps_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-meta/v1/apps" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_meta_v1_groups_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-meta/v1/groups" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_meta_v1_components_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-meta/v1/components" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_logging_v1_logs_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-logging/v1/logs" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_gas_internal_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/gas-internal" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_serve_v1_import_map_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-serve/v1/import-map" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_serve_v1_list_packages_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-serve/v1/list-packages" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_ui_serve_v1_static_http_response_times_total | Total time (in ms) spent in backend with processing requests to the "/ui-serve/v1/static" API. | counter | stable | Red | *protocol*: -;<br/>*endpoint*: -;<br/>*method*: -;<br/>*code*: -;<br/>*app*: - |
| eric_adp_gas_light_sum_of_retry_counters_of_in_progress_fetch_loops | The sum of retry counters of in-progress fetch loops. | Gauge | stable | Red | *app*: - |