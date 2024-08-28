# Remote Dev Env

It is possible to develop in a remote cluster where every dependency is deployed to develop and
test integration with ADP and other components.

?> Some of the following description is valid only for the presentation area cluster, but most
steps are generic to CCD or any Kubernetes Cluster.

## Quick steps

The overall process is to use this env:

0. (Prepare Helm repo - [Setup helm repos](#setup-helm-repos))
1. [Configure CI chart](#configure-chart)
   - enable the required dependencies
2. Install ADP dependencies with CI Chart
   - [init dependencies](#init-dependencies)
   - [install helm chart to the cluster](#install-ci-chart)
   - if IAM is turned on, check [IAM Quick steps](#iam-quick-steps)
3. Configure GUI Aggregator in `eric-adp-gui-aggregator-service` helm chart
   - set TLS on/off
   - set ingress config
   - set other configs (eg. using direct log streaming etc.)
4. Configure Tilt
   - set `ingressHost`, `ingressEnableTLS` if required
5. Start up GUI Aggregator with [Tilt](tilt.md)
   - `AuthZ proxy` will only work in legacy mode (SAP container will create the OAuth client with
     admin user instead of using iam custom resource)
   - deploy the GAS helm chart with helm instead of Tilt if you want `AuthZ proxy` not to work in
     legacy mode ([ADPRS-3191](https://eteamproject.internal.ericsson.com/browse/ADPRS-3191))
6. Check status via [Ingress](#ingress-controllers) or port-forwared endpoints.

## CI chart

The CI Umbrella Helm chart can be used to install some or all dependencies into a remote
kubernetes cluster.
The CI chart is located in the `charts/ci` folder.

?> The [Ingress controllers](#ingress-controllers) are usually cluster-wide
and shared between services, but the CI chart also provides a controller for Contour,
see [Using own Ingress Controller](#using-own-ingress-controller).

### Setup helm repos

First the helm repositories must be configured. To get a token, login to each ARM instance,
then get your API token from the user's preferences.

These steps are required once.

```bash
# Add ADP helm repository for general services
helm repo add proj-adp-gs-all-helm \
https://arm.sero.gic.ericsson.se/artifactory/proj-adp-gs-all-helm

# Add EEA helm repository for dummy services
helm repo add eea-drop \
https://arm.seli.gic.ericsson.se/artifactory/proj-eea-drop-helm \
--username $ARM_USER_SELI \
--password $ARM_TOKEN_SELI

# Fetch repo content to local cache. Do it time to time.
helm repo update
```

### Configure Chart

The CI Chart has a `values.yaml` file, which contains the settings for each dependencies,
and also defines which one should be installed.
The default content is optimized for the Drop pipeline in the service CI, where the number of installed
ADP services is kept at minimum, so don't commit any ADP service as enabled into Git.
However the configuration for each service should be kept up-to-date.

There is a values yaml file for a full CI setup `ci/config/ci-chart.yaml`, it enables all
dependency services. To use this file add the `--values ci/config/ci-chart.yaml` parameter to
the helm install / upgrade commands.

To have a customized development deployment take this yaml file as an example and enable / disable
the required services and edit other properties. With this file the deployment can be easily reproduced.

!> The `ci-chart.yaml` file contains placeholder hostnames for the IAM service. By this it is a valid
deployment, but the host names are not valid DNS names. To make the IAM service accessible via the
Ingress service update the hostnames.

### Init dependencies

After enabling the wanted service in values.yaml, the dependencies must be downloaded.
The archives for each dependency is downloaded into the `charts/ci/charts` folder.
Also a `Chart.lock` file is created, but don't commit this.

```bash
cd charts/ci
helm dependency update
cd ../..
```

### Install CI Chart

!> Some of the ADP services requires a clean namespace and does not support reinstalls.
To be sure that everything will be installed correctly, always delete and recreate the
used development namespace.

The release name can be any string (in this example it is `adp-services`),
and use your developer namespace.

Provide the values yaml file with the customized values.

```bash
kubectl delete namespace $NAMESPACE
kubectl create namespace $NAMESPACE

helm install adp-services charts/ci -n $NAMESPACE --values $OPTIONAL_VALUES_FILE
```

It starts the helm install. As there is dependency between the services, it may take
several minutes when everything is started fully.

To check the status, just list all pods and wait until all have `RUNNING`/`COMPLETED` status.

```bash
kubectl get pods -n $NAMESPACE
```

Now every enabled service is up. Now the GUI Aggregator can be installed with Tilt. Also set the
required configuration for the GUI Aggregator to use the installed dependencies.
(eg. setting direct log streaming on, mTLS on etc.)

?> IAM requires some more manual steps to be completely configured, check next chapter.

Fault/Alarm Handler requires an additional pull-secret for `ARM sero`, see in `arm_docker_pull_secret_template.json`.
To set the pullsecret for Fault Handler:

```bash
helm install adp-services charts/ci -n $NAMESPACE --values $OPTIONAL_VALUES_FILE \
  --set eric-fh-alarm-handler.imageCredentials.pullSecret=arm-pullsecret
```

If a value is changed in the values.yaml, then the helm upgrade command can be used to apply
the changes.

```bash
helm upgrade adp-services charts/ci -n $NAMESPACE --values $OPTIONAL_VALUES_FILE
```

?> **Note:** If CI chart is installed with this method, please set the `isCiChartDeployed` flag to
true in Tilt.

In order to deploy a minimally required development ci chart set **OPTIONAL_VALUES_FILE** to **ci/config/minimal-ci-chart-values.yaml**
before running

```bash
helm install adp-services charts/ci -n $NAMESPACE --values $OPTIONAL_VALUES_FILE
```

### IAM Quick steps

There are some manual steps to configure IAM after a clean install.

1. determine the ICCR IP address: `kubectl get svc -n $NAMESPACE | grep LoadBalancer`
2. update the hostnames for the IAM service in the customized values.yaml
3. upgrade the helm deployment with the new values: `helm upgrade ...`
4. setup realm and users on IAM GUI: [Deployment Step 4.](#deployment)

### Uninstall

To uninstall the ADP services just use the `helm uninstall` command

?> **Note:** `helm uninstall` will not delete `PersistentVolumeClaim` resources, to delete
`PersistentVolumeClaims` delete the whole namespace or delete them manually from the namespace.

```bash
helm uninstall adp-services

# Clean up namespace, by recerating it
kubectl delete namespace $NAMESPACE
kubectl create namespace $NAMESPACE
```

## Ingress Controllers

In the Presentation cluster, two different Ingress Controllers are installed (Nginx and
Contour). At the moment GAS supports both types, so always try out changes with both.

The `ingress.*` section in the `values.yaml` of GAS controls how the service is deployed
in a cluster. Generally an ingress route definition requires a **hostname** and a **path**.

The controllers are bound to different nodes, so to reach their external ports different
hosts and technique is required.

With a 3pp service it is easier to use arbitrary domain names: [nip.io](#nipio)

- Nginx: `*.10.196.123.160.nip.io`
- Contour: `*.10.196.123.199.nip.io`

For more information about the domain names and considerations, check the related chapters:

- [Nginx](#nginx)
- [Contour hostname](#hostname)

?> As the Ingress Controller can be reached with different hostnames, when changing config from one to
another, update the hostname config accordingly.

### External TLS

For testing the external TLS ingress configuration, a TLS certificate is needed. As the Certificate
Manager has very high footprint, instead the SIP-TLS can be used directly to generate a proper certificate.
There is a predefined secret in the chart, which works well with Contour.

1. To generate a certificate, the SIP-TLS service must be enabled in the CI chart and
   deployed to the namespace.
2. Also set the `ingressEnableTLS` to `true` in the Tilt configuration.

### Mutual TLS between Ingress and GAS backend

When `global.security.tls.enabled` is true and `service.endpoints.http.tls.verifyClientCertificate`
is set to `required`, Ingress Controller is enforced to send a client certificate towards the GAS.
The GUI Aggregator then needs the CA of this certificate to be able to verify it.

The CA secret name is either given in `ingress.adpIccrCaSecret` or will be concatenated
from the IC service name that is set in `ingress.adpIccrServiceName` and the `-client-ca` postfix.

Mutual TLS is only supported with Contour, so in case of Nginx
`service.endpoints.http.tls.verifyClientCertificate` must be `optional`.

### Usage with Tilt

Ingress support can be switched on with Tilt easily. The used hostname is different for the
two different IC, to determine it check the next chapters.

General Ingress usage with Tilt:

1. in tilt config set `ingressUseContour` to `"false"` for Nginx, and `"true"` for Contour
2. in tilt config set `ingressHost` for Nginx and `ingressIp` for Contour.
   For more info: [Tilt Configuration](tilt.md#configuration).
3. in tilt config set `ingressEnableTLS` true or false depending on if external TLS is needed or not
4. Start up GAS with Tilt
5. Open UI (replace username in this link): <http://\(hostname\)/uiservice\_(username)/ui/>

### Nginx

?> Currently working external hostname: `seliics01656e01.seli.gic.ericsson.se`.
Or use nip.io: `*.10.196.123.160.nip.io`

This is the deprecated version, which is still part of CCD and used by some Application.

This Ingress controller can be configured by the `Ingress` kubernetes kind. It watches deployed
`Ingress` kinds and creates the routing rules according to them. Rules are based on hostname and
url patterns. Multiple Ingress resource can define and use the same hostname, which makes it
easier to use it in development.

Use the above hostname with the generic Tilt steps.

?> When using the common Nginx of a cluster, leave `ingress.ingressClass` empty in GAS chart.

### Contour

?> Contour should be used with own instance deployed into the development namespace.

This is the next generation Ingress controller used in CCD.

It supports both the `Ingress` and `HTTPProxy` kinds as configuration. In GAS the more flexible
`HTTPProxy` kind is used to define Contour configuration.

#### Using own Ingress Controller

It is recommended to use the EEA ICCR that is available in the CI chart. For this
`eric-tm-ingress-controller-cr.enabled` is to be true in the CI chart.
If needed, update its version in Chart.yaml.

In the GAS chart these settings are needed:

- `ingress.enabled`: `true`
- `ingress.useContour`: `true`
- `ingress.hostname`: `<signum>.gas.<IP-address-of-IC>.nip.io`
- `ingress.ingressClass`: `EEA-Applications`
- `ingress.adpIccrServiceName`: `eric-eea-ingress-ctrl-common`

See below chapters about hostname and IP address of controllers.

#### Hostname

However `HTTPProxy` kind handles hostnames differently than the `Ingress` kind. A hostname can be used
only in one resource descriptor. The deployment of the second resource will fail.
But these resources can be included in each other, where only the top level resource must have a defined
hostname. In production the pattern is to define a product level root `HTTPProxy` with hostname, and
include service level `HTTPProxies` as child resource without hostnames. Then each service can be
reached from the common hostname.

This way of working is not yet implemented in the Cluster nor in the CI.
Until it is worked out a different solution is needed: Each deployment needs its own hostname
in its `HTTPProxy` config. However the DNS setting for the cluster does not allows to define
arbitrary sub-domain names. (eg. my.gas.test.seliics01656e01.seli.gic.ericsson.se).

There are multiple solutions.

##### Hosts file

Editing the `hosts` file is one option.

1. define an unique hostname: _local-hostname_
2. get the external ip of contour (10.196.123.199)
3. add an entry to the OS's hosts file: `<external-ip> <local-hostname>`
   - Linux: `/etc/hosts/`
   - Windows: `C:\windows\system32\drivers\etc\hosts`

Now use the generic Tilt steps with _local-hostname_

##### Nip.io

There is a 3pp service, which can generate domain names for internal IPs on the fly: <nip.io>
With this editing of hosts file is not needed. Other benefit, that these hostnames can be shared
internally and can be opened by others.

The format of the hostname shall be: `*.10.196.123.199.nip.io`

Define an unique hostname prefix, eg. username. The hostname will be: `<username>.10.196.123.199.nip.io`.
Then use this hostname with the generic Tilt steps

### Determine host/ip for IC

If the above hostnames / IP Addresses are not valid anymore, use these steps to get the actual
ones.

General way to determine external IP address and hostnames. First get the list of nodes with
IP address in the cluster, then find the bound IP address for each Ingress service.
A service may have multiple External-IPs, in this case any of them can be used.

```bash
# Get the node list with
# Hostname = <NAME>.seli.gic.ericsson.se
# IP Address = INTERNAL-IP
kubectl get nodes -o wide

# Get the EXTERNAL-IP for Nginx.
# EXTERNAL-IP = INTERNAL-IP of a node
kubectl get service -n ingress-nginx ingress-nginx

# Get the EXTERNAL-IP for Contour.
# EXTERNAL-IP = INTERNAL-IP of a node
kubectl get service -n eric-tm-ingress-controller eric-tm-ingress-controller-cr
```

## Service Mesh

ADP provides an implementation of Istio 3PP solution for traffic management and network security.
See [ADP Service Mesh framework description](https://eteamspace.internal.ericsson.com/display/AA/Service+Mesh)
and [Service Mesh Controller marketplace](https://adp.ericsson.se/marketplace/servicemesh-controller)
for more background information and use cases.

In case Service Mesh is used as Ingress gateway, ICCR and Nginx must be disabled.

As prerequisite of using Service Mesh with GAS, the Custom Resource Definitions
(basically [this chart](https://arm.sero.gic.ericsson.se/artifactory/proj-adp-gs-all-helm/eric-mesh-controller-crd/))
shall be installed in the common CRD namespace of the Kubernetes cluster. Check whether it is available:

```bash
helm list --namespace eric-crd-ns
kubectl get crd | grep istio
```

If not, you can install the CRD chart of Service Mesh with this command
(replace version and namespace if you like):

```bash
helm install eric-mesh-crds \
https://arm.sero.gic.ericsson.se/artifactory/proj-adp-gs-all-helm/eric-mesh-controller-crd/eric-mesh-controller-crd-9.2.0+1.tgz\
--atomic --namespace eric-crd-ns
```

Then enable both the global settings and the 2 required Service Mesh services in the CI values.yaml:

```yaml
global:
  serviceMesh:
    enabled: true

eric-mesh-controller:
  enabled: true

eric-mesh-gateways:
  enabled: true
```

You may need to re-fetch the CI chart dependencies:

```bash
cd charts/ci
helm dependency update
cd ../..
```

After installing GAS CI chart with enabled SM services, you should see 2-2 gateway and controller Pods
in your namespace.

When using Tilt for CI chart install, simply set `serviceMeshEnabled` setting to `true`.

### Using Service Mesh with the mock services

To use the ingress feature of SM in the mocks, at first identify the external loadbalancer IP of SM:

```bash
kubectl get service -o=jsonpath='{.items[?(@.spec.type == "LoadBalancer")].status.loadBalancer.ingress[0].ip}'
```

Then please set this IP and enable SM in the mock configuration.

- If you deploy the mock service manually, then set this IP via mock's values chart, in this property:
  `serviceMesh.ingress.hostname`. It is recommended to use nip.io, and set a hostname like `<signum>.<mock-id>.<loadbalancer-ip>.nip.io`.
  Please also set `serviceMesh.enabled` to `true` in the mock's values chart to enable SM.

- Or if you use Tilt, simply set the loadbalancer IP in `ingressIP` property, and enable `serviceMeshEnabled`.
  Tilt will assemble the nip.io hostname and you will find the full mock URL's in Tiltfile log.

After installing the mock service, a custom `Gateway` and `VirtualService` resource will
also be deployed, and these will do the routing based on the configured ingress hostname.

## Log subsystem

If Logtransformer is installed to the cluster, and GAS is configured to send logs
in a JSON format via TCP, the ADP Log subsystem can be used to check logs.

To check the logs in search engine, you have to forward traffic from port 9200 of
the Search Engine:

```bash
kubectl port-forward eric-data-search-engine-master-0 9200:9200 -n <namespace>
```

Now you can check the logs under the provided logplane:\
Example:\
[https://localhost:9200/\_cat/indices](https://localhost:9200/_cat/indices)\
[https://localhost:9200/eric-adp-gui-aggregator-service-2021.03.17/\_search?pretty=true&size=1000&sort=timestamp:desc](https://localhost:9200/eric-adp-gui-aggregator-service-2021.03.17/_search?pretty=true&size=1000&&sort=timestamp:desc)

## Alarms provisioning

GAS can be configured to send FaultIndications, with according list of dependencies
installed to the cluster.

To check the alarms in Alarm Handler service, you have to forward traffic from the port 5006 of the
alarm handler service:

```bash
kubectl port-forward eric-fh-alarm-handler 5006:5006 -n <namespace>
```

## Authentication and Authorization

It is possible to deploy GAS with user management, using the ADP Keycloak implementation
IAM, and the AuthZ proxy as a sidecar.

- [IAM](https://adp.ericsson.se/marketplace/identity-and-access-management)
- [Authorization Proxy](https://adp.ericsson.se/marketplace/authorization-proxy-oauth2)

### Prerequisites for using authentication

To deploy the service with this feature, the following steps needs to be done:

- In the CI chart `global.security.tls.enabled`, `eric-data-document-database-iam.enabled`,
  `eric-sec-sip-tls.enabled` and `eric-sec-access-mgmt.enabled`
  has to be set to true, so SIP-TLS will be deployed and will generate the keys for the IAM service.

- In the GAS chart `global.security.tls.enabled`, `ingress.useContour`, `ingress.tls` and
  `authorizationProxy.enabled` has to be set to true. Nginx ingress won't work, Contour has to be used.

If you are using tilt to install IAM and the CI chart the following `tilt.option.user.json` setting
is required:

```json
{
  "enableAuthentication": true,
  "mTLS": true,
  "ingressEnableTLS": true
}
```

?> If you have IAM deployed in a previously used namespace, the namespace have to be recreated, IAM
won't survive restarting the namespace.

### Parameter Configuration (not necessary)

Most of the configuration can be done via helm value parameters. One of this is to set up the FQDNs
for the services. This system uses 3 FQDNs - one for IAM, one for IAM's Authentication Proxy, and one
for GAS. The IP address can be freely selected from any of the Contour loadbalancer
IP addresses - `<IP>` in the following. Due to DNS resolving problems, one would have to update the systems
hosts file every time to make the redirection working, although there is a workaround for this, called
[nip.io](https://nip.io). This website helps the browser, and resolves addresses via rules that are
described on their website. FQDNs also must be unique across the cluster, so append your `signum` to
them to separate from other developers' FQDNs. With the help of this the FQDNs can be the following:

- IAM FQDN located in GAS values.yaml `authorizationProxy.keycloakFQDN`: `iam.<signum>.gas.<IP>.nip.io`
- AuthN FQDN located in GAS values.yaml `authorizationProxy.authnProxyFQDN`:`authn.iam.<signum>.gas.<IP>.nip.io`
- GAS FQDN under ingress settings `ingress.hostname`:`<signum>.gas.<IP>.nip.io`

The IAM service also has some parameters for these addresses in its config under the CI chart:

- `eric-sec-access-mgmt.authenticationProxy.cookieDomain`: `nip.io`
- `eric-sec-access-mgmt.authenticationProxy.ingress.hostname`: `authn.iam.<signum>.gas.<IP>.nip.io`
- `eric-sec-access-mgmt.ingress.hostname`: `iam.<signum>.gas.<IP>.nip.io`

### Deployment

?> `<IP>` is `10.196.123.200` in the following examples, but can be replaced by any
existing Contour IP.

The deployment can be done with Helm install command or Tilt, I recommend using Tilt for it's robustness.
With Tilt turn on `ingressEnableTLS` and `ingressUseContour` and set

- the `ingressHost` to `<signum>.gas.10.196.123.200.nip.io`
- the `enableAuthentication` to `true`
- the `mTLS` to `true`

in your tilt.options.user.json file.

Deployment steps:

1. Make sure that your helm dependencies are up to date. (Issue `helm dep update` command
   from `charts/ci` folder.)
2. Run `tilt up` from repo root, or deploy using `helm install`. The current best-practice is using
   helm to deploy the chart, then run `tilt up`.
   (due to tilt having issues with the `service.yaml` files)
3. Wait for all pods except GAS to come to the ready state (2 green indicators in Tilt).
   GAS won't be ready, until we create the realm in Keycloak.
4. Visit `https://iam.<signum>.gas.10.196.123.200.nip.io/auth/admin/`, where you can
   log into the administration console using credentials **admin:4dm1N_login_pwd**. Here the following
   steps need to be done:
   1. In the top left hover over **Master** and click **Add realm**. Name it `oam` - the value of
      `authorizationProxy.adpIamRealm` in the CI chart values.yaml - then click **Create**.
   2. Now the new realm will be selected, in the left menu click **Users**. In the top right of the table
      click **Add user**. This will be the user which will be used to log into GAS. Pick
      a username, then turn on the **Email Verified** switch, then click **Save**.
   3. Now it will redirect to the created users page. Go into the **Credentials** tab, fill in a chosen
      password, turn off the **Temporary** switch, then click **Set password**.
   4. Go to the **Role Mappings** tab, and add the **all-in-one-gas** role which will
      give the needed permissions to this user to use the service. This role is specified under the
      `auth-proxy-authorizationrules.yaml`.

> **_Note:_** At step 3, IAM might restart 1-2 times during deployment if the cluster if slower at
> that time, just be patient and wait for it to be ready.

### CORS configuration

CORS is not configured in the `eric-sec-access-mgmt` service http proxy settings. To fix this the httpproxy
needs to be edited.

Edit the `eric-sec-access-mgmt` and `eric-sec-access-mgmt-authn` `httpproxy` resources.

```bash
kubectl edit httpproxy eric-sec-access-mgmt -n <NAMESPACE>
```

Find the virtualhost in the httpproxy spec and extend it with the cors settings.

```yaml
virtualhost:
  corsPolicy:
    allowCredentials: true
    allowMethods:
      - GET
      - POST
      - OPTIONS
    allowOrigin:
      - '*'
```

Then repeat for `eric-sec-access-mgmt-authn`.

After the steps are done GAS should move forward and get to the ready state. Now the
application can be accessed through the `https://<signum>.gas.10.196.123.200.nip.io/ui`
address, where you can login with the created username and password.

## CNOM

A monitoring service to visualize and explore Pod status, metrics in PM Server, logs in Search
Engine and active alarms in Alarm Handler. See CNOM documentation on the [marketplace.](https://adp.ericsson.se/marketplace/cnom-server)

The CNOM Server is added to the CI chart. The custom dashboard model file is created in the
ConfigMap file _gas-cnom-default-dashboard-configmap.yaml_. Deployment of the dashboard model is
done using `ericsson.com/cnom-server-dashboard-models: true` label (auto-discovery method).
For Topology Browser (dashboards navigation tree) there is a configuration file
_gas-cnom-status-overview-configmap.yaml_.

Before deploying the CI chart with CNOM add the helm repository where the CNOM helm chart is located
and update helm dependencies.

```bash
helm repo add pc-rs-released https://arm.sero.gic.ericsson.se/artifactory/proj-pc-rs-released-helm \
  --username ${ARM_USER_SERO} --password ${ARM_TOKEN_SERO}
helm repo update
cd charts/ci
helm dep update
```

To deploy the GAS and the CI helm chart use Tilt. The following `tilt.option.user.json` setting
was tested (make sure mTLS is turned off as CNOM cannot be started with mTLS):

```json
{
  "mode": "remote",
  "deployCNOM": true,
  "metricsEnabled": true,
  "faultIndicationsEnabled": true,
  "logStreamingMethod": "dual"
}
```

As the ingress config is incomplete at the moment, to access the CNOM UI, forward the port
where the CNOM UI is exposed:

```bash
 kubectl port-forward -n ${NAMESPACE} svc/eric-cnom-server 8585
```

## DST Collector and Query

Distributed Systems Tracing is used to trace communication between microservices. A trace contains
information about the communication path between the components, which components are involved and
how much time a component used to do its work.

The DST Collector and Query services are added to the CI chart,
to enable them set `values.dst-services.enabled` to true.

By default mTLS is enabled in it, to turn mTLS off set `global.security.tls.enabled` to false.

To change sampling rate during runtime, edit `eric-dst-collector-remote-sampling` configmap.

### Prerequisites

- A running Kubernetes environment
- Access rights to deploy and manage workloads
- Availability of the kubectl CLI tool with correct authentication details.
- Availability of the helm 3 package
- Availability of Helm charts and Docker images for the service and all dependent services
- Installed Elasticsearch or Cassandra cluster

### Deploy with Tilt

Set the following parameters in `tilt.option.user.json`:

With mTLS:

```json
{
  "logStreamingMethod": "dual", // console + Elasticsearch
  "deployDSTServices": true, // DST Collector and Query
  "metricsEnabled": true, // needed for tls certs
  "mTLS": true
}
```

Without mTLS:

```json
{
  "logStreamingMethod": "dual", // console + Elasticsearch
  "deployDSTServices": true, // DST Collector and Query
  "mTLS": false
}
```
