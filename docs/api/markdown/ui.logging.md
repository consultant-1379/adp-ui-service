---
title: UI Logging REST API (IF.GUI.LOG.REST) v1.0.0
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

# UI Logging REST API (IF.GUI.LOG.REST) v1.0.0 {#ui-logging-rest-api-if-gui-log-rest-}

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

# Introduction

This document describes the UI Logging REST API, which is meant to be used for collecting client-side logs.

This API enables UIs to push their logs captured on the client side (in the browser) to GAS service backend,
which receives and forwards these logs for server-side log-aggregation towards the logging stack.

Base URLs:

* [/ui-logging/v1](/ui-logging/v1)

Email: <a href="mailto:PDLSCRUMNW@pdl.internal.ericsson.com">Smart Insights Team</a>

# IF.GUI.LOG.REST {#ui-logging-rest-api-if-gui-log-rest--if-gui-log-rest}

## Report UI Logs {#opIdpostLogs}

`POST /logs`

Sends UI user session events.

> Body parameter

```json
{
  "logs": [
    {
      "timestamp": "2020-10-03T11:15:00.000+01:00",
      "severity": "error",
      "message": "Unable to load the vendor.js file.",
      "applicationName": "common-launcher"
    },
    {
      "timestamp": "2020-10-03T10:15:00.002Z",
      "severity": "info",
      "message": "User authorized successfully."
    }
  ]
}
```

### Parameters {#report-ui-logs-parameters}

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|`body`|body|[Logs](#schemalogs)|false|none|

> Example responses

> Bad Request

```json
{
  "errors": [
    {
      "msg": "severity parameter should be one of the values 'critical', 'error', 'warning', 'info', 'debug'",
      "param": "severity",
      "value": "alarm"
    }
  ]
}
```

### Responses {#report-ui-logs-responses}

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK - Logs saved successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[Error](#schemaerror)|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

## Log {#schema-log}

```json
{
  "timestamp": "string",
  "severity": "debug",
  "applicationName": "string",
  "message": "string",
  "category": "string",
  "uniqueLogId": "string"
}

```

Log Object.

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`timestamp`|string|true|none|Log generation timestamp as per RFC 5424. YYYY-MM-DDThh:mm:ss.sss±hh:mm.|
|`severity`|string|true|none|Log severity level.|
|`applicationName`|string|false|none|Name of the UI application which produces log|
|`message`|string|true|none|Detailed log message.|
|`category`|string|false|none|An identifier of the type of message. This Shall follows GL-D1114-070-A,D.|
|`uniqueLogId`|string|false|none|Unique log identifier identifies uniquely in the service code the origin of a logged event across multiple versions of the service.|

#### Enumerated Values

|Property|Value|
|---|---|
|`severity`|debug|
|`severity`|info|
|`severity`|warning|
|`severity`|error|
|`severity`|critical|

## Logs {#schema-logs}

```json
{
  "logs": [
    {
      "timestamp": "string",
      "severity": "debug",
      "applicationName": "string",
      "message": "string",
      "category": "string",
      "uniqueLogId": "string"
    }
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`logs`|[[Log](#schemalog)]|false|none|[Log Object.]|

## Error {#schema-error}

```json
{
  "errors": [
    {
      "msg": "string",
      "param": "string",
      "value": "string",
      "location": "string",
      "nestedErrors": []
    }
  ]
}

```

User Interface API Error Response

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|`errors`|[object]|true|none|Detailed error object that describes which parameter(s) is causing the error.|
|`» msg`|string|false|none|Error message|
|`» param`|string|false|none|Parameter name|
|`» value`|string|false|none|Parameter value|
|`» location`|string|false|none|Location of the parameter that caused the error. It's either `body`, `query`, `params`, `cookies` or `headers`.|
|`» nestedErrors`|array|false|none|Nested errors|

