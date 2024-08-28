# Test Reports for GUI Aggregator Lightweight

## Testing Environment

| Application | Version                  |
| ----------- | ------------------------ |
| Kubernetes  | <%= kubernetesVersion %> |
| Helm        | <%= helmVersion %>       |

## Baseline Description

| Service                              | Version |
| ------------------------------------ | ------- |
| eric-log-transformer                 | ~0.0.0  |
| eric-data-search-engine              | ~0.0.0  |
| eric-data-search-engine-curator      | ~0.0.0  |
| eric-sec-key-management              | ~0.0.0  |
| eric-sec-sip-tls                     | ~0.0.0  |
| eric-data-distributed-coordinator-ed | ~0.0.0  |
| eric-pm-server                       | ~0.0.0  |

## Deployment Metrics

| Deployment Phase | Time (seconds)                              |
| ---------------- | ------------------------------------------- |
| Install          | <%= installFinishTime - installStartTime %> |
| Rollback         | N/A                                         |
| Upgrade          | N/A                                         |

## Docker Image Details

| Docker Image Property | Docker Image Property Value |
| --------------------- | --------------------------- |
| Name                  | <%= dockerImageName %>      |
| Tag                   | <%= dockerImageTag %>       |
| Size                  | <%= dockerImageSize %>      |

## Test Results

| Tests                                                | Report Path               |
| ---------------------------------------------------- | ------------------------- |
| Web Service unit/component test report               | /ws-test-report           |
| Web Service coverage report for unit/component tests | /ws-test-coverage-report  |
| UI unit/component test report                        | /gui-test-report          |
| UI coverage report for unit/component tests          | /gui-test-coverage-report |
| UI selenium test report                              | /gui-selenium-test-report |
| Web Service integration test report                  | /ws-integration-report    |
| UI integration test report                           | /ui-integration-report    |
