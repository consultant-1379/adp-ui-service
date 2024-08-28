# Application Developer Guide

[TOC]

## Overview

GUI Aggregator Lightweight (GAS Light) implements multiple use cases to support dynamic UI
application integration at the client side.

## Domain Service Autodiscovery

The main use case for GAS Light is to discover domain UI services, fetch and aggregate their
provided configuration, and provision this overall configuration to the client container
and Portal application.

**Note:** Autodiscovery only works within the same Kubernetes® namespace due to security reasons.

### Autodiscovery Behavior

The backend service uses the Kubernetes `Watch` API for autodiscovery. When deployed, it subscribes
to `Service`, `Endpoint` and `Pod` changes. Previously added resources also trigger an **ADDED**
event so they are discovered automatically as well.

When a `Service` is discovered and has the required [label](#label), GAS Light waits for a related
`Endpoint` resource to appear. It indicates that a `Pod` is connected to the `Service`, so the metadata
files can be fetched.

Then GAS Light tries to [fetch configuration](#fetch-configuration) from the `Service`.

Once the files are fetched GAS Light instances cache them in memory. If there is a **CHANGED** event
on the corresponding Kubernetes resources, the files are re-fetched from the `Service`.
When Helm® deployments are upgraded, it triggers **CHANGED** events on the managed resources.
Then the metadata files are also re-fetched.

If the config files should be refreshed manually use the following solutions:

- [Manually Refresh Configuration](#manually-refresh-configuration)
- [Refresh Endpoint](#refresh-endpoint)

### Label

The service checks the `ui.ericsson.com/part-of: <workspace-name>` label on `Service`
type resources during autodiscovery. The **workspace-name** can be customized in GAS Light Helm values,
the default value is `workspace-gui`.

A GAS Light instance only checks one **workspace-name**, so every domain service must use that
**workspace-name** to be discovered.

To deploy multiple instances of GAS Light (for example, to discover different application sets),
use different labels.

For the proper discovery the `app.kubernetes.io/name` and `app.kubernetes.io/version` labels also
have to be defined as mandated by Ericsson design rules.

### Fetch Configuration

Every discovered `Service` must expose metadata through HTTP or HTTPS as JSON configuration files
according to a specified JSON schemas.

GAS Light tries to fetch metadata files from the `Service`:

- An [Application Configuration](#ui-meta-configuration) at the following URL:
  `<protocol>://<service name>:<port>/<config context>/config.json`
- An optional [Package Configuration](#ui-serve-configuration) at the following URL:
  `<protocol>://<service name>:<port>/<config context>/config.package.json`

The config context can be specified with the `ui.ericsson.com/config-context` annotation. It is optional
and if not set the `/` root path is tried.

The exact protocol and port can be specified by using `ui.ericsson.com/port` and
`ui.ericsson.com/protocol` `annotations` on the `Service`. These are optional, and if not provided,
then GAS Light will use the first defined port on the `Service` and calculates the protocol from
the `global.tls.enabled` setting. If it is set to true, the protocol shall be HTTPS otherwise it
shall be HTTP.

In case of HTTPS, GAS Light uses mutual TLS for secure communication. If applications need
full mTLS for internal communication, then every discovered `Service` should validate
the client certificate of GAS Light against the internal Certificate Authority of GAS Light.
This is available with `eric-adp-gui-aggregator-service-internal-ui-client-ca` Kubernetes secret name.

GAS Light validates the server certificate of each discovered `Service` with the root CA of SIP-TLS.

If the `config.json` file is not available immediately, the backend service tries to fetch it with a
retry frequency which starts with 1 second, then increases exponentially up to 64 seconds until the
file can be accessed.

As the `config.package.json` is optional GAS Light tries to fetch it with a limited number of re-tries.
If the file is not available then GAS Light will assume that the package list is empty for that application.

**Note:** The `config.json` and `config.package.json` files are validated against their schemas.
If there are validation errors, the application is ignored and the errors are logged by GAS
Light.

#### Metric for in-progress fetch loops

To monitor the in-progress fetch loops there is a custom PM Metric:

**Metric name:** `eric_adp_gas_light_sum_of_retry_counters_of_in_progress_fetch_loops`
**Job:** the sum of retry counters of in-progress fetch loops

After a `Service` is added or modified, a fetch loop is started, and the counter is increased by 1.
Normally, after a few seconds the fetch is successful, and the counter is decreased by 1.
If the fetch attempt is unsuccessful, the counter remains higher until it succeeds.
Admins should monitor this gauge, and take action if it does not come down within a reasonable time.

### Manually Refresh Configuration

GAS Light watches the `Services` and `Pods` of the Domain service. If a change notification is triggered
for any of them GAS Light will re-fetch the configuration files and updates its internal state.
This is suitable for most static GUI applications which are only changed during upgrades.

However there may be cases when configuration changes runtime outside of a system upgrade.
In this case a change event should be triggered on the `Service` to notify GAS Light about
the change.

The recommended way is to annotate the `Service` with a custom `Annotation`.
It is important that the value of the annotation is different from the previous one otherwise Kubernetes
will not trigger any change event. Depending on the use-case it can be done programmatically via the
Kubernetes API.

For example using [kubectl annotate](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#annotate)
annotations on any resource can be updated.

### Refresh Endpoint

Another option for refresh is to use the Refresh REST API.
The URL of the refresh endpoint is the following: `/ui-meta/v1/services/{name}`
For detailed usage information check the API documentation.

A PUT request should be sent there with a JSON body. The body of the request needs to contain a
`name` property, with the name of the service as value, which should be refreshed by GAS Light.

The name has to be the same as the `app.kubernetes.io/name` label on the service if it is not a manual
service, or the provided name in the `manualconfig.services` if the service is derived from there.

If there are multiple GAS Light replicas in the cluster, the request will land on one of the Pods,
which will calculate the addresses of the others, and forward the request to those as well.
This way all the Pods will remain in a synced state.

The request returns one of the following:

- HTTP 202 Accepted, if the given service is present and the update can be done.
- HTTP 404 Not Found, if the given service is not present in the cluster.
- HTTP 400 Bad Request, if the request has problems with the payload.
- HTTP 500 Internal Server Error, if the forwarding of the request to other Pods encountered some error.

### User permissions Endpoint

#### Prerequisites

- IAM is configured
- `Values.configuration.userPermission.enabled` is set to `true`

In case of global mTLS is enabled no further modification is needed.

##### Global mTLS is disabled

To enable permission API without global mTLS the following parameters must be set:

- set `Values.configuration.userPermission.nonTLSMode` to `true`
- set IAM hostname in `global.hosts.iam`
- set IAM CA secret name in `global.iam.cacert.secretName`
- set IAM CA secret file name in `global.iam.cacert.key`

**Note:** This mTLS less mode isn't recommended for security reasons, please use
this API with mTLS enabled if possible.

#### API description

The URLs provided are `/userpermissions/v1/userinfo`, `/userpermissions/v1/{realm}/userinfo` and
`/userpermissions/v1/permission`.
For detailed usage information check the API documentation.

A request should be sent to either endpoint to fetch the info from IAM. If the client is not
authenticated the `authZProxy` will redirect to the login page. Once the user is properly
authenticated `authZProxy` redirects back to the user permissions URL.

The endpoint accepts both `access token` and `Cookie` based authentications.

**Important:** In case of `access token` based authentication the token must be requested from the
Keycloak token endpoint with the `scope=openid` parameter to access the `userinfo` endpoint.

The realm is either set in the URL parameter or determined from the authentication cookie. As
a fallback option a default realm name could be configured by helm values with setting
`configuration.userPermission.realmName`. The `/permission` is a POST endpoint, which is capable to
extract the realm name from the request body as well.

The request returns one of the following:

- HTTP 200 Accepted and the IAM endpoint has returned as a JSON object.
- HTTP 401 Unauthorized, if the user is not authenticated, or the user session has expired.
- HTTP 403 Forbidden, if the user has no access right to the resource .
- HTTP 404 Not Found, if the user or the realm is not found in IAM.
- HTTP 400 Bad Request, if the request has problems with the payload.
- HTTP 500 Internal Server Error, if the forwarding of the request to the IAM server encountered an error.

**Troubleshooting:**

In case of Bearer token based authentication if the request returns with 403 error code make sure
that in the request for the Keycloak token endpoint the `scope=openid` parameter is set in the body.

### Network policies

In many deployment the internal network traffic is restricted by [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/).
In these deployments all traffic is denied by default and every connection has to be enabled explicitly.
To enable communication between GAS Light and the Domain services some `NetworkPolicy` must be changed.

Add an `ingress` rule for the `NetworkPolicy` of the Domain service:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  annotations:
    ...
  labels:
    ...
  name: domain-service-network-policy
spec:
  ingress:
  - from:
    ...
    - podSelector:
        matchLabels:
          app.kubernetes.io/name: eric-adp-gui-aggregator-service # match label for GAS
  podSelector:
    matchLabels:
      ... # match label for the Domain Service
  policyTypes:
  - Ingress
```

**Note:** If the refresh endpoint of GAS Light is called from a service from the namespace internally,
then another `NetworkPolicy` for GAS Light should be created to enable the opposite direction `ingress`
traffic.

**Note:** If the `egress` traffic is denied by default then it must be also enabled in the
`NetworkPolicy` resources.

### Manual Service Configuration

If the Domain service cannot use the autodiscovery API, then another option is to define Domain services
manually in Helm values using the `manualconfig.services` attribute.

This contains a list of service descriptor objects with the following attributes:

- `name` : the name of the service
- `URL`: the absolute url from where GAS can reach the service and fetch the config files and
  static assets. Must contain the protocol.
- `version`: the version of the service

This list of services can be manipulated by adding new services, deleting or modifying existing ones.
GAS Light watches this configuration and react to the changes. The services in this list are handled
in a similar way as those discovered by the Kubernetes API.

This option is useful if the Domain service cannot use the autodiscovery API for some reason.
However the autodiscovery method is the preferred way to integrate with GAS Light.

## Portal integration

Once GAS Light fetches and aggregates the metadata from the discovered services, the Portal UI client
container and the Launcher UI application query the latest configurations from the `ui-meta` and
`ui-serve` REST APIs.
Each discovered UI applications are integrated into the Portal (UI Container), based on the provided
metadata.

The Portal and GAS Light are implementing different micro-frontend patterns and using standard
technologies to enable the run-time composition of the different UI Applications and Components.

The Portal follows the [Ericsson Design System](https://eds.internal.ericsson.com/) to deliver a great
UX experience for the end users.

For a generic overview check the [Micro-fronted concepts](https://adp.ericsson.se/marketplace/gui-aggregator-lightweight/documentation/development/additional-documents/microfronted-concept).

### UI Frameworks

Both the Portal and the Launcher is implemented with [E-UI SDK v2](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#welcome),
which is the latest iteration of the internally developed Ericsson-wide UI framework.

The latest version of the SDK is fully aligned with the micro-frontend patterns implemented by GAS Light.
A standalone UI application following the latest examples and recommendation will have a compatible
`ui-meta` configuration which can be directly used for GAS Light integration.

Applications built with E-UI SDK v1 should [upgrade to v2](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#upgrade-guide).
Regarding the GAS Light integration, the new configuration files and the new build tooling are the
most relevant changes.

Applications written in other frameworks may not be deeply integrated, but looser integration is still
possible. As the Portal and the SDK based on web standards UI apps written in different framework
could be deeply integrated into the Portal. However there isn't any working example yet.

### Portal

The Portal is implemented as an E-UI SDK [Container component](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#app-framework/container).
GAS Light provides the Portal configuration via the `ui-meta` REST APIs.
All of the results of `apps`, `groups`, `components` endpoints are used to assemble the `metaData`
configuration for the Portal.

Beyond the generic container functionalities the Portal contains the following components, plugins
and extensions:

**Global Navigation**: it is a system bar action which opens up a global navigation system panel to
show all the available UI Apps grouped by systems and categories. Also provides a search bar
to locate groups or applications.

**User Info**: it is a system bar action which shows the logged in user's name and opens up the user
info panel for more information. This panel may contain link to a configured User Account page or
a logout button, based on GAS Light configurations. To show user information the Authentication must
be configured in GAS Light. For more info check the Service User guide.

**Launcher**: it is the default UI App in the Portal to show the UI Apps grouped by systems and
categories. The content is similar to the Global Navigation.

**Portal Navigation Menu**: the default navigation menu from E-UI SDK extended with a logic,
to only show that navigation subtree, where the currently opened App is.

**Portal Navigation in System Bar**: the title element in the left slot of Portal's system bar offers
navigation possibilities. By default it displays the name of the Portal application, see for example
at the main page of the Launcher application. When opening an application, the title shows
the name of the first matching system group that is configured in the metadata for that application.
Clicking on the system name brings to the system page, while clicking on the Portal title
or the Ericsson logo always directs to the main page.

**Navigation Plugin**: this is watching the app changes and builds the proper tree for the
`Portal Navigation Menu` depending on the currently opened app. Apps can also override the Navigation
Menu tree. To do this, a `portal:set-local-menu` event has to be bubbled from the didConnect() and/or
onResume() lifecycle hooks of any app component, with the desired menu items. The menu description
is an array of elements following the specification of the Standalone Navigation Menu section of the
App Navigation page of the [E-UI SDK manual](https://euisdk.seli.wh.rnd.internal.ericsson.com/euisdk/#app-framework/app-navigation?chapter=standalone-navigation-menu)

Menu items can also be activated by bubbling a `portal:activate-menu-item` event, with the item id.

The following example overrides the menu tree with a main group having 2 child elements: an internal
and an external app:

```js
this.bubble('portal:set-local-menu',
   [
     {
        id: 'main',
        name: 'main',
        displayName: 'APPLICATIONS',
        childNames: [app1, google],
      },
      {
        id: 'app1'
        name: 'app1'
        menuPath: 'app1',
        displayName: 'Some Internal App',
        descriptionLong: 'This will appear as a tooltip for the first app',
      }
      {
        id: 'google'
        name: 'google'
        url: 'www.google.com',
        displayName: 'Some External App',
        descriptionLong: 'This will appear as a tooltip for the second app',
        type: 'external',
      }
   ]
);
```

To activate the first child in the tree, bubble the following event:

```js
this.bubble('portal:activate-menu-item', 'app1');
```

**Authentication Plugin**: this implements the UI side support for integration with
`Identity and Access Management (IAM)` service. Provides functionality to get the user name, last login
time and a generic solution to detect session timeout during `fetch` and `XMLHttpRequest` requests.

The `fetch` and `XMLHttpRequest` native implementations are extended by adding a custom error
handling flow for session expiration. The [Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)
is set to `include` by default for `fetch`. Also the [XMLHttpRequest.withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)
is set to `true` by default for `XMLHttpRequest`. If necessary these can be changed normally by
providing extra options to the request calls.

**AppState Plugin** Recently opened and favorite apps are considered as the AppState which are stored
in the LocalStorage of the browser. AppState values are updated by the AppState plugin. Recent App
events are fired from multiple page actions e.g. card clicks, search bar clicks or opening an integrated
app url. Favorite events are fired by cards or list elements depending on the selected view.
All of these events are detected by the AppState plugin and the LocalStorage is updated.

> **Note** If the Global Navigation component is used in Standalone mode (in an application not
> integrated into the Launcher container) the AppState plugin shall be loaded as it is required for
> recent and favorite app handling.

**Scoped element polyfill**: the Portal uses the [Scoped element polyfill](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#component-framework-registering?chapter=scoped-elements)
to enable the scoped `CustomElementRegistry` support for E-UI SDK. this means all UI Apps integrated
into the Portal must use the scoped `CustomElementRegistry` as described in E-UI SDK documentation.

**ES Module Shim**: the [es-module-shims](https://github.com/guybedford/es-module-shims) enables the
Portal to use the latest web technologies and standards by extending the browser support.

**UI Settings Plugin**: this plugin is designed to manage the GUI settings.
It supports two storage modes, the browser's LocalStorage, and a DB managed by the UI Settings Service.
Each setting will be stored for the logged in user.

The plugin provides three methods: `get`, `set`, and `remove`.

`get( { namespace, key } )`: will return a setting based on the given parameters.
`set( { namespace, key, value } )`: will set a setting based on the given parameters.
`remove( { namespace, key } )`: will remove a setting based on the given parameters.

The `namespace` parameter is a separator for settings, that will group the settings in namespaces.
With the usage of the namespaces each service can handle its own or the common settings.
The common namespace is called `adp-ui-common`.

Currently used namespaces by `GAS` with its settings:

`gui-aggregator-service`: [`appStates`, `groupingType`, `viewType`, `lastLoginTime`, `previousLoginTime`]
`adp-ui-common`: [`theme`]

Also the plugin uses the `BroadcastChannel interface`, that allows communication between
different documents (in different windows, tabs, frames or iframes) of the same origin.
In case of setting change the plugin will send a message on the `ui-settings-change` channel
with the following content:

```js
this.broadcastChannel.postMessage({
  storageKey: { namespace, key },
  newValue: value,
  oldValue,
});
```

Example BroadcastChannel usage:

```js
const broadcastChannel = new BroadcastChannel('ui-settings-change');
broadcastChannel.addEventListener('message', (event) => {
  if (
    event.data.storageKey.key === 'appStates' &&
    event.data.storageKey.namespace === 'gui-aggregator-service'
  ) {
    this.appState = event.data.newValue;
  }
});
```

### UI-meta Configuration

Every service integrating into the Portal, must provide a `ui-meta` config to describe its content.
The `ui-meta` config is a super set of GAS Light and E-UI SDK configurations. E-UI SDK app and component
config can be used for integration as it is, but for some optional extra functionality the config file
should be manually updated.

This configuration file can contain a list of applications, components and groups metadata.
The schema for the metadata attributes is only partially restricted so that it supports various Portal
and Launcher implementations and so as to make it future-compatible.

Check the specification of the [`config.json` (JSON schema) file](https://gerrit-gamma.gic.ericsson.se/gitweb?p=EEA/adp-ui-service.git;a=blob;f=docs/api/ui-meta/specs/gui.domain.web.spec.yaml)
to see all the available options.

Also check the E-UI SDK [App](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#app-framework/app-configuration)
and [Component](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#component-configuration)
configuration guide to see how the Portal uses the different attributes.

The `type` attribute is very important for all entity, as it determines how the Portal handles the
specific item.

Generally these are the logical UI entities which are handled by the Portal and the UI apps and components
implementing Portal functionality.

### UI-serve Configuration

There can be config only cases, but most apps and components needs an actual implementation which
can be loaded by the Portal. The `ui-meta` config contains a `module` attribute for apps and components.
Anytime the Portal should load that entity it will load the shared module referenced by its name.

For headless functionalities, services can deliver shared modules without any related `ui-meta` config.
In that case if other UI Apps knows the name of the module can load it and use its functionalities.

Every shared module must be defined in the `ui-serve` configuration files.
This config is aligned with GAS Light and E-UI SDK, so E-UI SDK applications can use the `config.package.json`
file for integration.

For more options check the [`config.package.json` schema](https://gerrit-gamma.gic.ericsson.se/gitweb?p=EEA/adp-ui-service.git;a=blob;f=docs/api/ui-serve/specs/gui.domain.package.spec.yaml).

### Groups

Group metadata can be used by various UI apps and components to show UI entities in different groups.
The Portal uses group information to show the corresponding system of the actual application
in the system bar.

Group type can be `system` (or `product`, which means the same) and `category`. Products are the
main groups shown in the Launcher or Global Navigation. By jumping to the Product page, only
applications under the selected Product are shown, grouped by `category`.

By default E-UI SDK does not require groups to be defined in the main `config.json`. However
services providing UI Apps or components to the Portal could define groups and group membership by
updating the `config.json` file.

Define the group in the `groups` section and then set the `groupNames` attribute for the app.

```json
{
  "apps": [
    {
      "name": "call_browser",
      ...
      "groupNames": ["eea", "subscriber_troubleshooting"]
    }
  ],
  "groups": [
    {
      "displayName": "Ericsson Expert Analytics",
      "version": "1.0.0",
      "name": "eea",
      "type": "product",
      "descriptionLong": "Ericsson Expert Analytics (EEA) Prodcut",
      "descriptionShort": "EEA"
    },
    {
      "displayName": "Subscriber Troubleshooting",
      "version": "1.0.0",
      "name": "subscriber_troubleshooting",
      "type": "category"
    },
  ]
}
```

**Important**: group names are unique and global identifiers. An app can reference groups from other
service configurations, like a system or a generic category. Always align with UX to determine
which group a service should be assigned to at design time.
The way of group definition and group membership assignment may change in future releases to
support runtime and deployment time changes in group definitions.

Both type of groups (product/system or category) can be hidden by setting the `hidden` attribute to
true. This is an optional attribute which is by default false. Apps that are in a hidden group are
visible in the 'All Apps' view available from the navigation menu.

### Components

The `components` section of the `config.json` can define global and shared UI components. Every component
must have a valid `module` reference to point to the implementation.

Shared components are resolved according to the precedence order:

- Components of type `euisdk*` are preferred to the components with any other type.
- Any component type is preferred more than lack of one.
- Components of equal precedence are resolved in favor of new component.

Depending on the `type` the Portal will handle components differently:

- If the `type` is `euisdk:system` the component is injected as a [System Bar component](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#app-framework/container/system-bar-components).
- If the `type` is `euisdk:plugin` the component is injected as a [Plugin](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#app-framework/container/plugins).

Normal UI components don't need configuration by default, they are handled by the module loading
system.

### Applications

UI Applications can be integrated into the Portal on different levels, but the used UI framework
may limit the possibilities.

The `type` attribute determines how an app is handled by the Portal:

- `external`: External application, no implementation is provided.
- `euisdk`: Embedded E-UI SDK application or Wrapped 3pp application. Needs implementation reference.

### External Application

External application is the loosest integration level. In that case the application defines an
absolute URL in its metadata, and when the user opens that UI app in the Launcher or Global navigation
the browser is redirected to that specific URL (external applications are opened on a new tab in the
browser). The end user leaves the Portal.

External applications are responsible to fulfill all the UX requirement from [EDS](https://eds.internal.ericsson.com/),
and applications can't use the common functionalities provided by the Portal and GAS Light.
The application must expose its own static assets to be externally available.

This integration level can be suitable for applications which are implemented in a different framework,
which is not compatible with E-UI SDK.

This level of integration requires only `ui-meta` configuration, where:

- the `type` must be set to `external`.
- there isn't any implementation config, so the `module` attribute should be omitted.
- the `url` attribute must be set to define where the Portal should redirect when the application is
  selected.

If the value of the `url` is _relative_, then it is resolved based on the
hostname of GAS Light. To support deployments where an application has hostnames that are
different from the hostname of GAS Light, there are extra options.

On the discovered `Services`, there can be optional annotations:

- `ui.ericsson.com/config-context`. This optional annotation can specify a base path for the configuration
  files, and other static assets of the service. If not set, the root context is used as default (`/`).
- `ui.ericsson.com/external-baseurl`. This annotation can contain an absolute URL prefix, which is
  then used as a prefix for every _relative_ `url` defined in the `config.json` file fetched from that
  `Service`. If `ui.ericsson.com/config-context` is also specified, it is appended to the base path.

(**Deprecated**) If `discoverIngress` is set to `true` in the `values.yaml` file, GAS Light fetches
the `Ingress` configuration for every discovered application and tries to resolve the full URL based
on that. **Limitation:** GAS Light supports only the standard `Ingress` resource.
It does not support the `HTTPProxy` based discovery.

(**Deprecated**) If both `discoverIngress` is enabled and the prefix annotation is defined, then
GAS Light first tries to determine the ingress path, and if it is not found, then the annotation is used.

### Wrapped Application

At this level of integration the UI App is partially integrated into the Portal. It involves a simple
wrapper application written in E-UI SDK which opens the target application in an Iframe.
For the end user the application is opened in the Portal at the Application Area, and the layout and
functionalities provided by the Portal remain available for them.

The Iframe is a restricted area in the page so communication between the Portal and the UI App is
very limited, most functionality provided by the Portal or E-UI SDK is not available.

Also the embedded UI App must provide its content without any extra header or footer to avoid
duplicated system bars and panels in the layout.

A 3pp application may provide a JavaScript library to help embedding its UI components into any web page.
In that case the Wrapper Application could use this library to load the necessary UI components.

This level of integration requires:

- an E-UI SDK Wrapper App implementation.
- the corresponding `ui-serve` module config
- and the `ui-meta` config for the embedded UI App with the following attributes
  - `type`: `euisdk`
  - `module`: pointing to the wrapper app's module which implements it

The implementation of the wrapper app can be provided by the service itself.

Example configuration for the default wrapper application provided by GAS Light.

```json
{
  "apps": [
    {
      "displayName": "ADP Marketplace",
      "version": "1.0.0",
      "descriptionShort": "Microservices Marketplace",
      "descriptionLong": "The Microservices Marketplace to help build Ericsson cloud native applications.",
      "name": "adp-marketplace",
      "groupNames": ["adp"],
      "type": "euisdk",
      "module": "wrapper-app",
      "route": "adp-marketplace",
      "options": {
        "url": "https://adp.ericsson.se/marketplace",
        "query": ""
      }
    }
  ],
  "groups": [
    {
      "displayName": "Application Development Platform",
      "version": "1.0.0",
      "name": "adp",
      "type": "product",
      "descriptionShort": "",
      "descriptionLong": "The Application Development Platform (ADP) Framework is the approved way \
      forward for developing cloud native applications within Ericsson, following a moderndesign \
      pattern (microservice architecture based on containers)."
    }
  ]
}
```

The "wrapper-app" module is an implementation of how an app can be integrated on this level.
This module is provided by GAS Light and it is suitable for simple integration where the
integrated app does not require any further modules and can be simply loaded into an Iframe.

In the "options" parameter the "url" attribute is required. This URL will be loaded in the Iframe.
The "query" attribute is optional in case it is provided the given query parameter will be appended
to the URL.

**Important** On the integrated site the header "X-Frame-Options" shall be set correctly. If it
is set to "DENY" then the Iframe will not be able to load it. Also be careful with 'SAMEORIGIN' value
as well because it will require the integrated app to have the same host as GAS Light.

**Important** In the IFrame "set-cookie" headers require the "SameSite" attribute to be set to "None".
In case of not set it defaults to "Lax" and the Cookies will be dropped by the browser. Cookies often
used for Authentication and dropped Cookies can result in Unauthorized responses.

### Embedded Application

This is the tightest integration level. The UI application is implemented with E-UI SDK v2, and delivered
as JavaScript packages. When the user opens the UI App, the Portal loads the JavaScript module of the
app and injects it into the Application Area. The user experience is seamless.

In this case the UI Application can use all the functionalities provided by the Portal or GAS Light.
Among many other one of them is the possibility to use shared modules and components provided by other
UI Application.

By this it will be possible that some services only deliver partial functionalities and components
without any actual UI Apps. Another service may build a UI App based on that shared functionality or
component.

This level of integration requires:

- Application and components implementation
- the corresponding `ui-serve` module config
- the corresponding `ui-meta` application config

Check the [App Framework Guide](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#app-framework/app-class)
and [Component Framework Guide](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#component-framework-overview)
to see how to implement and configure UI applications and UI components which are fully compatible with
the Portal.

### Manual Application Configuration

There can be use cases when portion of the `ui-meta` can't be provided by specific services but still
needed for the overall deployment.

In the `values.yaml` file of the Helm chart, it is possible to define a static list of
applications and groups. The list is mounted as a `ConfigMap` to GAS Light,
and it merges the static list with the lists from the auto-discovered services. These applications
are listed in the Launcher the same way as any other application.

To define these applications, use the `manualconfig` attribute, which has the following variants:

- `manualconfig.apps`: list of external applications
- `manualconfig.groups`: list of external groups

**Note:** Config only applications can be defined this way as there is no way to provide modules
or implementation in this way. It means `external` only.

**Note:** The configuration is stored in clear text, so URLs and other fields must not contain any
sensitive information, like hardcoded user credentials.

The definitions should follow the [UI-Meta Configuration](#ui-meta-configuration). As YAML allows
both JSON or YAML values the definition can be in either format.

The following is a manual configuration example in YAML format, which can be used in Helm chart
templates:

**Note:** The required attributes must be provided.

```yaml
manualconfig:
   apps:                                    # List of applications
    - displayName: 'Custom Application'     # DisplayName of the application [required]
      url: 'http://localhost/custom-app'    # URL to the application. Can be absolute or relative [required]
      version: '1.1.2'                      # Version of the application [required]
      name: 'custom1'                       # NAME for the application [required]
      descriptionShort: 'Short description' # Short description [optional]
      descriptionLong: 'External app'       # Long Description [optional]
      groupNames:                           # List of group names where this apps belongs to
        - 'customGroup1'
        - 'troubleshooting'
      childNames:                           # List of child applications by 'name'
        - 'custom2'
      tags:                                 # Tags [optional]. Used in search.
        - 'super'
        - 'fast'
      type: 'external'                      # Type, external is the only allowed one.
    - displayName: 'Application 2'
      url: 'http://otherdomain/app2'
      version: '2.3.3'
      name: 'external-app-2'
      type: 'external'
      descriptionLong: 'Second external App'
      groupNames:
        - 'customGroup1'
      type: 'external'
  groups:                                   # List of groups
    - displayName: 'Custom Group'           # DisplayName of the group [required]
      version: '0.2.2'                      # required
      name: 'customGroup1'                  # required
      type: 'category'                      # required, can be 'category' or 'product'/'system'
      descriptionShort: 'Short description' # [optional]
      descriptionLong: 'External category'  # [optional]
      tags:                                 # Tags [optional]. Used in search.
        - 'great_group'
```

### Manual Configuration Override

An optional `override` block can be appended to the `manualconfig` attribute described above,
providing an option to change any of the entry parameters of apps, groups or components after
all of them are discovered. Entries to be altered are identified by name, all other properties
are optional. Properties not listed in the override blocks will be unchanged.

Example manual config with overrides appended:

```yaml
manualconfig:
  apps:
    - displayName: 'Application 2'
      url: 'http://otherdomain/app2'
      version: '2.3.3'
      name: 'external-app-2'
      type: 'external'
      descriptionShort: 'Second external App'
      descriptionLong: 'Second external Application'
      groupNames:
        - 'customGroup1'
      type: 'external'
  groups:
  services:
  overrides:
    apps:
      - name: 'external-app-2'
        displayName: 'New Name for Application 2'
        descriptionShort: 'Second external App Updated description'
    groups:
    components:
```

Resulting final config after aggregation:

```yaml
  apps:
    - displayName: 'New Name for Application 2'
      url: 'http://otherdomain/app2'
      version: '2.3.3'
      name: 'external-app-2'
      type: 'external'
      descriptionShort: 'Second external App Updated description'
      descriptionLong: 'Second external Application'
      groupNames:
        - 'customGroup1'
      type: 'external'
  groups:
  services:
```

It is also possible to hide groups or apps with override configuration. To do this set
the hidden attribute to true in the config.

#### Group Mapping

It is possible to assign any groups to any apps manually by setting the `manualconfig.groupMappings`
attribute. This contains a list of groups, with the related application names.

- `group` : the name of the group
- `apps` : the list of the application names, to which the group will be assigned

The group or apps doesn't have to be defined in the same helm values, the `groupMappings` can refer to
any apps or groups which can be deployed by other services.

If the group is not exists then no application is affected. If the group exists only the deployed
apps are modified, the non-deployed ones are ignored.

Example manual config with group mapping:

```yaml
manualconfig:
  apps:
    - displayName: 'Application 2'
      url: 'http://otherdomain/app2'
      version: '2.3.3'
      name: 'external-app-2'
      type: 'external'
      descriptionShort: 'Second external App'
      descriptionLong: 'Second external Application'
      groupNames:
      type: 'external'
  groups:
  services:
  overrides:
  groupMappings:
    - group: customGroup1
      apps:
        - external-app-2
```

Result app after group mapping:

```yaml
  apps:
    - displayName: 'New Name for Application 2'
      url: 'http://otherdomain/app2'
      version: '2.3.3'
      name: 'external-app-2'
      type: 'external'
      descriptionShort: 'Second external App Updated description'
      descriptionLong: 'Second external Application'
      groupNames:
        - 'customGroup1'
      type: 'external'
```

## Serving static assets

For tighter integration, beside the configuration files the static assets are also important.
Domain services must expose their static assets to GAS Light, next to the configuration files.

GAS Light assumes that the static assets are deployed next to the configuration files.
Therefore the `ui.ericsson.com/config-context` annotation defines the root of the ui related configs
and static assets.

A main functionality of GAS Light is to aggregate and proxy static assets from domain services to
the Portal running in the browser.

**Important**: GAS Light does not provide file level or path based access control, so domain services
should provide such static assets which don't require extra level of protection. Also if a service
provides both REST API and GUI then use the `ui.ericsson.com/config-context` to separate the contexts.
Service with REST API **must not** expose GUIs at the root context (`/`), or at any other context
which is a prefix of a REST API URL.

**Note**: GAS Light is designed to proxy only static assets. REST API endpoints should be exposed
by different ADP services. Check the [API Exposure Guidelines](https://eteamspace.internal.ericsson.com/pages/viewpage.action?pageId=1161856722)
from ADP.

### Deployment Options

According to the [ADP GUI Blueprint for In-house GUI](https://eteamspace.internal.ericsson.com/display/AA/GUI+Blueprint%3A+In-house+GUI),
domain services providing REST APIs could deliver the related UI Apps as well.

In this case the backend service can serve the static assets next to the REST API endpoints on a different
context root. Depending on the technology stack the implementation details can change, but most
backend frameworks give possibility to serve static assets from a given folder.
The `ui.ericsson.com/config-context` could be used to set the path where the UI assets are available.

This is the preferred GUI deployment solution to avoid GUIs to become monoliths.
With the micro-frontend patterns it is possible to break down UI functionalities into granular elements
and each functionality is served by the related REST API backends.

In the case when the UI is not associated to any backend services then the UI project could be deployed
by a static web server. Still the UI project would need Docker image and Helm chart with the proper
configuration to be discoverable by GAS Light.

### Deployment time configuration

Domain GUIs can have configuration options which are different between deployments. Such configuration
can be the URLs of REST APIs or other services which are required for a UI App to function properly.

There are many possible solutions to pass deployment time information to the UI.

A proposed one: define a JSON configuration file which contains the required information.
This JSON file can be embedded into a `ConfigMap` and mounted into the container hosting the
static assets. Note: the file should be mounted into an empty folder as the mount operation will
overwrite the whole folder. As it is part of the static folder the JSON file will be served among
the other static assets and can be also imported or fetched from JavaScript modules.

### Shared Module Packages

Normally JavaScript modules can be referenced by relative URLs, but for that the path of the
module must be known at design time. This is not the case for the shared micro-frontend modules
as the path can change and vary between services and deployments.

To overcome this limitations the Portal utilizes the import-maps standard.
Every entry in the package list is included in the overall import-map. Then the name of the package
can be used to load the modules from the package, without knowing what is the actual external
URL for that module.

Every service can provide multiple shared packages which contains the implementation of the integrated
apps and components. For the package definitions check the [UI-Serve Configuration](#ui-serve-configuration).

E-UI SDK is aligned with the `ui-serve` configuration, so any config.package.json provided by
the framework should be suitable for integration. However E-UI SDK doesn't require all module to be
included in the list, so any module which are meant to be shared must be added to the list.

Dependencies of a shared module can be a service local or another shared module. Service local modules
don't have to be included in the `config.package.json` file, but can be referenced by **relative**
URLs.

**Note**: The actual content is served by the GAS Light Static serve endpoint, which retains module
path context.
This is useful as **relative** URLs are not broken. However, **host-relative** URLs are broken as
they would send requests to different URLs while avoiding the Static endpoint.

For more technology details, check the [Technology overview](https://adp.ericsson.se/marketplace/gui-aggregator-lightweight/documentation/development/additional-documents/microfronted-concept#technology-overview)
from the Microfrontend Concepts document.

For the API reference, check the [API documentation](https://adp.ericsson.se/marketplace/gui-aggregator-lightweight/documentation/development/dpi/api-documentation)
on the Marketplace or check the openapi spec in the [GAS Light repo](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/master/docs/api/ui-serve).

These APIs are used internally by the browser when the Portal loads ESM JavaScript modules.

### Packages

The `config.package.json` configuration file contains the served JavaScript packages by the domain
service. A package might contain ECMAScript modules and other static assets.

Every package must provide the `name` attribute, which will be the global identifier for the package.
The `path` defines a relative path from the `config.package.json` file pointing to the folder where
the package is available.

If the package is imported in JavaScript the file defined by the `main` attribute will be loaded.
However it is also possible to load other files from the package, by providing the filename at the
import statement.

The `version` attribute is used to support multi versioning. It is possible to deploy multiple
version of a module. By default the latest version is loaded, however a package can define stricter
dependency requirements with the `dependencies` attribute. This accepts an object, where the keys
are module names and the value are npm like version expressions. For these packages the generated
import-map will contain scope definitions, instructing the browser to load an older version of a module
for the ESM modules in this package.

```json
{
  "version": "1.0.0",
  "packages": [
    {
      "name": "@eui/theme",
      "version": "1.0.0",
      "path": "./libs/",
      "main": "theme.js"
    },
    {
      "name": "app-1",
      "version": "1.0.0",
      "path": "/apps",
      "main": "app-1.js"
    },
    {
      "name": "comp-a",
      "version": "1.0.0",
      "path": "/components",
      "main": "comp-a.js",
      "dependencies": {
        "utility": "1.x.x"
      }
    },
    {
      "name": "utility",
      "version": "1.0.0",
      "path": "/utils/utility/1.0.0/",
      "main": "utility.js"
    }
  ]
}
```

## Example Service Configuration

The following is an example configuration for the `service.yaml` file:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-http
  labels:
    ui.ericsson.com/part-of: workspace-gui
    app.kubernetes.io/name: domain-service
    app.kubernetes.io/version: 1.3.2-30
  annotations:
    ui.ericsson.com/external-baseurl: http://example.ericsson.se/
    ui.ericsson.com/config-context': /configcontext
    ui.ericsson.com/port: 3000
    ui.ericsson.com/protocol: http
spec:
  type: ClusterIP
  selector:
    dui-generic: example-deployment-name
  ports:
    - port: 3000
      targetPort: 4000
```

The relevant labels for GAS:

- `ui.ericsson.com/part-of: <workspace-name>`: to define the GUI workspace where the service
  belongs to
- `app.kubernetes.io/name`: the name of the service
- `app.kubernetes.io/version`: the version of the service

For more info check the [Labels](#label) section.

More details about the optional `annotations`:

- In case of a complex service definition or deployment the [Fetch configuration](#fetch-configuration)
  can be changed by using the `ui.ericsson.com/config-context`, `ui.ericsson.com/port`,
  `ui.ericsson.com/protocol` `annotations`. In most cases the default values should be fine.

- `ui.ericsson.com/external-baseurl` can contain an absolute URL prefix for [External Applications](#external-application).

For developing services that are usable with GAS Light, the
[nodejs chassis](https://gerrit-gamma.gic.ericsson.se/#/admin/projects/EEA/adp-nodejs-microservice-chassis)
project can be used.

## Guide to a basic deployment of GAS integrated with a UI application

In this chapter you can find 2 options for creating a simple GAS deployment with UI integration.
The first one applies a pre-created Docker Compose file, while the second option contains manual
Helm steps.

In each option please note:

- No GAS dependencies will be installed, while Ingress, alarm sending, and direct log streaming
  to the Log Transformer will all be turned off in GAS.
- TLS (SIP-TLS, service mesh, etc.) integration is disabled in these deployments,
  because the end-to-end configuration of that (e.g. certificate names) is highly product specific.

### Deployment with Docker Compose

Please note:

- In the given default config GAS auto-discovery feature is disabled,
  so the integrated custom UI application needs to be manually configured, as written in below steps.
- The prerequisites of this scenario are: an environment where `docker compose` tool is available,
  and access to both GAS Gerrit repository and [GAS Artifactory repository](https://armdocker.rnd.ericsson.se/proj-eea-drop).
- You may need to run `docker login armdocker.rnd.ericsson.se` if you do not have an active session
  to this repository.

At first please clone the latest state of GAS repository. If you don't have SSH key,
replace `ssh` with `https` in below command.

```bash
git clone ssh://gerrit-gamma.gic.ericsson.se:29418/EEA/adp-ui-service
```

Then default configuration of Docker Compose needs to be customized,
so in GAS repo open `standalone/docker-compose.yml` for editing.

1. Specify the GAS version you would like to deploy: replace the `<version>` placeholder
   in `services.gas.image` with the desired GAS version (e.g. "2.2.0-52").
   You can find all available version tags [here](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+refs).
   As these are Docker images, only "minus" versions are applicable.
2. Define your UI application. It will be running in a Docker container,
   and there are 2 supported cases, depending on whether your application has Dockerfile or not:
   1. If no, please create a configuration like "mock1" below. In this case you will need to mount
      the source code folder of your application. See in-line instructions below.
   2. If yes, follow the example of "mock2". In this case, do not forget to build the Docker image
      of your application before starting the deployment.
3. In each case you may either overwrite the given mock examples in the default config file
   or clone them with a custom name. In the latter case, please add that name under `services.gas.depends_on`.

```yaml
mock1: # customize this block if you do NOT have Dockerfile
  image: armdocker.rnd.ericsson.se/proj-adp-cicd-drop/adp-nodejs-lts-builder-image
  environment: # specify any environment variables if you need
    - ENV1=value1
    - ENV2=value2
  networks:
    - standalone-network # keep this so that GAS can reach your application
  volumes:
    - <relative-path-to-your-application>:/gui/ # fill in the path of your application folder
  command: /bin/sh -c "cd /gui && npm start" # overwrite if you have other runtime than npm
```

```yaml
mock2: # customize this block if you have Dockerfile
  image: your-image # Docker image of your pre-built application (local image name or remote URL)
  environment: # specify any environment variables if you need
    - ENV1=value1
    - ENV2=value2
  networks:
    - standalone-network # keep this so that GAS can reach your application
```

As mentioned, manual discovery of your application needs to be configured in GAS.

1. Please open `standalone/manual-service-config.json` for editing.
2. If you chose a custom name in Docker Compose, either rewrite one of the mock examples
   or add your application in a new block. Please make sure that the domain name
   in "URL" property is the same as the name of your custom block in Docker Compose.
3. In case your application serves the required config files at other port than 4000,
   please overwrite the "URL" accordingly.

Finally, after you have set up your application in above configurations,
simply start the whole deployment with running this command from GAS repository root.

```bash
docker-compose -f standalone/docker-compose.yml up # add -d flag to run in background
```

You can open GAS Portal at [http://localhost:8080/ui](http://localhost:8080/ui),
while you can follow the logs of GAS and your application in the console.

To stop the deployment, either press Ctrl+C or if the Docker compose process is running
in the background, run the following command from GAS repository root.

```bash
docker-compose -f standalone/docker-compose.yml down
```

If you have any issues with the integration, please check the [Troubleshooting chapter](#troubleshooting).

### Manual deployment with Helm

The following commands install a standalone GAS with a plain config, and integrate it with a UI application.

Please note:

- In the given GAS config the performance metrics endpoint is disabled.
- As prequisite of below steps, access to a Kubernetes cluster, to GAS Gerrit repository
  and to GAS Helm chart repository in Artifactory (ARM) is needed.
- The `<placeholder variables>` should be replaced with your actual values in the below command examples.
- The examples use a namespace called `gas-ns`, but you may overwrite it everywhere if you like.
- In order to be discovered by GAS, the UI application is required to have
  the `ui.ericsson.com/part-of:workspace-gui` label, and should provide both config.json
  and config.package.json on a public endpoint. See [Portal Integration](#portal-integration)
  chapter for more information.

At first please prepare a namespace with an Artifactory secret, and download a given version of GAS.
If you have trouble with downloading GAS package using the below `helm pull` command,
you may use your browser to fetch any GAS archive directly from
[this Artifactory folder](https://arm.seli.gic.ericsson.se/artifactory/proj-eea-drop-helm/eric-adp-gui-aggregator-service/).

```bash
kubectl create namespace gas-ns # this is an example of namespace name, you can use any custom name
kubectl -n gas-ns create secret docker-registry arm-pullsecret \
  --docker-server=armdocker.rnd.ericsson.se \
  --docker-username=<ARM user> \
  --docker-password=<ARM API token>

helm repo add gas-repo https://arm.seli.gic.ericsson.se/artifactory/proj-eea-drop-helm \
  [--username <ARM username>] \
  [--password <ARM API token>]
helm search repo gas-repo/eric-adp-gui-aggregator-service --devel -l # to see all available versions
helm pull gas-repo/eric-adp-gui-aggregator-service --version <selected version>
```

Then install the downloaded GAS chart using a simple config file provided in GAS repository
(alternatively you may download this file first, and pass it to Helm install command with the local path).

```bash
helm install -n gas-ns gas eric-adp-gui-aggregator-service-<selected version>.tgz \
  --values https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/master/ci/config/basic-deployment-values.yaml
```

Before checking if the UI of GAS (GAS Portal) is up and running, the GAS service port is advised
to be forwarded to your localhost.

```bash
kubectl -n gas-ns port-forward deployment/eric-adp-gui-aggregator-service 3000:3000
```

Then please open the following address in your browser, and double-check if GAS is displayed properly
and is not yet showing any applications:

[http://localhost:3000/ui](http://localhost:3000/ui)

Now you may want to install a UI application and have it listed in GAS Portal. Once the Helm chart
of your application is available, you can install it in the same namespace with the following command.

```bash
helm install -n gas-ns ui <path to your UI application>
```

After it is started up properly, you should see it in GAS Portal.

If you face any issue with integration between GAS and your UI application, you might try the following
commands to install a mock application that is delivered for GAS. You can also check its config files
[here](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/master/mock/domain-ui-generic/public/ui-generic-eea/)
as reference.

```bash
helm pull gas-repo/domain-ui-generic --version <selected version> # same version as the deployed GAS
helm install -n gas-ns mock domain-ui-generic-<selected version>.tgz \
  --set global.pullSecret=arm-pullsecret \
  --set nameOverride=mock-eea \
  --set global.security.tls.enabled=false \
  --set publicPath=ui-generic-eea
```

Note: the above integration must also be working in case the UI application is installed first,
and GAS is only deployed afterwards.

Should you have any further issues, please read the next chapter for more troubleshooting hints.

## Access Rest API of Integrated GUI Applications

The hostname or path of GAS Portal and the REST APIs of the integrated UIS are deployment specific
values, which can be different in every application.
The GAS Portal only proxies the content of the integrated GUI. The REST API which communicates
with the UI application won't be proxied together with the UI. If the integrated UI use relative urls,
it won't work, the context will be lost and the UI application will refer to the GAS Portal URL instead.

One way to circumvent this issue is to provide the necessary REST API URL in a deployment time
configuration file to the integrated UI. You can find information about how to apply configuration
in deployment time at [Deployment time configuration](#deployment-time-configuration).

If the GAS Portal and the integrated UI's REST API are on a different host, or the REST API is
protected by IAM or API Gateway, proper CORS configuration should be applied to the REST API server.
For more information and examples, check the
[Service User Guide - CORS Configuration](service_user_guide.md#cors-configuration) chapter.

## Troubleshooting

Here are some debugging strategies if the integration of a Domain Service with GAS Light is
not working properly.

### Logs

Always check the logs of GAS Light Pods. The log contains entries about the discovered services,
the fetched configs and any issues happened during the process.

```bash
# Add the -n <namespace> parameter if the current kubectl context is different from the one where
# GAS is deployed.

# Get logs for the deployment
kubectl logs deployment/eric-adp-gui-aggregator-service -c main
```

Example logs for a successful application discovery.

```text
2022-04-27T18:04:45.849Z [default] [info] Adding service [ui-generic-eea] to configQueryService
2022-04-27T18:04:45.851Z [default] [info] Fetching config from: demo-ui-service-eea-http:4000/ui-manual/ui/config.json,
 for service ui-generic-eea
2022-04-27T18:04:45.912Z [default] [info] Adding [ui-generic-eea-1.0] to proxy list
2022-04-27T18:04:46.402Z [default] [info] Fetching config from: demo-ui-service-eea-http:4000/ui-manual/config.json,
 for service ui-generic-eea
2022-04-27T18:04:46.718Z [default] [info] Fetching config from: demo-ui-service-eea-http:4000/ui-manual/config.package.json,
 for service ui-generic-eea
```

If the `Adding service [...] to configQueryService` line is not present the service is not discovered.
In this case check the Automatic or Manual discovery configurations.
**Note:** Kubernetes events are not fired instantly, so it may take some time until a deployed service
is recognized by GAS Light.

`Error occurred for service [..] when fetching GUI Domain Services from Kubernetes API: [reason]`
error message indicates issues which happened during the discovery. The reason may help to understand
what was the root cause.

If there are warnings after the `Fetching config from: ...` lines, then it means that there were some
issues with the file fetching. GAS Light retries the fetch until is it not successful.

Warnings can be normal during a software upgrade as in the transient period services are turned down
and new versions are deployed again.
Also if a service needs long time to reach readiness it is possible that GAS Light executes a fetch
request during the boot period when the service is not ready.

But if the warnings are not resolved after a while, then there is an issue with the connection.

Check the network error codes for more clues. If it is an E\* error code then check the
NodeJS [system errors](https://nodejs.org/api/errors.html#common-system-errors) to find the root
cause for the network error.

Possible errors (not all root cause is mentioned):

- Connection error can happen if the `Service` and `Pod` of the Domain GUI are not properly configured.
- the [Network policies](#network-policies) are not properly set up to enable communication between
  GAS Light and the Domain service.
- If the errors are related to TLS, then the TLS connection is not properly turned on or configured
  in GAS Light or in the Domain GUI

If it is an HTTP response status, like `Not Found`, then the network connection is okay, just the
domain service responded with an unexpected code. Check the Domain service if it serves the config
files at the correct paths. Also check the options for [fetch configuration](#fetch-configuration).

### Curl

Curl is installed in the main container, which can be used to debug integration issues.

First log into the main container on one of the Pods

```bash

kubectl exec -it deployment/eric-adp-gui-aggregator-service -c main – bash
```

Then execute a curl command to the target service

with plain HTTP

```bash
curl -v http://<host>:<port>/config.json
```

With mTLS turned on

```bash
curl -v https://<host>:<port>/config.json \
  --cacert /run/secrets/root/ca.crt \
  --key /run/secrets/internalUi/key.pem \
  --cert /run/secrets/internalUi/cert.pem
```

The curl command will write out verbose diagnostic messages. If everything is okay the content
of the config.json should be fetched.
