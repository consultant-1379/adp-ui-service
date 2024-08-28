---
title: UI Metadata File Descriptor (IF.GUI.DOMAIN.WEB) v1.1.0
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

# UI Metadata File Descriptor (IF.GUI.DOMAIN.WEB) v1.1.0 {#ui-metadata-file-descriptor-if-gui-domain-web-}

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

# UI Meta-Data Specification (JSON Schema)

This document describes the format of UI Metadata file descriptor and how it shall be exposed, as identified in the ADP GUI FA.
Every service exposing UIs must implement this interface, that is, expose (by HTTP) the `UI Meta-Data` file to be displayed within the OSS Portal.

## Terms

- **Client Container**: An SPA (Single Page Application) implementing the App Shell pattern e.g. E-UI SDK Container.
- **UI App**: A full screen user interface exposed by a Microservice that can execute in the Client Container e.g. E-UI SDK App.
- **External UI App**: Any UIs that have a separate web page (outside the Client Container) or other alternative renderer e.g. Citrix.
- **UI Component**: A reusable, embeddable UI Web Component exposed by a Microservice e.g. E-UI SDK Shareable Components.
- **GUI Domain Web Interface**: The interface provided by micro front-ends to access UI apps and components.

Base URLs:

* [/](/)

Email: <a href="mailto:PDLSCRUMNW@pdl.internal.ericsson.com">Smart Insights Team</a>

# IF.GUI.DOMAIN.WEB {#ui-metadata-file-descriptor-if-gui-domain-web--if-gui-domain-web}

## Fetch configuration from config.json file {#opIdgetConfigFileContent}

`GET /config.json`

File descriptor for UI micro front-ends.
This file includes meta information of all apps, shared components and groups supported by UI micro front-ends.

This file should be named as _config.json_ and be accessible from the service root context path.

> Example responses

> OK

```json
{
  "version": "1.1.0",
  "apps": [
    {
      "name": "adp-oam-ui-tools",
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
  ],
  "groups": [
    {
      "name": "adp-tools",
      "displayName": "Tools",
      "descriptionLong": "Tools Application",
      "descriptionShort": "Utlity applications helps to perform common activities.",
      "color": "green",
      "acronym": "TL",
      "type": "domain",
      "priority": 10,
      "tags": [
        "tools"
      ],
      "version": "1.0.0"
    },
    {
      "name": "oam",
      "displayName": "OAM",
      "descriptionShort": "Operation and Maintenance Application",
      "color": "#8B008B",
      "type": "domain",
      "priority": 20,
      "version": "1.0.0"
    }
  ],
  "components": [
    {
      "name": "adp-latest-entities",
      "version": "0.1.0",
      "displayName": "Latest Entities",
      "descriptionLong": "Overview of all the entities created during last 2 weeks.",
      "module": "@adp/latest-entities",
      "type": "oden",
      "priority": 10,
      "specification": "./config/component.config.json"
    }
  ],
  "actions": {
    "actions": [
      {
        "id": "eric-eo-usermgmt-ui.view-user-profile-action",
        "displayName": "View User Profile",
        "version": "1.0.0",
        "module": "view-user-action"
      },
      {
        "id": "eric-eea-call-browser-service.list-calls-action",
        "displayName": "View Subscriber's Call List",
        "version": "1.0.0",
        "module": "view-subscriber-action",
        "parameters\"": [
          {
            "name": "url",
            "type": "url_template",
            "value": "https://eea.internal.ericsson.local/callbrowser/query?subscriberimsi={imsi}&startime={timeInterval.start_time}&endtime={timeInterval.end_time}"
          }
        ]
      },
      {
        "id": "eric-eea-call-browser-service.compare-calls-action",
        "displayName\"": "Compare Multiple Calls",
        "version": "1.0.0",
        "module": "compare-calls-action"
      }
    ]
  }
}
```

### Responses {#fetch-configuration-from-config.json-file-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Path is incorrect|None|

### Response Schema {#fetch-configuration-from-config.json-file-response-schema}

File descriptor for UI micro front-ends.
This file includes meta information of all apps, shared components and groups supported by UI micro front-ends.
This file should be named as 'config.json' and be accessible from the service root context path.

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`» version`|string|false|none|Schema version of the config.json.|
|`» apps`|[allOf]|false|none|List of applications available as part of the service.|
|*`allOf`*|---|---|---|---|
|`»» *anonymous*`|any|false|none|none|
|*`allOf`*|---|---|---|---|
|`»»» *anonymous*`|object|false|none|none|
|`»»»» name`|string|true|none|Full name of an UI entity. Well-known name defined during development time.|
|`»»»» displayName`|string|true|none|Display name of an UI entity.|
|`»»»» descriptionShort`|string|false|none|Description of an UI entity.|
|`»»»» descriptionLong`|string|false|none|Detailed description of an UI entity.|
|`»»»» color`|string|false|none|Color represents the UI entity. Color should be CSS supported name or HEX value.|
|`»»»» acronym`|string|false|none|Short name of an UI entity.|
|`»»»» type`|string|false|none|Classification of an UI entity. Example values are euisdk, oden, external, etc.|
|`»»»» priority`|integer|false|none|Display priority order.|
|`»»»» tags`|[string]|false|none|Tags associated.|
|`»»»» hidden`|boolean|false|none|Default is false. Set to true to hide the app form the menu.|
|*`and`*|---|---|---|---|
|`»»» *anonymous*`|object|false|none|none|
|`»»»» version`|string|true|none|Version of an UI application. Should be in semantic version.|
|`»»»» route`|string|false|none|Relative path of an UI application. Mandatory container specific types.|
|`»»»» module`|string|false|none|Module reference which implements this application.|
|`»»»» url`|string|false|none|Full path of an UI application. Mandatory for external types.|
|`»»»» specification`|string|false|none|Relative location of the application specification file.|
|`»»»» options`|object|false|none|Extra runtime options for the application. Not parsed by GAS, passed to the REST API as it is.|
|`»»»» childNames`|[string]|false|none|Children applications of an current UI application.|
|`»»»» groupNames`|[string]|false|none|Groups related to the current UI application.|
|`»»»» hidden`|boolean|false|none|Default is false. Set to true to hide the app form the menu.|
|`»»»» service`|string|false|none|The name of the service the app is in.|
|*`and`*|---|---|---|---|
|`»» *anonymous*`|object|false|none|none|
|`»»» properties`|[object]|false|none|List of associated properties.|
|`»»»» name`|string|true|none|Name of the property.|
|`»»»» value`|string|true|none|Value of the property.|
|*`continued`*|---|---|---|---|
|`» groups`|[object]|false|none|List of groups available as part of the service.|
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
|`» components`|[allOf]|false|none|List of components available as part of the service.|
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
|*`continued`*|---|---|---|---|
|`» actions`|object|false|none|List of actions available as part of the service.|
|`»» actions`|[object]|false|none|none|
|`»»» id`|string|true|none|Unique ID of the Action. Must be in the form of 'service-name.action-name'|
|`»»» displayName`|string|true|none|Action/Task name, used in for example, a button or a menu item. This should be a task-orientated name such as Add, Create, Delete, etc. Used in search.|
|`»»» shortDescription`|string|false|none|Action/Task name, used for a button/tooltip text. Used in search.|
|`»»» longDescription`|string|false|none|A detailed description of the Action/Task. Used in search.|
|`»»» icon`|string|false|none|Name of the icon. Only valid names should be used. Icon names can be found on the E-UI SDK Documentation.|
|`»»» group`|[string]|false|none|Group that this Action/Task belongs to. An Action/Task can belong to zero or more groups.|
|`»»» tags`|[string]|false|none|List of tags for the Action/Task. Used in search.|
|`»»» module`|string|true|none|Name of the module to load for this Action/Task. This must match the name of the module exported in config.package.json.|
|`»»» version`|string|true|none|Version of the Action/Task module to use. Only required when a module is specified.|
|`»»» parameters`|[object]|false|none|Actions/Task parameters.|
|`»»»» name`|string|true|none|none|
|`»»»» type`|string|true|none|Type of the parameter|
|`»»»» value`|string|false|none|The value of the parameter|

<aside class="success">
This operation does not require authentication
</aside>

