---
title: User Info and Permission REST API (IF.GUI.USERPERMISSION.REST) v1.0.0
language_tabs:
  - javascript: JavaScript
language_clients:
  - javascript: ''
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2
---

<!-- Generator: Widdershins v4.0.1 -->

# User Info and Permission REST API (IF.GUI.USERPERMISSION.REST) v1.0.0 {#user-info-and-permission-rest-api-if-gui-userpermission-rest-}

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

```
  Ericsson   |   DocNo <DOC NUMBER>   |   Rev PA1   |   Interwork Description
```

## Introduction

This document describes the User Interface User permission REST API.

User Permission REST API can be used to retrieve information (e.g., username, user id) of the current user in session
as well as the permissions (what security resources it has access) of the user.
The source of the information returned by the API is ADP IAM (Keycloak).

Base URLs:

- [/userpermission/v1](/userpermission/v1)

Email: <a href="mailto:PDLSCRUMNW@pdl.internal.ericsson.com">Smart Insights Team</a>

# IF.GUI.USERPERMISSION.REST {#user-info-and-permission-rest-api-if-gui-userpermission-rest--if-gui-userpermission-rest}

## Get user info and determine realm from the auth cookie {#opIdgetUserinfo}

`GET /userinfo`

Returns normalized IAM's `/userinfo` endpoint's response extended with the
last login time if not present in the response and original properties
returned by IAM's `/userinfo` endpoint.

> Example responses

> OK

```json
{
  "userId": "8dd9927d-207e-4a1f-98e7-e3ae0ddea7cb",
  "username": "gas-user",
  "lastLoginTime": "20230918101954Z"
}
```

> Internal Server Error - The endpoint is not working

```json
{
  "code": "adp.error.internal",
  "message": "This API endpoint is not enabled. Check service configuration."
}
```

### Responses {#get-user-info-and-determine-realm-from-the-auth-cookie-responses}

| Status | Meaning                                                                    | Description                                         | Schema |
| ------ | -------------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)                    | OK                                                  | Inline |
| 404    | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)             | Not Found - The user cannot be found                | None   |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Internal Server Error - The endpoint is not working | Inline |

### Response Schema {#get-user-info-and-determine-realm-from-the-auth-cookie-response-schema}

The response returned by IAM's `/userinfo` endpoint. Properties largely
depend on the IAM configuration.

Status Code **200**

| Name              | Type   | Required | Restrictions | Description                                                |
| ----------------- | ------ | -------- | ------------ | ---------------------------------------------------------- |
| `» userId`        | string | true     | none         | The subject claim of the user.                             |
| `» username`      | string | true     | none         | The username of the user.                                  |
| `» lastLoginTime` | string | true     | none         | The last login time returned as ISO string formatted text. |

User Permission Internal Error Response

Status Code **500**

| Name        | Type   | Required | Restrictions | Description                      |
| ----------- | ------ | -------- | ------------ | -------------------------------- |
| `» code`    | string | true     | none         | Application specific error code. |
| `» message` | string | true     | none         | Short error description.         |
| `» details` | string | false    | none         | Detailed error message.          |

<aside class="success">
This operation does not require authentication
</aside>

## Get user info from a specific realm {#opIdgetRealmUserinfo}

`GET /{realm}/userinfo`

Returns normalized IAM's `/userinfo` endpoint's response for a specific realm
extended with the last login time if not present in the response and original
properties returned by IAM's `/userinfo` endpoint.

### Parameters {#get-user-info-from-a-specific-realm-parameters}

| Name    | In   | Type   | Required | Description                        |
| ------- | ---- | ------ | -------- | ---------------------------------- |
| `realm` | path | string | true     | The realm to fetch user info from. |

> Example responses

> OK

```json
{
  "userId": "8dd9927d-207e-4a1f-98e7-e3ae0ddea7cb",
  "username": "gas-user",
  "lastLoginTime": "20230918101954Z"
}
```

> Internal Server Error - The endpoint is not working

```json
{
  "code": "adp.error.internal",
  "message": "This API endpoint is not enabled. Check service configuration."
}
```

### Responses {#get-user-info-from-a-specific-realm-responses}

| Status | Meaning                                                                    | Description                                                                                                                                   | Schema |
| ------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)                    | OK                                                                                                                                            | Inline |
| 401    | [Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)            | Unauthorized - The user is not authenticated, or the user session has expired.                                                                | None   |
| 403    | [Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)             | Forbidden - The authorization request does not map to any permission, or the access token was requested without the "scope=openid" parameter. | None   |
| 404    | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)             | Not Found - The user or the realm cannot be found                                                                                             | None   |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Internal Server Error - The endpoint is not working                                                                                           | Inline |

### Response Schema {#get-user-info-from-a-specific-realm-response-schema}

The response returned by IAM's `/userinfo` endpoint. Properties largely
depend on the IAM configuration.

Status Code **200**

| Name              | Type   | Required | Restrictions | Description                                                |
| ----------------- | ------ | -------- | ------------ | ---------------------------------------------------------- |
| `» userId`        | string | true     | none         | The subject claim of the user.                             |
| `» username`      | string | true     | none         | The username of the user.                                  |
| `» lastLoginTime` | string | true     | none         | The last login time returned as ISO string formatted text. |

User Permission Internal Error Response

Status Code **500**

| Name        | Type   | Required | Restrictions | Description                      |
| ----------- | ------ | -------- | ------------ | -------------------------------- |
| `» code`    | string | true     | none         | Application specific error code. |
| `» message` | string | true     | none         | Short error description.         |
| `» details` | string | false    | none         | Detailed error message.          |

<aside class="success">
This operation does not require authentication
</aside>

## Get permission info for the current user {#opIdgetPermissionInfo}

`POST /permission`

Returns the IAM's `/token` endpoint's response for a specific user.

> Body parameter

```json
{
  "response_mode": "permissions"
}
```

### Parameters {#get-permission-info-for-the-current-user-parameters}

| Name              | In   | Type     | Required | Description                                                                                                               |
| ----------------- | ---- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `body`            | body | object   | false    | none                                                                                                                      |
| `» audience`      | body | string   | false    | The client identifier of the resource server to which the client is seeking access.                                       |
| `» realm`         | body | string   | false    | The realm to fetch permission info from.                                                                                  |
| `» response_mode` | body | string   | true     | A string value indicating how the server should respond to authorization requests.                                        |
| `» permission`    | body | [string] | false    | An array that contains strings that represents a set of a resources and a scopes from which the client is seeking access. |

#### Detailed descriptions

**» audience**: The client identifier of the resource server to which the client is seeking access.
It serves as a hint to Keycloak to indicate the context in which permissions should be evaluated.

**» response_mode**: A string value indicating how the server should respond to authorization requests.

#### decision

Indicates that responses from the server should only represent the overall decision by returning a JSON.

In case of positive decision the response will be the following:

```
{
    "result": true
}
```

If the user has no right to access the resource, or the resource does not exist the response will be the following:

```
{
    "result": false
}
```

#### permissions

Indicates that responses from the server should contain any permission granted by the server by returning a JSON with the following format:

```
[
    {
        "rsid": "resource-id",
        "rsname":  "resource-name",
        "scopes": ["GET", "POST"]
    }
]
```

If the authorization request does not map to any permission a 403, if the resource does not exist a 400 HTTP status code is returned.

**» permission**: An array that contains strings that represents a set of a resources and a scopes from which the client is seeking access.
The format of the string must be: RESOURCE_ID#SCOPE_ID, RESOURCE_ID or SCOPE_ID. <br>
For instance:

```
[
  "Resource A#Scope A",
  "Resource A",
  "#Scope A"
  "#Scope B",
  "#Scope C",
]
```

#### Enumerated Values

| Parameter       | Value       |
| --------------- | ----------- |
| » response_mode | decision    |
| » response_mode | permissions |

> Example responses

> OK

```json
{
  "result": true
}
```

```json
[
  {
    "scopes": ["TRACE", "HEAD", "DELETE", "POST", "GET", "CONNECT", "OPTIONS", "PUT"],
    "rsid": "90cda438-55cc-4bbf-ac7a-80c24141b4b3",
    "rsname": "all-in-one-gas_eric-adp-gui-aggregator-service-authproxy"
  }
]
```

> Internal Server Error - The endpoint is not working

```json
{
  "code": "adp.error.internal",
  "message": "This API endpoint is not enabled. Check service configuration."
}
```

### Responses {#get-permission-info-for-the-current-user-responses}

| Status | Meaning                                                                    | Description                                                                    | Schema |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)                    | OK                                                                             | Inline |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)           | Bad Request - The POST body is invalid.                                        | None   |
| 401    | [Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)            | Unauthorized - The user is not authenticated, or the user session has expired. | None   |
| 403    | [Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)             | Forbidden - The authorization request does not map to any permission           | None   |
| 404    | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)             | Not Found - Realm cannot be found                                              | None   |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Internal Server Error - The endpoint is not working                            | Inline |

### Response Schema {#get-permission-info-for-the-current-user-response-schema}

The response returned by IAM's `/token` endpoint. Properties largely
depend on the IAM configuration.

Status Code **200**

| Name            | Type     | Required | Restrictions | Description                                                    |
| --------------- | -------- | -------- | ------------ | -------------------------------------------------------------- |
| _`oneOf`_       | ---      | ---      | ---          | ---                                                            |
| `» *anonymous*` | array    | false    | none         | In case of the response_mode parameter is set to permission.   |
| `»» scopes`     | [string] | false    | none         | Available scopes for the user.                                 |
| `»» rsid`       | string   | false    | none         | ID of the resource.                                            |
| `»» rsname`     | string   | false    | none         | Name of the resource.                                          |
| _`xor`_         | ---      | ---      | ---          | ---                                                            |
| `» *anonymous*` | object   | false    | none         | In case of the response_mode parameter is set to decision.     |
| `»» result`     | boolean  | false    | none         | Indicates that the user has permission for the given resource. |

User Permission Internal Error Response

Status Code **500**

| Name        | Type   | Required | Restrictions | Description                      |
| ----------- | ------ | -------- | ------------ | -------------------------------- |
| `» code`    | string | true     | none         | Application specific error code. |
| `» message` | string | true     | none         | Short error description.         |
| `» details` | string | false    | none         | Detailed error message.          |

<aside class="success">
This operation does not require authentication
</aside>
