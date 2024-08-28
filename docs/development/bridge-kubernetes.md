# Bridge to Kubernetes

## About

Bridge to Kubernetes is a free Visual Studio Code extension which allows you to run and debug code on
your development computer, while still connected to your Kubernetes cluster with the rest of your application.

- [Bridge to Kubernetes in VSCode](https://code.visualstudio.com/docs/containers/bridge-to-kubernetes)
- [More detailed information (VS)](https://docs.microsoft.com/hu-hu/visualstudio/containers/overview-bridge-to-kubernetes?view=vs-2019)
  (**Note:** this document is for VisualStudio at first place, though there are lots of common concepts)

## Concept

This is a development mode for applications to develop code locally, but still access services in
a cluster. At the beggining the service runs in a Kubernetes cluster as part of a larger application.

When the bridge mode is started a proxy service replaces the actual one, which routes all traffic
to the local machine and from locally back to the cluster.

The service process in the meanwhile runs locally without any containerization, so the local
development tools and workflows can be easily used.

## Prerequisites

1. Visual Studio Code installed
2. Install the following extensions

   - [Kubernetes](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools)
   - [Bridge to Kubernetes](https://marketplace.visualstudio.com/items?itemName=mindaro.mindaro)

3. A Kubernetes cluster
4. The application is deployed to the cluster

## Prepare Service

There are requirements to use Bridge mode with a service:

- The container shall run as root (runAsNonRoot shall be set to false).
  **Note:** There is an open issue for this: <https://github.com/microsoft/mindaro/issues/160>.
  When closed, this limitation with the manual steps below can be removed.
- `ReplicaCount` shall be 1

### Deploy GAS

To deploy GAS, which is compatible with the above requirements, install it with helm with
some modifications.

!> Until the root limitation is not solved, the deployment must be changed locally.

Modify the `charts/eric-adp-gui-aggregator-service/templates/deployment.yaml` and comment the
`securityContext.runAsNonRoot` attribute of the `main` container:

```yaml
apiVersion: apps/v1
kind: Deployment
...
spec:
  ...
  template:
    ...
    spec:
      ...
      containers:
      - name: main
        ...
        securityContext:
          allowPrivilegeEscalation: false
          privileged: false
          readOnlyRootFilesystem: false
          #runAsNonRoot: true
      ...
    ...
  ...
...
```

If your namespace is empty, or not initialized, do the docker login and create pull secret for your
namespace. (for more information [check the Kubernetes chapter](kubernetes.md))

If eea-ci helm repository is not yet configured in your environment add the repository (how to add
the repo is described in the [ci version](mock-services.md#ci-version) part of the documentation).

Then install with helm. Usually a drop version is good enough, use the `proj-eea-drop` repository.
For tag use a valid version (eg. `0.6.0-21`).
To get the latest version:

```bash
helm repo update
helm search repo eric-adp-gui-aggregator-service --devel
```

```bash
# set the namespace param to your development namespace
NAMESPACE = "dev-$SIGNUM"
TAG = "$VERSION"

# install GAS from the local helm chart
helm install bridge charts/eric-adp-gui-aggregator-service \
  --namespace $NAMESPACE \
  --set imageCredentials.main.repoPath=proj-eea-drop \
  --set imageCredentials.main.name=eric-adp-gui-aggregator-service \
  --set imageCredentials.main.tag=$TAG \
  --set imageCredentials.pullSecret=arm-pullsecret \
  --set replicaCount=1

# when root limitation is lifted and local chart is not needed,
# it is easier to install from the latest drop version
helm install bridge eea-drop/eric-adp-gui-aggregator-service --namespace $NAMESPACE --set replicaCount=1

# To uninstall, when it is not needed anymore
helm uninstall bridge
```

### Mock

Now install some mock services to have test data for the service.
For more info see [Mock services](mock-services.md#ci-version).

?> Services installed to the same namespace are automatically tunneled by the Bridge mode.

## Bridge mode

For the Bridge mode a launch configuration is needed, which starts the service locally.
Use `Start Server` from the VSCode "Run and Debug" menu.

When the extension configures the connection it creates a preLaunchTask in `tasks.json`,
then makes a copy of the launch config (`Start Server with Kubernetes`) and adds the task to it.

The new launch config can be then used to start the bridge mode,
and when the tunnels are running the local nodejs server is started.

The bridge mode can forward many aspects and services from the Kubernetes cluster.
By default it only forwards the traffic to the selected service, but with extra configuration
volumes, and other services also can be forwarded and copied locally.

### Launch config

Before you start, make sure the Kubernetes VSCode Extension is using the proper cluster and namespace.

In the VS Code Common Palette (Ctrl + Shift + P) type:

> Bridge to Kubernetes: Configure

- First it will list all available `Service` from the current namespace.
  Select `eric-adp-gui-aggregator-service-http`.
- set the port of the service: `3000`
- select a launch configuration: `Start Server`
- set the isolation setting to `no`. (later it will be investigated how to use)

After these steps the new configuration is added to the launch configs: `Start Server with Kubernetes`.

### Usage

Start the debugging with the `Start Server with Kubernetes` launch option.
First it starts the bridge mode by executing the preLaunchTask, which sets up tunnels to other services,
downloads volumes and sets other environment variables according to the configuration.

On the terminal the progress and any potential error can be monitored.
If the setup is successfull, the nodejs service is started with an attached debugger.
There is a progress notification at the bottom-right corner. In case you want to stop the setup,
just click the Cancel button.

During the setup a tool called `EndpointManager` is started, which requires elevated rights.
This service is responsible to update the `hosts` file to make local networking work.
_(If the hosts files cannot be updated, then there is an alternative to use Service Environment variables
instead. [kubernetes-env-vars with VSCode](https://code.visualstudio.com/docs/containers/kubernetes-env-vars#_set-vs-code-to-use-kubernetes-service-environment-variables))_
All service in the same namespace are forwarded, but any other can be configured in a separate file.

After the application is started locally, the normal debug tools can be used,
and the app reaches the other forwarded services and the content of the downloaded volumes.
See [Extra configs](#extra-configs) to configure other volumes and services.

By clicking on the stop icon in the debug bar, the connection is also closed. However this can be
configured in VSCode settings to keep the bridge mode on, even if the debug mode is stopped. In this
case the bridge session has to be manually stopped by clicking on the Kubernetes section at the bottom
bar.

### Extra configs

It is possible to forward other resources from the cluster. [Configure Bridge to Kubernetes](https://docs.microsoft.com/hu-hu/visualstudio/containers/configure-bridge-to-kubernetes?view=vs-2019)

`KubernetesLocalProcessConfig.yaml` contains the extra settings used by Bridge mode. Possible actions:

- Download a volume and set the path to that volume as an environment variable.
- Make a service running on your cluster available to processes running on your development computer.
- Create an environment variable with a constant value.

**VolumeMounts**: the configured volumes are downloaded locally into a temp folder. The path to
the folder is available in the configured env parameter. It is also possible to define exact local
file paths.

**Service**: the configured service will be available locally. Beside getting a local IP address,
the service name is added to the `hosts` file. Also the IP address is added to the specified env parameter.

**Constant Value**: useful to set extra env variables to control how the application shall work
in bridge mode.

In GAS the followings are configured:

- the config-volume containing the configurations from Helm
- the default service account mount to access the Kubernetes API related information.
- the Kubernetes API service: `kubernetes.default`
- `NODE_ENV=bridge` to make conditions for bridge mode

### Frontend

_In contrary to the backend, the compiled frontend code is not available for the backend
to serve it. It could be possible to compile it manually and put to a proper folder, but it
would not be suitable for GUI development flow, since the build time is too long._

The solution is to start the GUI in webpack development mode and the backend should proxy requests
to it.

1. Open a new terminal
2. Start the frontend in dev mode: `npm run start`

The GUI will be available from the <http://localhost:3000/ui/> URL through the backend.
(_Note the trailing slash_)

As port 3000 is available from the remote cluster, the UI in development
can be accessed from the cluster too.

### Changes in backend

To support Bridge mode there were some changes:

- The config mount paths in bridge mode are taken from env variable
- the `@kubernetes/client-node` library is configured alternatively, as the `kc.loadFromDefault()` method
  works differently on the local machine, and the service account information is not at the default
  place. `loadFromDefault()` takes the local kubeconfig files first, and only then starts to look for
  api information from the service account volume mount in the pod.
- proxy requests from `/ui/` to the local webpack dev-server

### Further options

There are aspects which are not yet supported:

- certificate mounts are not copied locally
- the `loadFromDefault()` shall be replaced with generic `inCluster` configuration mode which works
  for the production and bridge mode as well
- isolation mode
