---
title: UI Package Config File Descriptor (IF.GUI.DOMAIN.PACKAGE) v1.0.0
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

# UI Package Config File Descriptor (IF.GUI.DOMAIN.PACKAGE) v1.0.0 {#ui-package-config-file-descriptor-if-gui-domain-package-}

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

# UI Package (modules) Config File Descriptor
This document describes the format of UI Package (modules) Config file descriptor and how it shall be exposed, as identified in the ADP GUI FA.

## Terms
- **Package**: A reusable, shared package exposed by a Micro-service. A package contains at least one ES module, and can contain additional static assets (CSS, images, etc.).
- **ES Module (ESM)**: Part of a package, this is the atomic entity which is loaded by the browser. ES module specification is based on W3C standards.

## Description
This file descriptor for shared packages is compatible with UI micro front-ends.
This file includes meta information of shared packages served by the current service for UI micro front-ends.

This file **MUST** be named as `config.package.json` and **MUST** be exposed by the service.

### Design guidelines for shared packages:
- A package **MUST** be contained in its own folder.
- A package **MUST** contain at least one main module, but **MAY** contain multiple sub-modules.
- Static assets **MUST** be bundled into the package's folder.

Base URLs:

* [/](/)

Email: <a href="mailto:PDLSCRUMNW@pdl.internal.ericsson.com">Smart Insights Team</a>

# IF.GUI.DOMAIN.PACKAGE {#ui-package-config-file-descriptor-if-gui-domain-package--if-gui-domain-package}

## Fetch package metadata (config.package.json) {#opIdgetConfigPackageFileContent}

`GET /config.package.json`

File descriptor for shared packages provided by the service.
This file includes meta information for the shared packages which contains ES modules suitable for modern Micro-frontends.

This file **MUST** be named as `config.package.json` and **MUST** be accessible from the service root context path.

Design guidelines for shared packages:
- A package **MUST** be contained in its own folder.
- A package **MUST** contain at least one main module, but **MAY** contain multiple sub-modules.
- Static assets **MUST** be bundled into the package's folder.

> Example responses

> 200 Response

```json
{
  "version": "string",
  "packages": [
    {
      "version": "string",
      "name": "string",
      "path": "string",
      "main": "string",
      "dependencies": {
        "property1": "string",
        "property2": "string"
      }
    }
  ]
}
```

### Responses {#fetch-package-metadata-(config.package.json)-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Path is incorrect|None|

### Response Schema {#fetch-package-metadata-(config.package.json)-response-schema}

File descriptor for shared packages compatible with UI micro front-ends.
This file includes meta information of shared packages served by the current service for UI micro front-ends.

This file **MUST** be named as `config.package.json` and **MUST** be accessible from the service root context path.

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`» version`|string|true|none|Schema version of the config.package.json.|
|`» packages`|[object]|true|none|List of shared packages available as part of the service.|
|`»» version`|string|true|none|Version of the shared package. **MUST** be in semantic version.|
|`»» name`|string|true|none|Name of the package. This is the unique id of the package which can be used as<br>bare-id reference in ESM import statements. It **MUST** follow NPM naming rules: `[@namespace/]packageName`<br>where `packageName` and `namespace` cannot contain `/`. Namespace is optional.|
|`»» path`|string|true|none|Path to the package's folder. It **MUST** be relative to the service root.|
|`»» main`|string|true|none|Path to the main module. It **MUST** be elative to the package folder and **MUST** contain filename with extension. This is the main module for the package, which is loaded by default.|
|`»» dependencies`|object|false|none|Defines the required dependency versions. It is a `_packageName_-_version_` map, where every entry identifies a given package and the required version, which **MUST** be imported by the current package.|
|`»»» **additionalProperties**`|string|false|none|A `_packageName_-_version_` entry which defines the required version for the current package. The version definition can be an exact version or a semver compatible version range definition.|

<aside class="success">
This operation does not require authentication
</aside>

