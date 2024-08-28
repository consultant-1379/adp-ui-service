# GUI Aggregator Service

GUI Aggregator Service (GAS) is the backend for the Launcher and EUI-SDK based microfrontends.
It performs auto-discovery of deployed UI applications in the Kubernetes (K8s) cluster
based on Kubernetes parameters, and also provides REST API to query this list to be
displayed in the Launcher.

## Functionalities

Currently the NodeJS GUI Aggregator service supports several different functionalities and use cases.
To get an overview check the marketplace docs: [Service User Guide](../release/content/service_user_guide.md).

Current:

- discovers UI application based on Kubernetes API
- provides performance metrics
- produces fault indications
- can be deployed with Helm
- configurable via Helm charts
- serves the Common Portal
- implements REST APIs (API spec: `/docs/api/`)
  - `ui-meta` - collects metadata for the portal
  - `ui-logging`
  - `ui-serve` - collects and serves discovered JS modules
  - `userpermission` - fetches user data from IAM service

### Fault indication producing

GAS Light `fMHandler` module provides API to produce fault indications. Fault indication service processes
fault indications into alarms according to fault-to-alarm map (`eric-adp-gui-aggregator-service-faultmappings-configmap`).

GAS Light Fault Handler sends indication listed in `faultIndicationDefaultsMap.json` file.
Fault indication can be passed via short alias. For example,

`fMHandler.produceFaultIndication({fault: "SERVICE_UNAVAILABLE"})`

will produce fault indication with name `service_unavailable` and all parameters by default.
To override default parameters use additional field, "customConfig"-

`fMHandler.produceFaultIndication({fault: "SERVICE_UNAVAILABLE", customConfig: {severity:"Critical"}}))`

Corresponding to the `faultIndicationDefaultsMap.json`, configmap `eric-adp-gui-aggregator-service-faultmappings-configmap`
contains alarms data.

Fault Handler service will produce an alarm only if there will be an item of equal to the received FI
`faultName` and `serviceName`.

To add Fault Indication/Alarm:

1. Edit `faultIndicationDefaultsMap.json`. Add fault indication default config with an alias name as
   a key.
   Required fields:

   - `faultName`
   - `serviceName`
     It is also strongly recommended to add `expiration` field with value > 0.

   Valid minimal setup for a new entity:

   ```js
       "NEW_FAULT_ALIAS_NAME": {
       "faultName": "new_fault",
       "serviceName": "eric-adp-gui-aggregator-service",
       "expiration": 5000
       }
   ```

2. Edit `eric-adp-gui-aggregator-service-faultmappings.json`. Add an Alarm configuration. `faultName`
   field is required. `code` field is mandatory. Alarms codes could be taken as of sequential to
   existing ones, or obtained using registration process (Minor Type) described in
   `https://erilink.ericsson.se/eridoc/erl/objectId/09004cff86e5863f?docno=1/00021-FCP1305518Uen&action=approved&format=pdf`

   Valid minimal setup for new entry, corresponding to the FI setup above -

   ```js
      {
        "faultName": "new_fault",
        "code": 15007749, // next sequential number
        "defaultDescription": "New alarm default description",
        "vendor": 193, // for E// it should be 193
        "defaultSeverity": "Critical", // Clear|Warning|Minor|Major|Critical
      }
   ```

Fault indications are being validated by schema `faultIndication.json` before sent.
In case of invalid FI, error will be logged.

For more info on how to add FI/Alarm refer to the [Service User Guide](../release/content/service_user_guide#performance-management)

More info on Alarm Handler Service:
`https://adp.ericsson.se/marketplace/alarm-handler/documentation/8.7.0/dpi/service-user-guide`

### API Endpoints

The REST API endpoints are listed below:

#### Meta API

These endpoints provide information of the Kubernetes cluster and it`s current state.

- GET `/ui-meta/v1/apps`
  - Sends the current deployed applications as a response in a JSON format.
- GET `/ui-meta/v1/groups`
  - Sends the current deployed groups as a response in a JSON format.
- GET `/ui-meta/v1/components`
  - Sends the current deployed components as a response in a JSON format.

#### Logging API

- POST `/ui-logging/v1/logs`
  - This is the logging api for the UI application, it requires 3 fields:
    - `logLevel`: The severity level of the provided message
    - `category`: The log category of the provided message
    - `message`: The content of the event
  - The generated log message is printed to the console at this point.

#### Serve API

- GET `/ui-serve/v1/import-map`

  - Sends the generated import map containing the available ESM modules
    Note that if a value is provided for the `ingress.path` helm value, it is added to the import
    urls, thereby allowing GAS to be deployed to any external context.

- GET `/ui-serve/v1/static/{URI}`
  - Proxy a static file from a domain service

#### Metrics API

- GET `/metrics`
  - Provides metrics data in Prometheus compatible format. Uses separate HTTP server on own port.

#### User permission API

- GET `/userpermission/v1/userinfo`

  - Fetches user info from the IAM service. Supports receiving the auth token either in the
    Cookie or the Authorization header.

- GET `/userpermission/v1/{realm}/userinfo`

  - Extends the user info endpoint with explicitly setting the realm for which the user
    data will be fetched.

- POST `/userpermission/v1/{realm}/permission`
  - Fetches permission info from the IAM service regarding the current user.

## Technology

The service itself is a NodeJS application based on the ExpressJS framework.
It is bundled into a docker image, which can be deployed to Kubernetes cluster with Helm.

## NPM tasks

These are the common NPM tasks for the UI service.

!> The server can be started standalone, however a running Kubernetes cluster is required.
Also the discovery is limited, as fetching the config.jsons from internal services
externally is not supported. To test the full functionality it is better to use
manual [Kubernetes](kubernetes.md) deployment or [tilt](tilt.md) with [mock services](mock-services.md)
or [bridge to Kubernetes](bridge-kubernetes.md).

```bash
npm install                 # Install dependencies
npm start                   # start in normal mode
npm run start:watch         # if source is changed the server is reloaded
npm run start:debug         # start in debug mode
npm run lint                # lint source code
npm run test                # run all tests
npm run test:timeout        # run all tests, with an overall timeout
npm run test:generateReport # generate HTML report
npm run test:generateReport:timeout # generate HTML report, with an overall timeout
npm run test:coverage       # run mocha tests with coverage report
```

_Note: development server runs on `http://localhost:3000`_

## Mock services

As the GUI-Aggregator uses the Kubernetes API a running Kubernetes cluster with some service
is required for development. For that there are some mock service which can return
proper configurations and data. See [Mock Services](mock-services.md)

The GUI-Aggregator can be then started in standalone mode locally or can be deployed into the cluster.

## Start Locally

Local execution method:

- add some data of services to the config file: `config/backend-service-config/manual-service-config.json`
  e.g.:

```json
{
  "serviceList": [
    {
      "name": "Mock Service",
      "version": "1.0",
      "URL": "http://localhost:8080/"
    },
    {
      "name": "Mock Service 2",
      "version": "2.0",
      "URL": "http://localhost:4000/"
    }
  ]
}
```

- start GAS with npm:

  run `npm run start:watch`

- start mock service with npm:

  `cd mocks/domain-ui-generic/` run `npm run start:mock` - this will serve the config.json for the application

- while modifying the config list, the same events can be seen as coming from the auto discovery behavior

## Performance metrics

GAS Light `pmService` module provides API for collecting different performance metrics

In order to collect metrics from the application `pmService` must be initialized
by calling `pmService.setupPromClient()` and pointed at first to the parent express app
by calling `pmService.applyMetricsCollectionMiddleware(app)`. By default this will start collecting
some [Default Metrics](../release/content/service_user_guide.md) including request count and
response time to specific endpoints stated in `backend-service-config-default.json`.
Note that `applyMetricsCollectionMiddleware` offers an optional second parameter object
that may contain additional metric gathering [settings](https://www.npmjs.com/package/express-prom-bundle).

To have the metrics published on the additionally created `/metrics` endpoint,
call `pmService.applyMetricsCollectionMiddleware(metricApp)` with the dedicated express app for metrics.

A custom counter or gauge can be created for other purposes by using `pmService.createMetric` method.
Example:

```js
pmService.createMetric('gauge', { name: GAUGE_METRIC_NAME });
pmService.createMetric('counter', {
  name: apiName,
  help: `Amount of requests to the "${url}" API`,
  labelNames: ['endpoint', 'method', 'code'],
});
```

To delete a metric call `pmService.deleteMetric(metricName)` and pass it's name as a parameter.

To check if metrics collection is enabled by service configs use `pmService.isEnabled()`.

To add request count and response time metrics to specific endpoints, list them under
`dependencies.prometheus.endpointsToCountRequests` in `backend-service-config-default.json`
by providing their full path postfixes.

```json
{
  "dependencies": {
    "prometheus": {
      "enabled": true,
      "appName": "eric-adp-gas",
      "endpointsToCountRequests": [
        "/ui-meta/v1/apps",
        "/ui-meta/v1/groups",
        "/ui-meta/v1/components",
        "/ui",
        "/ui-serve/v1/import-map",
        "/ui-serve/v1/list-packages",
        "/ui-logging/v1/logs",
        "/gas-internal",
        "/ui-serve/v1/static"
      ],
      "tls": {
        "verifyServerCert": false,
        "sendClientCert": false
      }
    }
  }
}
```

!> If you add new metrics or modify existing ones, you must also update the metadata file
`docs/release/metadata/eric-adp-gui-aggregator-service_pm_metrics.json` according to
[documentation](https://eteamspace.internal.ericsson.com/display/ACD/PM+Metrics+Fragment+handling).\
Then run `bob generate-metrics-doc` to update `pm_metrics_fragment.md`, which is included in the
**Provided metrics** section in the `service_user_guide.md` documentation locally.\
Do not update `pm_metrics_fragment.md` manually. It will be overwritten in the CI/CD steps.

Please note, that currently the pm-server doesn't work with custom certificates.

## Debug

The next sections describe how to debug GAS with the preferred IDE, VSCode.
These instruction are mostly generic for NodeJS applications.

### Local

VS Code supports the _Auto Attach_ feature for local Nodejs processes started in the _integrated_
terminal. With this, it is very easy to debug locally:

- turn on Auto Attach (eg. in the bottom status bar or in settings.json)
- start the server normally _in VS Code integrated terminal_
- VS Code detect the nodejs process and automatically attaches to it
- start adding breakpoint to the source

!> Auto attach only triggered for the integrated terminal. For NPM scripts it may not be triggered,
then open a `Javascript Debug Terminal`, where debug is attached to any NodesJS process started
from there.

If the process is started from an external terminal, first open up the debug port,
then use the `Attach to NodeJS` launch option to attach the debug session to the process.

### Tests

_Auto Attach_ works for tests as well. By starting the tests with `npm run test` the
debugger session attached both to the Mocha tests and the GUI-Aggregator as well.
It means breakpoint can be added to tests and the source code as well.

Also there are two related launch mode in VS Code:

- `Run current test file in Backend`: to start running the currently open test file either it contains
  unit, component or integration testcases.
- `Run all tests in Backend`: run all unit and component tests

#### Test Explorer

Other option is to use the (Mocha) Test Explorer extension. If installed it can be accessed
at the left side navigational icons. When selected the left panel will show all mocha tests
for the backend project. (Currently it is not working for GUI tests.)

The tests can be executed at once or one by one. When a test case fails the test file can be
opened with the failing lines highlighted. Also the test file will have inline controls above
test cases or describe blocks to execute or debug them in a more granular way.

Note: the Test Explore executes tests in different NodeJs processes and only gets the result
and the error message for the failing testcase. To get the error message the failing testcase
has to be selected first, it is not visible on the normal output console.

### Remote debugging

To remotely debug the GUI-Aggregator start it in debug mode: `npm run start:debug`.
It starts the server by opening debug port on **9229**.
Then launch the _Attach to GAS..._ debug mode and start your debug session.

?> Check the launch config for proper port and address, as the default is
configured for Kubernetes based debugging.

?> Increase the liveness probe timeout to avoid unwanted restarts.

If the application runs in Kubernetes then the debug port has to be tunneled locally.
For that define a NodePort or use the `kubectl port-forward` command.

The mock service is setup to have configured and tunneled debugging ports.

?> Also check the [Live debugging](./debugging.md) chapter for more options.

#### Generally how-to debug NodeJS app remotely

- start the app in debug mode
  - add the --inspect parameter
  - _note_: by default it binds to localhost, but it can be changed (eg. --inspect=0.0.0.0:9229)
  - it can be defined in the Deployment config
  - _note_: if using `nodemon` too, then be sure that the name of the started script contains the
    extension as well
- tunnel the port locally
  - a. use a NodePort, for this the inspect port must bind to an external ip (or 0.0.0.0)
  - b. forward it by kubectl: `kubectl port-forward *PODNAME* 9229`
- update debug config in launch.json for VSCode
- or use the Chrome Debugger

## Logging

For logging GAS uses the `@adp/base` chassis library which provides a convenient wrapper for
a 3pp log library.

Different categories can be defined when a logger instance is requested. If not provided the default
category is returned. Category can be used to set the log levels separately, so it is possible to
turn on debug log messages only for specific categories avoiding too much or too noisy logs.

To set category levels separately provide the `logLevelCategories` parameter for the logging library
either in the helm values or in the local json config depending on how GAS is started.

### Request logs

There is a specific category for request logs called `requests`. To turn it on set the log level
for the `requests` category to `debug`.

The messages will contain the requested URL and the overall response time measured by ExpressJS.
In case of proxy requests the proxied URL and the response time for fetching the proxied content will
be logged separately.

These are useful to find network bottleneck or slow response during a load test.

## Configuration

Several configuration options are available for the application. Generally these config files
are mounted as Kubernetes configmaps into the pods and generated by helm or other
services. The JSON files are generated by Helm templates from yaml, typically defined
in the values.yaml. Every config file has an internal JSON format and an external yaml format
used in Helm. Here you will find reference for the internal JSON formats.

### Runtime

The application reads its configuration from json files at startup.
The **default** configuration `backend\config\backend-service-config-default.json`
is deep-merged with the runtime configuration. The **runtime** configuration is read from
`backend\config\backend-service-config\backend-service-config.json`.
When deployed with Helm a configmap is mounted to this location overwriting the files
in that directory.

This is the current content of the configuration, but always check the above jsons as
_this example may be out of date_.

```json
{
  "k8sLabelPropertyName": "ui.ericsson.com/part-of",
  "k8sLabelValue": "workspace-gui",
  "k8sExternalUrlAnnotation": "ui.ericsson.com/external-baseurl",
  "k8sQueryServiceEnabled": true,
  "configQueryProtocolAnnotation": "ui.ericsson.com/protocol",
  "configQueryPortAnnotation": "ui.ericsson.com/port",
  "appNameLabel": "app.kubernetes.io/name",
  "appVersionLabel": "app.kubernetes.io/version",
  "logging": {
    "defaultLogLevel": "info",
    "serviceName": "eric-oss-help-aggregator",
    "stdout": {
      "enabled": true,
      "format": "text",
    },
    "filelog": {
      "enabled": false
    },
    "jsonTCPLog": {
      "enabled": false,
      "host": "eric-log-transformer",
      "facility": "local0"
    }
  },
  "faultIndications": {
    "enabled": false
  },
  "ingressHost": "localhost",
  "ingressPort": "80",
  "discoverIngress": false,
  "useHttps": false,
  "verifyClientCertificate": "optional",
  "enforcedTLS": "required",
  "dependencies": {
    "gasIam": {
      "serviceName": "gasIam",
      "enabled": false,
      "iamServiceName": "eric-sec-access-mgmt",
      "realmName": "oam",
      "audience": "adp-iam-aa-client",
      "tls": {
        "sendClientCert": true,
        "verifyServerCert": false
      }
    },
    "logtransformer": {
      "enabled": true,
      "tls": {
        "verifyServerCert": true,
        "sendClientCert": true
      }
    },
    "prometheus": {
      "enabled": true,
      "appName": "eric-adp-gas",
      "endpointsToCountRequests": [
        "/ui-meta/v1/apps",
        "/ui-meta/v1/groups",
        "/ui-meta/v1/components",
        "/ui",
        "/ui-serve/v1/import-map",
        "/ui-serve/v1/list-packages",
        "/ui-logging/v1/logs",
        "/gas-internal",
        "/ui-serve/v1/static"
      ],
      "tls": {
        "verifyServerCert": false,
        "sendClientCert": false
      }
    },
    "faultHandler": {
      "enabled": false,
      "tls": {
        "verifyServerCert": true,
        "sendClientCert": true
      },
      "hostname": "eric-fh-alarm-handler",
      "tlsPort": 6006,
      "httpPort": 6005,
      "serviceName": "eric-adp-gui-aggregator-service"
    },
    "internalUi": {
      "enabled": true,
      "tls": {
        "verifyServerCert": true,
        "sendClientCert": true
      }
    }
  }
}
```

### External apps

The application gives opportunity to handle and show external applications in the launcher.
These applications can be configured manually in Helm charts and the config is read from `backend\config\backend-service-config\manualconfig.json`.

Example for the manualconfig.json:

```json
{
  "apps": [
    {
      "descriptionLong": "Dummy external app for testing purposes.",
      "groupNames": ["ecm"],
      "tags": ["super", "fast"],
      "displayName": "Nova Explorer",
      "route": "http://localhost:9999/nova-explorer",
      "version": "1.0.0",
      "name": "nova1"
    },
    {
      "type": "external",
      "descriptionLong": "Dummy external app for testing purposes.",
      "groupNames": ["ecm"],
      "displayName": "Nova Explorer Standalone - Very Long External Application Name",
      "url": "http://localhost:9999/nova-explorer-standalone",
      "version": "1.0.0",
      "name": "nova2"
    }
  ],
  "groups": [
    {
      "descriptionLong": "Dummy external category for testing purposes.",
      "type": "category",
      "tags": ["great_group"],
      "displayName": "Nova explorer group 1",
      "version": "1.0.0",
      "name": "nova1"
    }
  ]
}
```

### API Config

The `backend/config/api-config.json` contains the URL configs for the different API endpoints.
It is split by the main APIs, and each API has a `prefix` and `routes` attribute.
This file is used by GAS internally.

There is a copy at `frontend/src/config/api-config.json`, as at docker build only the
frontend folder is copied into the image. There is a unit test in GAS to check the consistency
between these files.

#### Helm config

Note: required attributes must be filled out.

- For applications these are: `displayName`, `version`, `route`/`url` and `name`.
  If application `type` is
  - 'external' `url` is required
  - 'internal' `route` is required.
- For groups these are: `displayName`, `version` and `name`.

Example for the yaml format in values.yaml:

```yaml
manualconfig:
   apps:
    - displayName: "Nova Explorer"
      route: "http://localhost:9999/nova-explorer"
      version: "1.0.0"
      name: "nova1"
      descriptionShort: "Short description"
      descriptionLong: "Dummy external app for testing purposes."
      groupNames:
        - "novap"
      childNames:                           # List of child applications by 'name'. Child apps are
                                            #    displayed with the parent app,
        - 'nova1'                           #    becoming visible after the parent (list item, or
                                            #    app card) is expanded.
                                            #    Note: only the direct children are displayed with
                                            #          the parent app!
      tags:
        - "super"
        - "fast"
      acronym: "NE"
      priority: 2
    - displayName: "Nova Explorer Standalone - Very Long External Application Name"
      route: "http://localhost:9999/nova-explorer-standalone"
      version: "1.0.0"
      name: "nova2"
      descriptionShort: "Short description"
      descriptionLong: "Dummy external app for testing purposes."
      groupNames:
        - "ecm"
        - "eea"
      type: "external"
      color: "purple"
      acronym: "NES"
  groups:
    - displayName: "Nova explorer group 1"
      version: "1.0.0"
      name: "nova1"
      type: "category"
      descriptionShort: "Short description"
      descriptionLong: "Dummy external category for testing purposes."
      tags:
        - "great_group"
      color: "red"
      acronym: "NEG"
    - displayName: "Nova explorer product"
      version: "1.0.0"
      name: "novap"
      type: "product"
      descriptionShort: "Short description"
      acronym: "NEP"
```

### REST API HTTPS

The webservice can be started with HTTPS on by setting the `useHttps` in the runtime config to `true`.
For that the service requires TLS certificates which shall be mounted to the
`/run/secrets/sip_tls` directory. The service will
watch for certificate changes and reconfigure the server with the new files.

The certificates can be generated by the `eric-sec-sip-tls` ADP service. The CI Chart contains the
required components as requirements:

- eric-sec-key-management
- eric-sec-sip-tls
- eric-data-distributed-coordinator-ed

To install them set the `eric-sec-sip-tls.enabled` to `true` in the `values.yaml`.
If necessary execute a helm repo update.

If using tilt set the `isCiChartDeployed` attribute to false in the tilt config to deploy the CI chart.

### Internal mTLS

The internal communication can be also secured with TLS by setting `global.security.tls.enabled` in
the `values.yaml` to true.
For that the service requires TLS certificates which shall be mounted to the
`/run/secrets/<target-service-name>` directory. The service will
watch for certificate changes and reconfigure the service with the new files.

The certificates can be generated by the `eric-sec-sip-tls` ADP service the same way as for
[REST API HTTPS](#rest-api-https).
For more information, see:
`https://adp.ericsson.se/marketplace/service-identity-provider-tls`

## Introduce new target service with internal mTLS

Internal communication in a K8s cluster can be protected by TLS.
The SIP/TLS microservice generates and renews the required certificates and keys that are needed to establish
a cluster internal TLS connection between a Service Provider and a Service Consumer.
K8s Secrets are used as the distribution mechanism for the keys and certificates.
The Service Providers (servers) and Service Consumers (clients) can mount these secrets to their file
system in order to access the files.

In GAS the CertificateManager reads and watches the certificates based on the
`configuration.dependencies` section of the helm config.
The `eric-log-transformer` direct logging integration provides an example how TLS certificates can
be configured and used.

The following steps are required:

### Define SIP/TLS client InternalCertificate

An InternalCertificate K8s resource should be created to provide the client certificate for
the server (Example: sip-tls-log-transformer-client-cert.yaml).\
The `certificate.issuer.reference` should be set to the primary Certificate Authority (CA) of the
given service.\
CertificateManager expects that the `kubernetes.certificateName` is set to `cert.pem` and the `kubernetes.privateKeyName`
is set to `key.pem`.

Example of a client InternalCertificate (without metadata annotations):

```yaml
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if $global.security.tls.enabled }}
apiVersion: siptls.sec.ericsson.com/v1
kind: InternalCertificate
metadata:
  name: {{ include "eric-adp-gui-aggregator-service.name" . }}-service-name-client-cert
spec:
  kubernetes:
    generatedSecretName: <secret_name>
    certificateName: cert.pem
    privateKeyName: key.pem
  certificate:
    subject:
      ## The Subject Common Name (CN) of the certificate.
      ## This typically corresponds to the domain name of the service or a client identifier.
      cn: {{ include "eric-adp-gui-aggregator-service.name" . }}
    subjectAlternativeName:
      populateKubernetesDns: false
    issuer:
      ## The identifier for the Issuer CA. Decides from which CA to request the certificate.
      reference: eric-log-transformer-input-ca-cert
    extendedKeyUsage:
      tlsClientAuth: true
      tlsServerAuth: false
{{- end }}
```

### Mount K8s Secrets

A K8s Secret should be mounted with the same name as defined in the `kubernetes.generatedSecretName`
property of the client certificate.\
CertificateManager expects the certificates and keys to be mounted under the
`/run/secrets/<service_name>` directory.

Example volumes/volumeMounts config of the related Secret in the `deployment.yaml` file:

```yaml
volumeMounts:
  {{- if $global.security.tls.enabled }}
  - name: service-clientcert-volume
    mountPath: /run/secrets/<service_name>
    readOnly: true
  {{- end }}
volumes:
  {{- if $global.security.tls.enabled }}
- name: service-clientcert-volume
  secret:
    secretName: <secret_name>
{{- end }}
```

The common ADP services can be authenticated using the `eric-sec-sip-tls-trusted-root-cert`
which is already added to the helm config. If the Service Provider requires a different certificate,
it should also be added and mounted in the helm config.

### Add dependencies config to the `values.yaml`

CertificateManager expects TLS enabled services to have a TLS configuration section
under `configuration.dependencies`.

Also CertificateManager only loads certificates for services where the `enable` attribute is true.
Depending on the `verifyServerCert` and `sendClientCert` attributes, different set of certificates
are handled by CertM.

The expected format of the TLS config of any new service:

```yaml
configuration:
  dependencies:
    <service_name>:
      enabled: true # set it if the dependency is needed
      tls:
        verifyServerCert: true # optional, default value is true
        sendClientCert: true # optional, default value is true
```

### Using the certificates

If all the above steps are configured properly, keys and certificates should be available by CertificateManager.
It creates a `tlsAgent` object with a `secureContext` object in its `options` property using the certificates.
This object contains the certificates and other TLS related settings for the communication.
The tlsAgent can be accessed by `getTlsAgent(serviceName)` method.

### Testing in remote cluster with internal TLS enabled

To test in remote cluster with live dependencies, check the [Remote Dev Env](remote-dev-env.md) Guide.

Enable SIP-TL, Global mTLS and Logtransformer in the CI `values.yaml`.

## Test considerations

There are different level of tests which requires different techniques. Generally everything
shall be tested on the lowest possible level, as it gives the quickest feedback.

### Test framework

The Mocha test framework is used for organizing and executing tests for NodeJS.
Tests and related utilities are under the `tests` directory, generally every `*.js` file
is considered as test suite and will be executed if not specified otherwise.
The framework can be configured by editing the `.mocharc.js` file.

Also GAS has some execution mode dependant logic, which checks for the `NODE_ENV` env variable.
For test runs it is advised to set the `NODE_ENV=test`. The test executor npm scripts set it,
so these are the preferred way to execute tests.

!> Please minimise the number of logic which runs differently in tests.

With the default settings of Mocha the test execution waits for every background process to stop.
This means open sockets, running promises and other asynchronous operations. If tests do not clean up
the components then Mocha will never stop.
Although there is an option to forcefully stop processes when all tests are executed, it is not
advised to do so, as it can cover potential issues.
Instead, to avoid CI to hang in these cases an overall timeout is added to the test executor scripts.

!> To start tests with this timeout use the `npm run test:*:timeout` npm scripts.

Some testing tips:

- `.only`, `.skip` modifiers can be added to `describe` and `it` blocks to set explicitly what to run

### Unit tests

Unit tests are under the `tests/unit` folder.

The main goal of a unit test is to test js modules in _isolation_.
Every module has an exported API, these methods shall be tested by tests. Good unit tests can describe
how a given API call shall behave, so it can help other developers to understand the code better.

### Component tests

Component tests are under the `tests/component` folder.

Component tests are higher level tests to test interactions between real module implementations.
As these tests can depend on the internal module implementations it can make them fragile,
so it is preferred to move as many test cases to unit level as possible.

### Integration tests

The backend integration tests are in the root of the git repo in the integration-tests/test/backend folder.

Integration tests of the backend are tests ensuring the backend integration into the Kubernetes cluster
e.g. all services deployed to the K8s cluster are discovered.

### Mock dependencies

For mocking module dependencies the [testdouble](https://github.com/testdouble/testdouble.js) library
is used. It is preferred to mock all or most dependencies otherwise tests will be fragile.
And mock the direct dependencies not transitive ones if possible.

> Example: `ConfigManager` reads json files with the `fs` module. If there is a module depending on
> `ConfigManager`, then it may be a simple solution to mock `fs` to return the awaited json files.
> However it is recommended to mock the `ConfigManager` instead, as any changes in its implementation
> may break tests of other modules.

### Mock properties

For mocking properties need to use `td.replace` to automatically replace properties if they're
referenced on an object. But by default mocked function are copied
from real function and mocked function doesn't contain the logic of real function. If it is
necessary to call a real function and don't need to use `td.when()` functionality then
`td.spyProp()` method can be used. But if it is needed to use `td.when()` then
`td.func()`, `td.replace()` methods can be used for configuring calling real function.

Example:

```javascript
const pmServiceMock = {
  createMetric(metricName) {
    console.log('This function is called');
    return metricName;
  },
};
it('mocking createMetric property', () => {
  const createMetric = pmServiceMock.createMetric.bind(pmServiceMock);
  pmServiceMock.createMetric = td.func(createMetric);
  pmServiceMock.createMetric('name');
  td.verify(pmServiceMock.createMetric('name'), { times: 1 });
  td.reset();
});
```

or use `td.replace()`

Example:

```javascript
const pmServiceMock = {
  createMetric() {
    console.log('This function is called');
  },
};
it('mocking createMetric property', () => {
  const createMetricSpy = td.replace(
    pmServiceMock,
    'createMetric',
    pmServiceMock.createMetric.bind(pmServiceMock),
  );
  createMetricSpy();
  td.verify(createMetricSpy(), { times: 1 });
  td.reset();
});
```

### Mock filesystem

There are modules which reads files from the filesystem. [Mock-fs](https://github.com/tschaub/mock-fs)
is a mock framework to mock the entire filesystem with an in-memory fs.
However it conflicts with `testdouble`, better not to use both.

`testdouble` also can be used to mock filesystem operations, by mocking the `fs` nodejs module.

```javascript
const const fsMock = ({ manualConfig }) => ({
  readFileSync: (filePath) => JSON.stringify(manualConfig),
});

it('mocking fs', () => {
  await td.replaceEsm('fs', fsMock({ manualConfig: 'file Content' }));
  configManager = (await import('../../config/configManager.js')).default;
  configManager.updateManualConfig();
  td.reset();
});
```

### Mock network requests

GAS modules use the `node-fetch` library to make requests. In these cases it is enough to mock
the library with `testdouble`.

There are 3pp modules which uses native NodeJS requests. To cover these cases the [nock](https://github.com/nock/nock)
npm mock library was introduced.

By default when a mock is defined by `nock`, it creates an interceptor, which has an expectation,
that the endpoint is called exactly once.
To change this behavior check [Expectations](https://github.com/nock/nock#expectations).

A simple example which sets up an interceptor before each tests and clears them after them.

```javascript
describe('Static Serve endpoint', () => {
  beforeEach(() => {
    nock('https://domain1:4000').get('/config.json').reply(200, { myconfig: 'myconfig' });
  });
  afterEach(() => {
    nock.cleanAll();
  });
  it('returns 200 if service and file is found', async () => {
    await request
      .get(`https://domain1:4000/config.json`)
      .set('Accept', 'application/json')
      .expect(200);
  });
});
```
