# Kubernetes

The service can be tested in a Kubernetes cluster. The cluster can be a local or a remote cluster
as well.

## Kubectl

Kubectl is the tool used to manage kubernetes resources. This tool is used internally by other
tools (eg. Helm).

- [Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Command reference](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)

### Configuration

Before using kubectl or other tools building on it, it shall be configured to access
kubernetes clusters. By default minikube adds its configuration,
but it is only useful for simple developments.

To configure a remote cluster check the [relevant chapter](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)
in the kubernetes documentation.

There is a user specific global config in the user director: `~/.kube/config`.
This contains the available `clusters` and the required `user` credentials.
The combination of a `cluster`, a `user` and a default `namespace` is called `context`.
The configuration file can contain multiple contexts, and from the cli with kubectl commands
the current context can be simply changed.

The config to access the development cluster used in EEA is committed to this repo:
`mock/cluster-config/kube-config.yaml`.
To use it, merge its content into the user kubeconfig file.
It can be edited by a text editor, or by the `kubectl config` command.

After adding the new context to the config:

```bash
# To switch to remote cluster
kubectl config use-context kubernetes-admin@dev-presentation
# To switch back to local cluster
kubectl config use-context minikube

# Change default namespace in current context:
kubectl config set-context --current --namespace=<NAMESPACE NAME>
```

### CLI

When the kubectl is configured the cli can be used to search, edit, deploy, delete kubernetes
resources.

?> If the `-n` (namespace) parameter is not set then any command is executed on
the default namespace of the current context. To avoid adding namespace parameter to every command,
change the namespace for the current context.

### Tools

There are a number of tools to make it easier to handle a kubernetes cluster:

- [k9s](https://k9scli.io/) is a terminal based UI to interact with your Kubernetes clusters
  - `choco install k9s`
- [Kubernetes VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools)
  is adding support for kubernetes into VSCode IDE

## Helm

Helm is used to manage the application in Kubernetes. This is a package manager which can handle
the kubernetes resources needed by an application.

In ADP the Helm v3 is used: [Helm](https://helm.sh/).
For some basic term check the [glossary](https://helm.sh/docs/glossary/).

### Repositories

Charts can be uploaded to Helm repositories. To use such repository first
add them to the local config.
Multiple repositories can be added by their URL. The name parameter can be used to
reference a repository in local commands.

?> For environment variables check [Dev env documentation](dev-env.md#environment-variables)

Manage repositories:

```bash
# Add GAS drop repository
helm repo add eea-drop https://arm.seli.gic.ericsson.se/artifactory/proj-eea-drop-helm \
    --username $ARM_USER_SELI --password $ARM_TOKEN_SELI

# Time to time refresh the local cache
helm repo update
```

Search for charts of a service version.

```bash
# Search for available charts in the repo
helm search repo <chart name>

# by default only released version is shown. Add --devel to show development version
helm search repo <chart name> --devel

# Add -l to show all versions,
# or add --version to search for a given version by regex or exact match
```

### Releases

If a chart is available in a remote repository or locally it can be installed to any cluster.

When the chart references images from remote docker repositories the relevant credentials must
be deployed to the kubernetes cluster. It is done by creating a `secret` containing the
username and the api token for the docker login. Then set the `imageCredentials.pullSecret` parameter
at helm install. For more info see [Remote Cluster chapter](#remote-cluster)

Installing a local chart usually requires a set of different values as the repository url,
image name and version are parameters for the chart. Remote charts (uploaded to repositores)
usually contains proper values for them.

```bash
# Generic install
helm install <releasename> <path-to-chart> \
  --namespace <namespace-name> \
  --set imageCredentials.pullSecret=<pull-secret-name> \
  ...<extra-deployment-values>

# Install GAS from a drop repo
# If version is not provided the latest released one is installed.
# To install development version use --devel
helm install gas eea-drop/eric-adp-gui-aggregator-service --devel --namespace dev \
  --set imageCredentials.pullSecret=arm-pullsecret

# Install GAS from a local chart with remote docker images
helm install gas charts/eric-adp-gui-aggregator-service --namespace dev \
  --set imageCredentials.main.repoPath=proj-eea-drop \
  --set imageCredentials.main.name=eric-adp-gui-aggregator-service \
  --set imageCredentials.main.tag=0.6.0-21 \
  --set imageCredentials.pullSecret=arm-pullsecret
```

After a release is installed it can be managed by helm

```bash
# uninstall
helm uninstall gas

# list releases
helm ls

# upgrade release. Use it if the deployment parameters of the release should be changed
helm upgrade gas <path-to-chart> <new-deplyoment-values>
```

### Values validation

As part of [DR-D1121-210](https://eteamspace.internal.ericsson.com/display/AA/General%20Helm%20Chart%20Structure#GeneralHelmChartStructure-DR-D1121-210),
`values.yaml` of the service chart must be compliant with the Helm
[JSON validation schema](https://json-schema.org/), which is `values.schema.json` file placed
in the root of the chart.
More details on Helm validation see in this [article](https://eteamspace.internal.ericsson.com/display/AA/ADP+Helm+Chart+validation+with+JSON+Schema).

> **IMPORTANT:**
> The schema should be updated, whenever `values.yaml` is updated with new properties.

Currently two versions of schema are generated:

- For validation steps. It's more strict and restricts additional undescribed fields.
- For publishing with the main chart to the ARM repositories. This one doesn't restricts additional
  fields. It's purpose to prevent breaking existing builds on other projects, that have
  GUI Aggregator in their dependencies and complementing GAS values with any obsolete properties.

#### Generate values schema

The `values.schema.json` file is generated using these bob tasks:

```bash
# For validation
bob generate-ci-values-schema

# For publishing
bob generate-package-values-schema
```

They run [schema-bundler](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-cicd/bob-adp-release-auto/+/refs/heads/master/helm_schema/#Schema-Bundler)
script, which receives a primary schema `charts/eric-adp-gui-aggregator-service/service.schema.json`
and paths to included schemas as input. Currently these folders of included schemas are used:

1. `tools/helm-extensions/schemas/common/*` directory is part of `helm-extensions` submodule. This
   submodule was designed to contain common schema fragments that cover Design Rules related to
   changes in the `values.yaml`.
   To use these fragments locally run `git submodule update --init` command, it will download all
   the necessary files. Also, this command should be run when the newest version of the module is
   needed (for example, if the submodule has a newer version that contains more fragments).
   This submodule is used only for reading.
   More info about Helm Extensions schemas in the [Common Schemas User Guide](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-common-src/helm-extensions/+/HEAD/schemas/COMMON_SCHEMAS_USER_GUIDE.md)
2. `charts/eric-adp-gui-aggregator-service/schemas/general` directory contains service-specific
   schemas. These files are the result of splitting the primary schema into separate logical parts
   (instead of having one massive schema). The following parts of multi-level properties have been
   separated:

   - `authorizationProxy.schema.json`
   - `configuration.schema.json`
   - `dst.schema.json`
   - `global.schema.json`
   - `ingress.schema.json`
   - `manualconfig.schema.json`
   - `serviceConfig.schema.json`
   - `uiconfig.schema.json`
   - `general.schema.json` (contains JSON Schema rules for the rest of the values)

   And there is also `propertyPatterns.schema.json` for common property patterns.

   > **IMPORTANT:**
   > In `values.yaml` there is a property _manualconfig_ that describes specific GAS entities that
   > are further used in `charts/eric-oss-help-aggregator/templates/configmap.yaml`. It's important
   > to maintain schema for these values when they change, regardless they are not described
   > specifically in `values.yaml`.

3. `charts/eric-adp-gui-aggregator-service/schemas/ci` and
   `charts/eric-adp-gui-aggregator-service/schemas/package` which are used depending on whether the schema
   is being built for validation or publishing.

   - `.../ci` folder contains all the definitions that restrict additional properties and are divided
     into files in the same way as in the `.../general` folder.
     To use `"additionalProperties": false` as a separate definition, all allowed properties must
     be listed with it. For example for separate schema like

     ```json
     // part of definition from .../general folder
     {
       "$id": "urn:adp:helm:schemas:v1:gas-simple-schema:v1",
       "type": "object",
       "properties": {
         "documents": {
           "type": ["null", "array"]
         },
         "groups": {
           "type": ["null", "array"]
         }
       }
     }
     ```

     the definition with sub-schema that includes `additionalProperties` restriction must look like this

     ```json
     // definition from .../ci folder
     {
       "$id": "urn:adp:helm:schemas:v1:gas-simple-schema-conditional:v1",
       "properties": {
         "documents": true,
         "groups": true
       },
       "additionalProperties": false
     }
     ```

     so the united schema will be look like this

     ```json
     {
       "allOf": [
         { "$ref": "urn:adp:helm:schemas:v1:gas-simple-schema:v1" },
         { "$ref": "urn:adp:helm:schemas:v1:gas-simple-schema-conditional:v1" }
       ]
     }
     ```

   - `.../package` contains definitions structured in the same way as `.../ci`, but all definitions
     have "empty" schema in order not to add any restrictions and simply use the definitions from
     the `.../general` folder.

   > **IMPORTANT**
   > In `.../package` and `.../ci` folders, definitions describing the same values should have
   > identical _$id_ properties, because they have a single reference (`$ref` property) in
   > `.../general`. But again, the first ones will be used at the publish step, and the second ones
   > during validation.

As result, in order to make changes to the `values.schema.json`, files from
`charts/eric-adp-gui-aggregator-service/schemas/` directory or/and
`charts/eric-adp-gui-aggregator-service/service.schema.json` must be updated.

> **Note:**
> The resulted `values.schema.json` file shouldn't be included in git repository. It is generated
> before lint and publish stages during CI.

#### Validation steps

To validate `values.yaml` with new properties locally follow these steps:

1. Download/update `helm-extensions` submodule to get all the common schemas. About this read in
   [Submodules chapter](./dev-env.md#submodules).

2. Update service-specific schemas with the new validation rule. And here are some tips on how to
   make the changes:

   - Check if this rule already exist in common schemas on
     [this page](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-common-src/helm-extensions/+/HEAD/schemas/COMMON_SCHEMAS_USER_GUIDE.md).
     If it there - use it as a reference.
   - It's better not to add property validation rule directly to the `service.schema.json`. Try to
     keep this file modular and as clean as possible.
   - Check if any of `charts/eric-adp-gui-aggregator-service/schemas/*` files might be suitable for
     the new change. If not, put it in the `general.schema.json`
   - If the change to the values file involves adding a massive multi-level property, move it to
     a separate schema.
     > **Note**
     > For a new schema, set $id property as `urn:adp:helm:schemas:v1:gas-<property name>:v1`. This
     > template is described in [Common Schemas chapter](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-common-src/helm-extensions/+/HEAD/schemas/COMMON_SCHEMAS_USER_GUIDE.md#Common-Schemas).

3. Generate schema with the bob task

   ```bash
   bob generate-ci-values-schema
   ```

4. Run the validation

   ```bash
   helm lint charts/eric-adp-gui-aggregator-service
   ```

> **Note**
> Steps 3 and 4 can be executed with one bob rule `validate-values-yaml`.

## Local testing

### Build image

Build the service docker image with a local name to use it locally.
(local image name: `local/proj-eea-dev/uiservice:1.0`)
It has to be done every time the content is changed.

```bash
docker login armdocker.rnd.ericsson.se # enough to do it once, use SIGNUM + pass
docker image build --file docker/Dockerfile -t local/proj-eea-dev/uiservice:1.0 .
```

### Deploy

Deploy the helm chart into a local kubernetes cluster. It works only locally as the image is
only in the local docker registry.
There are some parameters which has to be set or overridden for local deployment.
The image name related ones are important to use the local docker image.
Also the resources shall be set as the default ones may be too much for a local cluster.

```bash
helm install eric-adp-gui-aggregator-service charts/eric-adp-gui-aggregator-service \
  --set global.registry.url=local \
  --set imageCredentials.repoPath=proj-eea-dev \
  --set images.main.name=uiservice \
  --set images.main.tag=1.0 \
  --set ingress.enabled=true \
  --set ingress.path=/uiservice \
  --set ingress.hostname=localhost \
  --set resources.main.requests.memory=256Mi \
  --set resources.main.limits.memory=256Mi
```

Also resource requests or resource limits may be unset if deployment with "best effort" QoS
class is desired.

```bash
helm install eric-adp-gui-aggregator-service charts/eric-adp-gui-aggregator-service \
  --set global.registry.url=local \
  --set imageCredentials.repoPath=proj-eea-dev \
  --set images.main.name=uiservice \
  --set images.main.tag=1.0 \
  --set ingress.enabled=true \
  --set ingress.path=/uiservice \
  --set ingress.hostname=localhost \
  --set resources.main.requests.cpu=null \
  --set resources.main.limits.memory=null
```

After the command is executed the deployment and other resources are created in Kubernetes.

### Undeploy

To remove the chart totally from the cluster, execute this:

```bash
helm uninstall eric-adp-gui-aggregator-service
```

### Debug deployment

Get the helm chart release status: `helm status eric-adp-gui-aggregator-service`

Check if the pods are okay: `kubectl get pods`
If the pod is not in Running state then there can be an issue.
To check what is happening with the pod: `kubectl describe pods <pod name>`

Even if the pod is running the app can still fail. To show logs: `kubectl logs <pod name>`
SSH into a pod: `kubectl exec --stdin --tty <pod name> -- bash`
Port-forward: `kubectl port-forward <pod name> <local port>:<pod port>`

Change default namespace in current context:
`kubectl config set-context --current --namespace=<NAMESPACE NAME>`

## Remote cluster

To deploy to a remote cluster, the image first has to be pushed to
a remote docker registry. For that deploy privilege is required to do it manually.
To avoid naming conflicts in the registry use VERSION.SIGNUM as _TAG_.
Also the remote cluster can be used by multiple developer at the same time.
To separate deployments the release name shall be unique and be in separate namespaces.
(in Helm 3 it is a bit different as release names are scoped to namespaces)

Set up some variables (eg.):

```bash
SIGNUM = 'esmbody' # set it to your SIGNUM
TAG = "VERSION-$SIGNUM" # set a version number
RELEASE_NAME = "eric-adp-gui-aggregator-service.$SIGNUM"
NAMESPACE = "dev-$SIGNUM"
```

Build the docker image:

```bash
docker login armdocker.rnd.ericsson.se # enough to do it once, use SIGNUM + pass
docker image build --file docker/Dockerfile \
  -t armdocker.rnd.ericsson.se/proj-eea-dev/eric-adp-gui-aggregator-service:$TAG .
```

Push the image to the remote docker repository:

```bash
docker push armdocker.rnd.ericsson.se/proj-eea-dev/eric-adp-gui-aggregator-service:$TAG
```

Create pullsecret for your cluster

```bash
kubectl create namespace $NAMESPACE

kubectl create secret docker-registry arm-pullsecret \
  --docker-server=armdocker.rnd.ericsson.se \
  --docker-username=$ARM_USER_SELI \
  --docker-password=$ARM_TOKEN_SELI \
  --namespace $NAMESPACE
```

Install with helm

```bash
helm install $RELEASE_NAME charts/eric-adp-gui-aggregator-service \
  --namespace $NAMESPACE \
  --set imageCredentials.main.repoPath=proj-eea-dev \
  --set imageCredentials.main.name=eric-adp-gui-aggregator-service \
  --set imageCredentials.main.tag=$TAG \
  --set imageCredentials.pullSecret=arm-pullsecret
```

To remove with helm

```bash
helm uninstall $RELEASE_NAME
```

## Runtime configuration

For testing new helm configuration use the --set option of the helm chart to change values.
To permanently change configuration, overwrite values in the values.yaml file.
