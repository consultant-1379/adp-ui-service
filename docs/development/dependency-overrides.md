# List of npm dependency overrides

Please keep this list up-to-date and as short as possible.

## Root package.json

| Name         | Version | Date added | Related primaries       | Reason       |
| ------------ | ------- | ---------- | ----------------------- | ------------ |
| tough-cookie | 4.1.3   | 2023-10-30 | @kubernetes/client-node | security fix |

## Backend

| Name                          | Version | Date added | Related primaries     | Reason                                                          |
| ----------------------------- | ------- | ---------- | --------------------- | --------------------------------------------------------------- |
| @kubernetes/client-node : qs  | 6.10.3  | 2022-12-19 | @adp/kubernetes       | security fix                                                    |
| tough-cookie                  | 4.1.3   | 2023-10-30 | @adp/kubernetes       | security fix                                                    |
| underscore                    | ^1.13.6 | 2023-10-30 | @adp/kubernetes       | security fix                                                    |
| http-proxy : follow-redirects | 1.15.5  | 2024-02-21 | http-proxy-middleware | security fix                                                    |
| @adp/base : winston           | 3.12.0  | 2024-05-17 | @adp/base             | latest registered, newer version has been sent for registration |
| @adp/base : fsevents          | 2.3.2   | 2024-05-17 | @adp/base             | latest registered, newer version has been sent for registration |
| @adp/base : binary-extensions | 2.2.0   | 2024-05-21 | @adp/base             | latest registered, newer version has been sent for registration |

## Frontend

| Name | Version | Date added | Related primaries | Reason |
| ---- | ------- | ---------- | ----------------- | ------ |
