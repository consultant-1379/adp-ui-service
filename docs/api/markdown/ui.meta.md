---
title: UI Metadata REST API (IF.GUI.META.REST) v1.3.0
language_tabs:
  - javascript: JavaScript
language_clients:
  - javascript: ""
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

# UI Metadata REST API (IF.GUI.META.REST) v1.3.0 {#ui-metadata-rest-api-if-gui-meta-rest-}

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

# Introduction
This specificaton describes the UI Metadata REST API identified in the ADP GUI FA.
UI Metadata (on apps, groups, components, and actions) exposed by these endpoints is an aggregation of UI metadata of individual services discovered by GAS.
Most API endpoints are meant to be used by the UI Portal (GAS frontend) to fetch (aggregated) UI meta-data from GAS service backend.
I.e. the endpoints are meant to be for internal usage between GAS frontend and backend.
Some, however, can be used by other services too (external usage).

## Terms

- **Client Container**: An SPA (Single Page Application) implementing the App Shell pattern e.g. E-UI SDK Container.
- **UI App**: A full screen user interface exposed by a Microservice that can execute in the Client Container e.g. E-UI SDK App.
  - ***External UI App***: Any UIs that have a separate web page (outside the Client Container) or other alternative renderer e.g. Citrix.
- **UI Component**: A reusable, embeddable UI Web Component exposed by a Microservice e.g. E-UI SDK Shareable Components.

### API Versions
#### 1.3.0
Adding the `options` attribute to `app` and `component` entities.
#### 1.2.0-alpha
Adding the `/services` endpoint.
#### 1.1.0-alpha
Adding `module` attribute to `app` and `component` entities.
#### 1.0.0-alpha
Initial version.

Base URLs:

* [/ui-meta/v1](/ui-meta/v1)

Email: <a href="mailto:PDLSCRUMNW@pdl.internal.ericsson.com">Smart Insights Team</a>

# IF.GUI.META.REST {#ui-metadata-rest-api-if-gui-meta-rest--if-gui-meta-rest}

Provides aggregated UI Metadata on all accessible UI apps, groups, components, and actions available to the current user in session as well as a possibility to refresh UI Metadata of a given service.

## Update metadata for services (external interface) {#opIdserviceChange}

`PUT /services/{name}`

This endpoint can be used to indicate to GAS that UI-meta of a service is changed and request GAS to re-fetch it (i.e. to refresh it in GAS).

> Body parameter

```json
{
  "name": "eric-eea-spotfire-manager"
}
```

### Parameters {#update-metadata-for-services-(external-interface)-parameters}

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|`name`|path|string|true|The name of service where the UI-meta configuration is changed|
|`Via`|header|string|false|GAS pod checks the Via header. If the request is not forwarded from another peer gas instance, then the receiver instance will proxy the request to the other peers.|
|`body`|body|object|true|The data of the changed service|
|`» name`|body|string|true|The name of the domain service for which the change notification is triggered|

> Example responses

> 500 Response

```json
{
  "errors": {}
}
```

### Responses {#update-metadata-for-services-(external-interface)-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK - The notification is accepted|None|
|202|[Accepted](https://tools.ietf.org/html/rfc7231#section-6.3.3)|Accepted - Request for refresh has been sent|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Parameters are missing or incorrect|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Not Found|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|[Error](#schemaerror)|

<aside class="success">
This operation does not require authentication
</aside>

## Get all UI apps {#opIdgetApps}

`GET /apps`

Returns list of available UI apps. The list will contains based on users access to an application and availability of an active license.

> Example responses

> OK

```json
[
  {
    "name": "adp-oam-ui-tools",
    "service": "adp-oam-ui-service",
    "displayName": "Configuration Tools",
    "descriptionLong": "ADP.OAM.UI.TOOLS.DESC.LONG",
    "descriptionShort": "ADP.OAM.UI.TOOLS.DESC.SHORT",
    "module": "@adp-oam/ui-tools",
    "color": "blue",
    "acronym": "AUT",
    "version": "0.1.0",
    "type": "euisdk",
    "route": "oam-tools",
    "priority": 1,
    "childNames": [
      "adp-oam-ui-tools-scheduler"
    ],
    "groupNames": [
      "adp-tools"
    ],
    "tags": [
      "tools"
    ],
    "specification": "./adp-oam-ui-tools/app.config.json"
  },
  {
    "id": "5956ab3d-2285-4cf8-82e3-38c40d902f1d",
    "name": "adp-oam-ui-tools-scheduler",
    "displayName": "Scheduler",
    "descriptionLong": "ADP.OAM.UI.TOOLS.SCH.DESC.LONG",
    "descriptionShort": "ADP.OAM.UI.TOOLS.SCH.DESC.SHORT",
    "module": "@adp-oam/ui-tools-scheduler",
    "color": "#D2691E",
    "acronym": "SCH",
    "version": "0.1.0",
    "type": "euisdk",
    "route": "oam-tools/scheduler",
    "priority": 1,
    "groupNames": [
      "adp-tools",
      "oam"
    ],
    "tags": [
      "tools"
    ],
    "specification": "./adp-oam-ui-tools-scheduler/app.config.json"
  },
  {
    "id": "33a1f160-017e-4390-9060-255a69c78e76",
    "name": "adp-market-place",
    "displayName": "ADP Market Place",
    "module": "@adp/marketplace",
    "color": "#008B8B",
    "acronym": "AMP",
    "version": "1.0.0",
    "type": "external",
    "url": "https://adp.ericsson.se/marketplace",
    "priority": 10,
    "groupNames": [
      "adp-tools"
    ],
    "tags": [
      "adp",
      "marketplace"
    ]
  }
]
```

### Responses {#get-all-ui-apps-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Path is incorrect|None|

### Response Schema {#get-all-ui-apps-response-schema}

List of all licensed and user authorized applications.

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*`allOf`*|---|---|---|---|
|`» *anonymous*`|object|false|none|none|
|`»» id`|string|false|none|Unique identification of the UI entity.|
|*`and`*|---|---|---|---|
|`» *anonymous*`|any|false|none|none|
|*`allOf`*|---|---|---|---|
|`»» *anonymous*`|object|false|none|none|
|`»»» name`|string|true|none|Full name of an UI entity. Well-known name defined during development time.|
|`»»» displayName`|string|true|none|Display name of an UI entity.|
|`»»» descriptionShort`|string|false|none|Description of an UI entity.|
|`»»» descriptionLong`|string|false|none|Detailed description of an UI entity.|
|`»»» color`|string|false|none|Color represents the UI entity. Color should be CSS supported name or HEX value.|
|`»»» acronym`|string|false|none|Short name of an UI entity.|
|`»»» type`|string|false|none|Classification of an UI entity. Example values are euisdk, oden, external, etc.|
|`»»» priority`|integer|false|none|Display priority order.|
|`»»» tags`|[string]|false|none|Tags associated.|
|`»»» hidden`|boolean|false|none|Default is false. Set to true to hide the app form the menu.|
|*`and`*|---|---|---|---|
|`»» *anonymous*`|object|false|none|none|
|`»»» version`|string|true|none|Version of an UI application. Should be in semantic version.|
|`»»» route`|string|false|none|Relative path of an UI application. Mandatory container specific types.|
|`»»» module`|string|false|none|Module reference which implements this application.|
|`»»» url`|string|false|none|Full path of an UI application. Mandatory for external types.|
|`»»» specification`|string|false|none|Relative location of the application specification file.|
|`»»» options`|object|false|none|Extra runtime options for the application. Not parsed by GAS, passed to the REST API as it is.|
|`»»» childNames`|[string]|false|none|Children applications of an current UI application.|
|`»»» groupNames`|[string]|false|none|Groups related to the current UI application.|
|`»»» hidden`|boolean|false|none|Default is false. Set to true to hide the app form the menu.|
|`»»» service`|string|false|none|The name of the service the app is in.|

<aside class="success">
This operation does not require authentication
</aside>

## Get all UI groups {#opIdgetGroups}

`GET /groups`

Returns list of all available UI groups and related UI apps. UI apps list be included based on users access to an application and availability of an active license

> Example responses

> OK

```json
[
  {
    "id": "7382eb95-b9cf-4d62-a276-f920cf130f31",
    "version": "1.0.0",
    "name": "adp-tools",
    "displayName": "Tools",
    "descriptionLong": "Tools Application",
    "descriptionShort": "Utility applications helps to perform common activities.",
    "color": "green",
    "acronym": "TL",
    "type": "domain",
    "priority": 10,
    "tags": [
      "tools"
    ]
  },
  {
    "id": "205e66cb-e979-4ba5-9da6-dc09f3ad5fde",
    "version": "1.0.0",
    "name": "oam",
    "displayName": "OAM",
    "descriptionShort": "Operation and Maintenance Application",
    "color": "#8B008B",
    "type": "domain",
    "priority": 20
  }
]
```

### Responses {#get-all-ui-groups-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Path is incorrect|None|

### Response Schema {#get-all-ui-groups-response-schema}

List of all groups needed by above listed applications.

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*`allOf`*|---|---|---|---|
|`» *anonymous*`|object|false|none|none|
|`»» id`|string|false|none|Unique identification of the UI entity.|
|*`and`*|---|---|---|---|
|`» *anonymous*`|object|false|none|none|
|`»» name`|string|true|none|Full name of an UI entity. Well-known name defined during development time.|
|`»» displayName`|string|true|none|Display name of an UI entity.|
|`»» descriptionShort`|string|false|none|Description of an UI entity.|
|`»» descriptionLong`|string|false|none|Detailed description of an UI entity.|
|`»» color`|string|false|none|Color represents the UI entity. Color should be CSS supported name or HEX value.|
|`»» acronym`|string|false|none|Short name of an UI entity.|
|`»» type`|string|false|none|Classification of an UI entity. Example values are euisdk, oden, external, etc.|
|`»» priority`|integer|false|none|Display priority order.|
|`»» tags`|[string]|false|none|Tags associated.|
|`»» hidden`|boolean|false|none|Default is false. Set to true to hide the app form the menu.|

<aside class="success">
This operation does not require authentication
</aside>

## Get all UI components {#opIdgetComponents}

`GET /components`

Returns list of all available shared UI components.

> Example responses

> OK

```json
[
  {
    "id": "0b1d3330-2056-40ba-a1e6-1487afa809fc",
    "name": "adp-latest-entities",
    "version": "0.1.0",
    "displayName": "Latest Entities",
    "descriptionLong": "Overview of all the entities created during last 2 weeks.",
    "module": "@adp/latest-entities",
    "type": "oden",
    "priority": 10,
    "specification": "./config/component.config.json"
  }
]
```

### Responses {#get-all-ui-components-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Path is incorrect|None|

### Response Schema {#get-all-ui-components-response-schema}

List of all available shared components.

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*`allOf`*|---|---|---|---|
|`» *anonymous*`|object|false|none|none|
|`»» id`|string|false|none|Unique identification of the UI entity.|
|*`and`*|---|---|---|---|
|`» *anonymous*`|any|false|none|none|
|*`allOf`*|---|---|---|---|
|`»» *anonymous*`|object|false|none|none|
|`»»» name`|string|true|none|Full name of an UI entity. Well-known name defined during development time.|
|`»»» displayName`|string|true|none|Display name of an UI entity.|
|`»»» descriptionShort`|string|false|none|Description of an UI entity.|
|`»»» descriptionLong`|string|false|none|Detailed description of an UI entity.|
|`»»» color`|string|false|none|Color represents the UI entity. Color should be CSS supported name or HEX value.|
|`»»» acronym`|string|false|none|Short name of an UI entity.|
|`»»» type`|string|false|none|Classification of an UI entity. Example values are euisdk, oden, external, etc.|
|`»»» priority`|integer|false|none|Display priority order.|
|`»»» tags`|[string]|false|none|Tags associated.|
|`»»» hidden`|boolean|false|none|Default is false. Set to true to hide the app form the menu.|
|*`and`*|---|---|---|---|
|`»» *anonymous*`|object|false|none|none|
|`»»» version`|string|true|none|Version of an UI component. Should be in semantic version.|
|`»»» module`|string|false|none|Module reference which implements this component.|
|`»»» specification`|string|false|none|Location of the component specification file.|
|`»»» options`|object|false|none|Extra runtime options for the component. Not parsed by GAS, passed to the REST API as it is.|

<aside class="success">
This operation does not require authentication
</aside>

## Get all UI actions {#opIdgetActions}

`GET /actions`

Returns list of all available UI actions and UI action groups.

> Example responses

> 200 Response

```json
{
  "actions": [
    {
      "id": "string",
      "displayName": "string",
      "shortDescription": "string",
      "longDescription": "string",
      "icon": "string",
      "group": [
        "string"
      ],
      "tags": [
        "string"
      ],
      "module": "string",
      "version": "string",
      "parameters": [
        {
          "name": "string",
          "type": "string",
          "value": "string"
        }
      ]
    }
  ]
}
```

### Responses {#get-all-ui-actions-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Path is incorrect|None|

### Response Schema {#get-all-ui-actions-response-schema}

List of actions available as part of the service.

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`» actions`|[object]|false|none|none|
|`»» id`|string|true|none|Unique ID of the Action. Must be in the form of 'service-name.action-name'|
|`»» displayName`|string|true|none|Action/Task name, used in for example, a button or a menu item. This should be a task-orientated name such as Add, Create, Delete, etc. Used in search.|
|`»» shortDescription`|string|false|none|Action/Task name, used for a button/tooltip text. Used in search.|
|`»» longDescription`|string|false|none|A detailed description of the Action/Task. Used in search.|
|`»» icon`|string|false|none|Name of the icon. Only valid names should be used. Icon names can be found on the E-UI SDK Documentation.|
|`»» group`|[string]|false|none|Group that this Action/Task belongs to. An Action/Task can belong to zero or more groups.|
|`»» tags`|[string]|false|none|List of tags for the Action/Task. Used in search.|
|`»» module`|string|true|none|Name of the module to load for this Action/Task. This must match the name of the module exported in config.package.json.|
|`»» version`|string|true|none|Version of the Action/Task module to use. Only required when a module is specified.|
|`»» parameters`|[object]|false|none|Actions/Task parameters.|
|`»»» name`|string|true|none|none|
|`»»» type`|string|true|none|Type of the parameter|
|`»»» value`|string|false|none|The value of the parameter|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

## Error {#schema-error}

```json
{
  "errors": {}
}

```

User Interface API Error Response

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`errors`|object|true|none|Detailed error object.|

