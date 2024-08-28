# Tilt

Tilt is a development tool for Kubernetes based development.
It speeds up the local deployment of an application during code change.

## Install

```bash
 curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
```

After installation verify Tilt with

```bash
tilt version
```

## Local execution

The default mode is `local`. In local mode the used namespace is `default`
if `exactnamespace` option is not set.
This mode is preferred when using a local kubernetes cluster.
To start using locally just jump to [Usage](#usage).
For other options check the [Configuration](#configuration) chapter.

## Prerequirements

- If you would like to test the integration with other services, then
  you have to refresh the helm dependencies under the `charts/ci` folder.

```bash
cd charts/ci
rm -rf charts/*
helm repo add proj-adp-gs-all-helm \
https://arm.sero.gic.ericsson.se/artifactory/proj-adp-gs-all-helm

helm dep update
```

- If you have to install an ingress controller in case of a local kubernetes environment,
  because ingress resources are used during the tilt deployment.

With minikube use:

```bash
minikube addons enable ingress
```

## Quick start

These are the quick steps to start working with a remote cluster.
For detailed explanations or troubleshooting check the [Remote execution](#remote-execution) chapter.

1. configure kubectl context to use the dev cluster

   ```bash
   export KUBECONFIG=$HOME/.kube/config:$(pwd)/mock/cluster-config/kube-config.yaml
   kubectl config use-context kubernetes-admin@dev-presentation
   ```

2. save `tilt.option.user.template.json` as `tilt.option.user.json`
3. set `mode` to `remote` in `tilt.option.user.json`
4. start tilt: `tilt up`. See [Usage](#usage)

In the remote development a unique namespace is created for your deployments.
To interact with them add the namespace to your context or append the namespace flag to all kubectl command.

## Configuration

The main Tiltfile is in the root: `Tiltfile`
It uses some configuration files to define where to connect and how to create the resources.
`tilt.option.json` is the default configuration which is merged into the repo.
It can be overwritten with `tilt.option.user.json` which is gitignored to avoid unnecessary changes.
Mostly the execution mode (local / remote) and the required services can be selected, but any
option can be overridden if needed.

### Ingress

Note that Nginx is deprecated but supported without verifyClientCertificate.

For mTLS use own ICCR from CI chart. The IP address and the URL of the deployed
services will be logged on the Tilt ui.

Then on top of your other settings, apply these in tilt.option.json and deploy GUI Aggregator:

```json
{
  "ingressEnabled": true,
  "ingressUseContour": true,
  "mTLS": true,
  "verifyClientCertificate": "required"
}
```

### Authentication

Note that this does not work with Nginx. Assuming that ICCR is configured in Tilt,
set these additional options for authentication:

```json
{
  "enableAuthentication": true,
  "mTLS": true
}
```

Note that startup of IAM pods can take up to 10 minutes.

### Configuration files

`tilt.option.json` - this is a generic options file which is used as default config

```json
{
  "mode": "local", // can be local or remote
  "exactnamespace": "", // The exact namespace to be used. It is used in local mode too if given
  // the next attributes are used only in remote mode
  "customIdentifier": "", // Used in ingress URL and mock uid. The default is the user ID.
  // Docker registries that are logged in and pull secrets are created for
  "dockerRegistries": {
    "armdocker": {
      "url": "armdocker.rnd.ericsson.se", // url of the docker registry
      "secretName": "arm-pullsecret", // this one common file-based secret is used for every repo
      "username": "ARM_USER_SELI", // must match with token in arm_docker_pull_secret_template.json
      "password": "ARM_TOKEN_SELI" // must match with token in arm_docker_pull_secret_template.json
    },
    "serodocker": {
      "url": "serodocker.sero.gic.ericsson.se", // url of the docker registry
      "username": "ARM_USER_SERO", // must match with token in arm_docker_pull_secret_template.json
      "password": "ARM_TOKEN_SERO" // must match with token in arm_docker_pull_secret_template.json
    }
  },
  "dockerSecretName": "arm-pullsecret", // this one common file-based secret is used for every repo
  "repoPath": "proj-eea-dev", // repo of mock and tilt-based main service images in SELI ARM
  "namespace_prefix": "dev", // to generate unique name (used if 'exactnamespace' is not set)
  "kubecontext": "kubernetes-admin@dev-presentation", // The kubecontext used for remote connection,
  "isCiChartDeployed": false, // True if CI chart is deployed with helm
  "deployMockServices": true, // Deploy dummy services to test the discovery functionality
  "deployEsmServices": true,
  "deployDevPortalMock": false, // Deploy the Dev portal mock created for the dev portal video
  // (disables other mock services). Enable ingress to access from GAS.
  "deployMainService": true, // Build and deploy the GUI Aggregator Service
  "deployCNOM": false,
  "deployDSTServices": false, // Deploys DST services and Search Engine.
  // Edit rate in eric-dst-collector-remote-sampling configmap.
  "metricsEnabled": false, // Whether to view metrics or deploy PM
  "ingressEnabled": true, // Ingress (by default Contour) will be deployed in CI chart
  "ingressHost": "localhost", // Ingress hostname, override if own ICCR and nip.io DNS is used
  "ingressIP": "", // Ingress IP Address, used if the ICCR is separately installed.
  "ingressPath": "/",
  "ingressEnableTLS": false,
  "ingressUseContour": true, // false = Nginx, true = ICCR
  "ingressClass": "EEA-Applications", // Only needed if own ICCR is configured
  "adpIccrServiceName": "eric-eea-ingress-ctrl-common", // Revert to common if needed: eric-tm-ingress-controller-cr
  "mTLS": true, // If globally TLS is on or off
  "verifyClientCertificate": "optional", // Set to "required" for mTLS
  //Set to "direct" or "dual" to turn on direct log streaming and deploy Log Transformer
  "logStreamingMethod": "console",
  "stdoutLogFormat": "text", // Determines the console log format. Can be "text" or "json"
  "faultIndicationsEnabled": false, // If true, FM is deployed in CI chart and GAS can send fault indications
  "replicaCount": 1, // Number of GAS POD's
  "logLevel": "info",
  "serviceMeshEnabled": "false", // Whether to turn on Service Mesh in GAS and to deploy in CI chart
  "servicePort": 3000, // GAS port
  "forwardingPort": 3001, // Port from which requests to GAS will be forwarded
  "metricsPort": 3888, // GAS metrics port, should be different from default metrics port of APO (8888)
  "metricsForwardingPort": 3889, // Port from which requests to GAS metrics will be forwarded
  "debugPort": 9230, // Port for debugger attachment
  "helpAggregatorEnabled": true, // Set to false if GAS is not intended to be used with HA
  "devMode": true, // Whether to run GAS in devMode
  "nodePort": false,
  // Whether to expose GAS using nodePort service, http only and incompatible with networkpolicies
  "nodePortServiceName": "eric-adp-gui-aggregator-service-http",
  // Extend below array in case of K8s server version incompatibility with Capabilities
  "customK8sApiVersions": ["policy/v1/PodDisruptionBudget", "policy/v1", "batch/v1/CronJob"],
  "iamUserName": "gas-user", // Login of the user that will be created automatically in IAM
  "iamUserPassword": "Ericsson123!", // Password of the user that will be created automatically in IAM
  "enableAuthentication": false, // Deploy IAM and AuthZProxy then enable authentication
  "guiContext": "/ui", // The context of the main UI page, relative to the service root url
  "uiConfigPath": "/" // UI config path relative to the host
}
```

`tilt.option.user.json` - this is a gitignored file to store user specific configs
Create this file and add the desired json structure.
Any other attribute from the `tilt.option.json` can be added to define custom value for it.
Check the `tilt.option.user.template.json` for an empty example.

For information on environment variables e.g. for credentials to docker registries and repositories
check the [Dev env documentation.](dev-env.md#environment-variables)

## Remote execution

In remote mode the Tiltfile does some extra initialization steps based on `tilt.option.json`:

- generate unique namespace
- create the namespace
- create pullsecrets in the namespace
- login to docker repositories
- and allow the kubectl context defined in the configuration

To use a remote cluster the kubectl context has to be changed to connect to a remote cluster.
For cluster info check [this wiki](https://eteamspace.internal.ericsson.com/display/EIT/Clusters).
See the K8s.io docs: [Configure Access to Multiple Clusters](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)
To speed up configuration a remote cluster config is in the repository: mock/cluster-config/kube-config.yaml.

### Kubectl context

Change kubectl context to point to the remote cluster.

```bash
# If KUBECONFIG is empty add the default config from HOME first
export KUBECONFIG=$HOME/.kube/config
# Add dev cluster config to KUBECONFIG
export KUBECONFIG=$KUBECONFIG:$(pwd)/mock/cluster-config/kube-config.yaml
# Check the result. Both seliics01760e01 and minikube shall be present
kubectl config view
# To switch to remote cluster
kubectl config use-context kubernetes-admin@dev-presentation
# To switch back to local cluster
kubectl config use-context minikube
```

### Configure Tilt

For more info about the configuration see: [Configuration](#configuration)

Change the `tilt.option.json` file.

- set mode to `remote`
  - by default no other config change is necessary
  - and also the namespace is: \<namespace_prefix\>-\<username\>
  - but if the `exactnamespace` is set in the config then that is used as the namespace
- then set your context to that namespace:
  `kubectl config set-context --current --namespace=<NAMESPACE NAME>`

## Usage

To start tilt: `tilt up`

Then press space to open Tilt console in a browser. It will show the process of the build and
the status of the services. At first time it builds the docker images which may take time.
When finished the logs of the processes can be seen on the UI.
Note: it can take up to 20-30 minutes to start everything, if all dependencies are enabled.

To stop: Ctrl+C then `tilt down` to remove services from kubernetes.
_Note: by default the namespaces created by Tilt are not deleted._
To do use the --delete-namespaces flag: `tilt down --delete-namespaces`
Especially when CI pods are not starting e.g. due to secret issues, delete the namespace.

If anything is changed (eg. Docker file, source code, Tiltfile),
then the build process is automatically restarted and the changed services are replaced
with the new version. The config is optimized for fast update, but the overall time depends
which part of the code is changed.

### Help aggregator integration

To generate the necessary ZIP files with the packaged help content, run the following bob rule manually:

`bob generate-and-copy-help-content`

## Remote debugging

The debugger port is opened for the GUI Aggregator Service and the mock services so it is possible
to remote connect with the `Attach to GAS in K8S` launch option.
Just select the project to debug (mock or backend), the port (eg. 9230) and attach to the process.
After a short time the debugger is attached and nodejs will stop at breakpoints.

?> When the process is paused it cannot serve incoming requests including the K8s Liveness Endpoint.
If the pause takes longer time than the Liveness wait timeout Kubernetes will restart the Pod,
so for debugging it is advised to increase the `periodSeconds` at the `livenessProbe` in the `deployment.yaml`.

?> If the code to be debugged is at the startup phase then change the `--inspect` to `--inspect-brk`
in the `docker/entrypoint.sh` file. At startup the node process will wait for a debugger to attach
before starting the server.

## Implementation

The tilt config is based on the official [NodeJS tutorial](https://docs.tilt.dev/example_nodejs.html).
This focuses on short reload cycles, and it is achieved by multiple optimizations:

**Helm template plugin**: this tilt plugin allows transforming helm templates to kubernetes resource
descriptors. To make this work the name of the deployed images shall be configurable from helm cli
parameters. The _tag name_ is automatically generated and overridden by Tilt, but other part of the
image name must be the same as used in `docker_build` methods.
In the context of ADP these are:

- registry URL
- repoPath
- image name

**Optimized Dockerfile**, where `npm install` is executed first and the source files are copied second.
With this, the result of npm install can be cached by the docker registry which can speed up a
docker build.

**Live update**: tilt provides a live update mechanism where file changes can be copied into a running
pod. The service watches file changes and restarts when detects new files.
For live update there are some requirements:

- use `nodemon` to start the server. Nodemon watches files in a directory and restarts the service
  if it detects changes. `--ext js` is set to nodemon to avoid restarts when config files (json files,
  certificates etc.) are changed at runtime. These changes shall be handled by the service
  without restarts.
- set `replicaCount` to 1: live update works only with single pod deployment
- set write permission to the default user in the docker image for the service files.

If live update is not working, tilt logs out the reason.
