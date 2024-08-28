<!-- markdownlint-disable MD024 -->

# Test specification

## Test levels

Describe the materialization and the test terminology of the test levels in this project at high level.

### Unit testing

A unit test exercises the smallest piece of testable software in the application to determine
whether it behaves as expected. Unit tests are typically written at the class level or around a
small group of related classes. Finally the most important in this level, the unit under test is
isolated from its collaborators.

For the frontend part this project has web component based EUISDK components as units. Every UI component
and panels are tested as a `@eui/lit-component` unit. On the other hand the UI project has a utility
layer where a relevant part of the business logic can be found. These util javascript modules
contain pure logic without any UI visualization. These are tested per class as a unit.

For the backend part this project has service classes and a kind of static functions without state
as units.

Unit tests are executed during the precodereview (and the drop) pipeline execution for each commit
patchset (and merge).

The used test frameworks/tools to create & run & report tests and results are the followings at this
level:

- `mocha`: Mocha is a feature-rich JavaScript test framework running on Node.js and in the browser,
  making asynchronous testing simple and fun.
- `chai`: Chai is an assertion library, similar to Node's built-in assert.
- `sinon`: Standalone test spies, stubs and mocks for JavaScript.
- `fetchMock`: Mock http requests made using fetch
- `nock`: Mock http requests made using Nodejs requests
- `testdouble`: The right way to mock dependencies in Node.js or webpack environment.
- `mock-fs`: The mock-fs module allows Node's built-in fs module to be backed temporarily by an
  in-memory, mock file system
- `mochawesome`: Mochawesome is a custom reporter for use with the JavaScript testing framework, mocha.

### Component testing

Unit testing alone doesn't provide guarantees about the behaviour of the system. Up till now we have
good coverage of each of the core modules of the system in isolation. However, there is no coverage
of those modules when they work together. To verify that each module correctly interacts with its
collaborators, more coarse grained testing is required and this is the relevant test level what is
called as component testing in this project.

There are two components in this microservice: frontend component and the backend
component. In this level a component is started such a way, where all of the classes are
integrated and work together to achieve the required functionality.

The frontend component is UI tested with selenium as a started docker image with a started mock
service.
The backend component is tested as a whole with in-process component test technics, where all the
"adapter" classes are switched with a mock version.

Component tests are executed in the precodereview and the drop pipelines too.

The used test frameworks/tools to create & run & report tests and results are the followings at this
level:

- `mocha`: See the description above
- `wdio`: Next-gen browser and mobile automation test framework for Node.js
- `supertest`: High-level abstraction for testing HTTP, while still allowing you to drop down to the
  lower-level API provided by superagent
- `seleniumgrid`: Selenium Grid is a part of the Selenium Suite that specializes in running multiple
  tests across different browsers, operating systems, and machines in parallel.
- `fetchMock`: Mock http requests made using fetch
- `nock`: Mock http requests made using Nodejs requests
- `testdouble`: See the description above
- `chai`: See the description above

### Integration testing

An integration test verifies the communication paths and interactions between components to detect
interface defects. These tests collect modules together and test them as a subsystem in order
to verify that they collaborate as intended to achieve some larger piece of behaviour.

For the backend in this project this means communication with the discovered APIs and the Kubernetes
API to achieve the required business logic. On the other hand it means communication towards the
generic ADP services too.

For the frontend this means in the Kubernetes cluster it can work together with the backend and the
authentication and authorization generic service as well.

Integration tests are executed during a drop pipeline and the adp application staging pipelines
after each commit is merged in.

The used test frameworks/tools to create & run & report tests and results are the followings at this
level:

- `mocha`: See the description above
- `wdio`: See the description above
- `chai`: See the description above
- `seleniumgrid`: See the description above
- `supertest`: See the description above

## All functional test categories

Describe the test materialization of the functional requirements in high level. High level means
that all requirements are categorized and the following chapters describes the "how is it tested" to
all category. These categories can be called test conditions if you would like to follow the istqb
definitions.

Unit test level is used in all cases, so it is not highlighted every time.

### All UI features testing

Current status: tested

There are several UI features. On the other hand they are tested in the same way in high level,
so this chapter aggregates them.

#### Description

| Feature               | Description                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| App state is stored   | All application card have more states (eg. favorite, recent state), and they are persisted and shown in the correct lists.          |
| Keyboard navigation   | Starting from the main page the user can navigate and toggle filters by keys.                                                       |
| Search functionality  | Search by tags, description or name. Navigation towards directly to the app or system page from the result list.                    |
| Main page             | Show products as a card list and helps to navigate towards the system pages or the top highlighted (eg. favorites, recent) apps     |
| Expanded app card     | An app card can show their child apps in the same card. Only one deep hierarchy is supported                                        |
| Application grouping  | Application can be grouped by system views at first level, on the other hand can be grouped by alphabetically or app categories too |
| Application filtering | Currently applications can be filtered only by the favorite attribute.                                                              |
| Global navigation     | From the system bar the global navigation panel can be opened, which contains a narrow version of the launcher                      |

#### Test instructions

Every UI component - what are introduced to achieve the above features - are tested individually in
unit testing and together at component level as it described above in the Test levels chapter. At
component level the mock data contains more products and more applications per products. On the
other hand the applications have child apps too to cover all of the features.

At integration level there are only minimal selenium tests to test that every app cards are visualized
what are provided and discovered by the backend. On the other hand it is important to check whether these
functionalities can work with the real backend API with real response times, etc.

### Configuration feature testing

Current status: mostly tested, some configuration types are not tested with negative tests

#### Description

There are several configuration which has effect on the behaviour of the service. These
configurations are summarized in the following table:

| Configuration type              | Description                                                                                              | Source of the configuration |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------- |
| Deployment configuration        | All of the configuration what can be checked in the Configuration chapter of Service User Guide document | chart values / configmap    |
| Manual system configuration     | It is supported to set manually the products and applications what should be visualized on the GUI       | chart values / configmap    |
| Discovered system configuration | It is supported to get all the products and applications from other services from specialized endpoint   | Discovered API              |

The service should validate all of them and use default values to every possible input in case of
the input is invalid. All of the configurations are replaced in case of any changes in the source
(except the configuration from the discovered api).

The service should react to all K8s events which belongs to the discovered api category.

#### Test instructions

Should be tested at component level and integration level too. All of the configuration can be
tested at component level, because the sources can be mocked:

- configmap mounts can be replaced by mocked fs,
- K8s API watch mechanism can be mocked by mocking the K8s adapter class from the component.

On the other hand it is not 100% that the K8s API works as the same as the K8s adapter
required it, so the integration test is required too check it too.

Negative tests are required to every tests typically and it is crucial in case of the configuration testing.

### Service discovery feature testing

Current status: tested

#### Description

The main feature of this launcher service to visualize the configured products and their
applications. To get this information the backend service can fetch configurations from manually
created kubernetes configmap and can fetch from automatically discovered services.

The source services should provide a `/config.json` endpoint where the configuration is stored. The
GAS Light service fetches those endpoints what are annotated with the configured label.

The discovered endpoints are polled at the GAS Light service start and every times when the target
service is replaced in the kubernetes environment.

#### Test instructions

Should be tested in component level and integration level too in real K8s environment. In component
level the K8s adapter is mocked to emulate service annotations and the target service caller adapter
is mocked too with some test config.json.
In integration level there are deployed mock services and the whole feature is tested over real
kubernetes and real network.
The GAS Light service `/apps` and `/groups` endpoints are called in both test levels and exact answer
is expected (should be calculate from the target mock/real `/config.json` endpoint content).
The `/services` endpoint is called with valid and invalid services, and exact answer is expected based
on the criteria.

### Module serving feature testing

Current status: tested

#### Description

The other main feature of GAS to proxy and serve ui modules and assets from discovered services
to support the Microfrontend solution. Also GAS has to generate a merged import-map for
the browsers to help them find where each module is.

To get the necessary information the backend service can fetch configurations from the
automatically discovered services.

The source services should provide a `/config.package.json` endpoint where the configuration is stored.
The GAS Light service fetches those endpoints what are annotated with the configured label.

The discovered endpoints are polled at the GAS Light service start and every times when the target
service is replaced in the kubernetes environment.

#### Test instructions

Should be tested in component level and integration level too in real K8s environment. In component
level the K8s adapter is mocked to emulate service annotations and the target service caller adapter
is mocked too with some test config.package.json.
In integration level there are deployed mock services and the whole feature is tested over real
kubernetes and real network.
The GAS Light service `/ui-serve/v1/static` and `/ui-serve/v1/import-map` endpoints are called in
both test levels. It expects that the static endpoint can serve static files from the domain services.
And the import-map is the aggregation of the config.package.json files.

### mTLS feature testing

Current status: not tested (only the credential class is unit tested)

#### Description

Mutual TLS is an encrypted authentication and authorization protocol in machine-to-machine
communication. This kind of communication should be configurable in two dimension. One dimension is
whether the TLS is on or off, and the other one is the client certificate is validated or not in
case of the TLS is on.

The Gas Light service communicates with generic services and the ingress controller and the target
services `/config.json` endpoints. Every GAS Light service endpoints should be configurable in the above
dimensions, but all other communications towards the target services or the generic services are
configurable only in one dimension (mtls or not).

In these communications the backend service should provide the correct client certificate or
validate the consumer service client certificate.

#### Test instructions

Should be tested component and integration level too.
In component level the backend service cert file mounts should be mocked with generated certificates.
The test should call the service endpoints with certificate which is signed by the correct CA.
The endpoints should not allow requests with not correctly signed certificate. On the other hand
tests should cover the certificate replaces too, because the SIP/TLS ADP service changes the
certificates periodically and the service should follow that.

In integration level the mTLS should be tested in the e2e communications which means that the GAS light
service can communicate towards the generic services and the target services and can get requests
from the ingress controller.

### Logging feature testing

Current status: tested in low level (unit testing the logging class), not tested in component
level and integration (adp staging) level yet

#### Description

In this feature the microservice shall record discrete events with some context information under
normal and abnormal operations and sending it towards the ADP Log Transformer's JSON-TCP interface.

Audit logging is not yet supported in this service.

#### Test instructions

Logging should be tested at more level, because there are requirements about what types of events
should be logged, so it is not enough to test only the logging class, the logged content should be
tested during the component run.

- Testing in component level by mocking the Logtransformer sender adapter in the
  backlog service. Tests should check whether the configuration changes are logged, on the other hand
  the effect of the log level changes and the audit logging after every endpoint call too.
- GUI component tests to check whether the GUI sends the logs towards the log endpoints.
- Integration tests to check whether the log entries are appear in the log transformer and they have
  meta information too. The content is not relevant in this test case only the fact, that the log entry
  exists. This should be tested in the ADP staging.

### Performance monitoring feature testing

Current status: not implemented, because the service currently does not support it.

#### Description

In this feature the microservice shall collect the metrics and any additional aspect related to
performance monitoring and promote it on a dedicated endpoint.

#### Test instructions

The content of the metrics and the schema should be tested at component level calling the metrics
endpoint on the backend service. On the other hand the final integration should be tested too in one
of the application staging, potentially in the ADP staging. In this integration testing only check
that one of the metric is polled by the ADP PM service calling by the Prometheus endpoint.

### Authentication and authorization feature testing

Current status: not implemented, because the service currently does not support it.

#### Description

In this feature the microservice shall handle login/logout and RBAC (role based access control)
towards the protected endpoints and the single page application URL too.

#### Test instructions

Under discussion, because the final solution is not chosen yet. On the other hand the test flow
should be played through the authentication flow. Depends on the solution the tests should be
created on component or integration level. The best scenario would be tested this functionality in
the adp staging or any application staging with UI selenium tests and end point tests.

## All non-functional test categories

Describe the test materialization of the non-functional requirements in high level. High level means
that every technical scopes, relevant rules and frameworks are defined to all category.

### Install test and upgrade testing

Test implementation status: Tested.

Install test means a clean install of the service, where all of the resources are deployed as a
first time.
Upgrade test means an upgrade from the previous release version to the actual drop version.

The install and the upgrade test is created with the test.py from the ADP `bob-py3kubehelmbuilder`
enabler tool in the precodereview and the drop pipelines. The upgrade and the installation tested
with the delivered values.yaml default configuration. Test validates the followings:

- Helm chart can be deployed without any error.
- The service liveness and readiness state is good.

This service is stateless, so most of the case the upgrade could not be a problem, but it should be
tested because if there are any not handled non-backward compatible changes in the service
configmap, then the rolling upgrade can be stuck.

## Rollback testing

Test implementation status: not implemented.

Rollback is a required process in case the current state of the Deployment is not stable due to the
application code or the configuration. In this case the customer can undo the actual release or can
rollback to one of the previous revision.

This microservice is stateless currently, but a rollback could be a problem because of the configmap
changes between two version.

To test a rollback the best procedure is to call `helm rollback` from the actual drop version to the
latest release. The test validates the success state of the rollback. If the rollback can done
without any issues then it means the service can handle the configmap invalid state to the actual version.

## Scaling testing

Test implementation status: on-going in ADP staging.

Kubernetes provides manual and auto scaling, but this service currently supports only the
manual scaling.

During a scaling test the service can be scaled in and out to achieve the desired number of
replicas. At the end of the process all of the pods shall be in ready state.

This kind of test is [provided][1] in the ADP staging.

### Load testing

Test implementation status: not implemented.

Load testing is the simplest form of performance testing. A load test is usually conducted to
understand the behaviour of the system under a specific expected load.

In case of this project this load is the expected concurrent number of users on the application
performing a specific number of transactions within the set duration. This test will give out the
response times of all the important business critical transactions. The service is monitored during
the test, this will assist in identifying bottlenecks.

The load test driver for this project is the [k6 tool](https://k6.io/).

It is tested in a kubernetes in an environment with mock stub services, because the discovered
services should not affect the results. Scenario is the following (VU means virtual user):

1. rumps up to 30 VUs during 1m then
2. up to 100 VUs during 2m, then
3. stay on 100 VUs during 1m, then
4. down to 0 VUs during 2m

The measured response times and memory and cpu usage are saved and checked between all drops to
raise error in case of an unexpected peak after a wrong implementation.

### Robustness & Resiliency testing

Test implementation status: not implemented and partially fullfilled by ADP tests

Robustness is the ability of a system to cope with errors during execution and cope with erroneous
input.
Resilience is the ability to provide and maintain an acceptable level of service in the face of
faults and challenges to normal operation.

These kind of testing can be performed at component testing level with the best precision, because
all kind of network errors and configuration errors can be emulated best on that level.

On the other hand this kind of tests are provided in the ADP staging as well as a [minimal][1] with
[pod management][2]:

- Robustness: single service instance failure test
- Resilience: all instance failure at the same time for the service

### Stability testing

Test implementation status: on-going in adp staging and adp never down staging.

Stability Testing is the process for determining whether the service is able to keep the liveness
status and there is no any restart during a long period. During this period the environment should
be changed sometimes and the service endpoints polled periodically.

In case of this service the best environment changes to deploy or replace the actual discovered
services with new ones.

On the other hand testing the service above more environments can be called stability testing too
and this is fulfilled in the ADP staging, because every service tested above KaaS, NFVI, EKS.

The ADP [never down staging][2] seems to be a correct stability testing environment, because the
deployed service never deleted, just upgraded in that environment.

[1]: https://adpci.sero.wh.rnd.internal.ericsson.com/site/test_specs/Adp_Test_Specification.html
[2]: https://eteamspace.internal.ericsson.com/display/ACD/ADP+Staging+Test+Scope
