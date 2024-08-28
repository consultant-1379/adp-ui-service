# 3pp Libraries

This document is to capture some findings about the 3pp libraries.

## Kubernetes Client

GAS uses the `@kubernetes/client-node` library to access the Kubernetes API.

## Documentation

The library has [online documentation](https://kubernetes-client.github.io/javascript/)
for the latest release, but it also can be generated locally from source:

```bash
git clone https://github.com/kubernetes-client/javascript.git
npm install
npm run docs
```

To view the generated documentation, open `docs/index.html`

## Configuration

Kubernetes sets env variables and mounts secrets which are required to access
Creating a default configuration, the library discovers the Kubernetes API url, port and secrets
based on these parameters.

- env: `KUBERNETES_SERVICE_HOST`
- env: `KUBERNETES_SERVICE_PORT`
- service account's token: `/var/run/secrets/kubernetes.io/serviceaccount/token`
- CA certificate to validate TLS on the rest api: `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`
- default namespace where the service deployed: `/var/run/secrets/kubernetes.io/serviceaccount/namespace`

Relevant Kubernetes documentation: [Directly accessing the rest api](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/#directly-accessing-the-rest-api-1)

The library uses the `KUBERNETES_SERVICE_HOST` env variable to construct the API requests.
This variable contains _IP address_ of the rest api and not DNS name. The version of the IP
depends on the Kubernetes installation, it can be v4 or v6.
The client validates the TLS certificates of the rest api.

## Issues

### Ipv6 TLS validation

Bug: [ADPPRG-50848].

Currently there is an issue with the npm `Requests` library, which is used for some operations internally,
eg. for watching changes.
For ipv6 addresses the TLS verifications fails for the requests made by `Requests`, as it falsely
determines the hostname of an ipv6 address.

Workaround: set the `KUBERNETES_SERVICE_HOST` on the pod to `kubernetes.default.svc`

### ESlint issue with 'assert' in import statements

Even though `@babel/plugin-syntax-import-assertions` plugin is correctly configured in frontend,
version 12.x.x of `@open-wc/eslint-config` ignores that and throws `unexpected token` errors.
Work around: freezing to 11.0.0 manually in package.json and ignoring it in `.ncurc.json`.
