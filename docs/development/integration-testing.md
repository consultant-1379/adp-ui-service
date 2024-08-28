# Integration Testing

## About integration testing

The main purpose of integration tests is to ensure component integration. For the backend this
means it functions after it is deployed to a Kubernetes cluster. For the frontend this means
in the Kubernetes cluster it can work together with the backend.

Integration tests are executed during a drop pipeline execution after each commit is merged in.

## Development

Integration tests are located in the root of the git repository in the integration-tests folder.
The tests for the backend and frontend are separated to a /backend and a /ui folder.

To locally develop new test cases start the service with Tilt (execute _tilt up_).

VSCode is set up to Run and Debug tests. After the containers are started by Tilt in the run menu
use the

- "Run current test file in Backend" for backend test debugging
- "WebdriverIO integration" for frontend test debugging.

## Remote debugging

The target of the integration tests are fetched from `KUBERNETES_MASTER_NODE` and `SERVICE_PATH`
environment variables. To run tests on a service in a remote cluster export these variables and
then execute the tests.

`KUBERNETES_MASTER_NODE` is the hostname of the ingress controller. It can determined from the
`httpproxy` resource: `kubectl get httpproxy`

`SERVICE_PATH` must start with a slash (/).

!> In the CI the path is calculated from the name of the namespace by replacing all `-` to `_`.

!> On windows Git Bash shell this causes confusion, and it must be escaped.
eg: `export SERVICE_PATH="\/jenkins-adp-ui-service-drop-427"`

!> Ingress should be configured so that the installed GAS deployment is accessible from your
development environment.

Also set the `NODE_TLS_REJECT_UNAUTHORIZED` to `0` as the ingress is using a self signed certificate.
To make the requests from test work the server certificate validation has to be turned off.

### Selenium

For Selenium tests set the `--network-config-from-env` parameter as well,
to tell the executor to take server parameters from env variables.

```bash
export KUBERNETES_MASTER_NODE=seliics01656e01.seli.gic.ericsson.se
export SERVICE_PATH="\/jenkins-adp-ui-service-drop-427"
npx wdio test/ui/config/wdio.conf.js --network-config-from-env --local
```

```powershell
$Env:KUBERNETES_MASTER_NODE="seliics01656e01.seli.gic.ericsson.se"
$Env:SERVICE_PATH="/jenkins-adp-ui-service-drop-427"
npx wdio test/ui/config/wdio.conf.js --network-config-from-env --local
```

### NodePort

Integration tests can be ran with nodeport, both on Jenkins and locally.
For Jenkins jobs use

```bash
bob -r ci/rulesets/deploy-upgrade-robustness.yaml k8s-test-nodeport
```

For running them locally deploy GAS with tilt in nodeport mode, and run integration tests as usual.
To switch back to default way of running tests, delete `tilt.nodeport.hostname.txt` file.
