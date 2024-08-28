# Performance Reports for GUI Aggregator Lightweight

## Testing Environment

| Application | Version                  |
| ----------- | ------------------------ |
| Kubernetes  | <%= kubernetesVersion %> |
| Helm        | <%= helmVersion %>       |

### K6s Tests

| Response times for endpoints | Time       |
| ---------------------------- | ---------- |
| avg                          | <%= avg %> |

### Lighthouse Report

#### App Page

| KPI         | Score                |
| ----------- | -------------------- |
| speed-index | <%= appSpeedScore %> |

#### Product Page

| KPI         | Score                    |
| ----------- | ------------------------ |
| speed-index | <%= productSpeedScore %> |

## Test Results

| Tests                            | Report Path                |
| -------------------------------- | -------------------------- |
| K6s Summary                      | /k6s-summary               |
| UI performance report (apps)     | /lighthouse-app-report     |
| UI performance report (products) | /lighthouse-product-report |
