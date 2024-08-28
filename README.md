# Lightweight GUI Aggregator Service

This repository contains the source of the
[Lightweight GUI Aggregator Service](https://adp.ericsson.se/marketplace/gui-aggregator-lightweight).

## Documentation

The documentation is in Markdown format and stored under the `docs` folder.
For a better developer experience use the `docsify` viewer.

[Introduction](/docs/homepage.md)

- Development docs

  - [Dev-Env](/docs/development/dev-env.md)
  - [Build system](/docs/development/build-system.md)
  - [CI/CD](/docs/development/cicd.md)
  - [Documentation](/docs/development/documentation.md)
  - [Tilt](/docs/development/tilt.md)
  - [Kubernetes](/docs/development/kubernetes.md)
  - [Bridge to Kubernetes](/docs/development/bridge-kubernetes.md)
  - [Mock services](/docs/development/mock-services.md)
  - [Docker](/docs/development/docker.md)
  - [Dimensioning](/docs/development/dimensioning.md)
  - [Dependencies](/docs/development/dependencies.md)
  - [Dependency overrides](/development/dependency-overrides.md)
  - [Backend Service](/docs/development/backend-service.md)
  - [API specs](/docs/api/api-specs.md)
  - [Live debugging](/docs/development/debugging.md)
  - [Remote Development Environment](/docs/development/remote-dev-env.md)
  - [Portal GUI](/docs/development/portal-gui.md)
  - [3pp Libraries](/docs/development/3pp-libraries.md)
  - [Integration Testing](/docs/development/integration-testing.md)
  - [Release manual](/docs/development/release-manual.md)
  - [Third Party Registration](/docs/development/third-party-registration.md)
  - [Release documents](/docs/development/release-documents.md)

- [Release and marketplace docs](/docs/release/README.md)
- [API Specifications](/docs/api/api-specs.md)

## Contributing

We are an inner source project and welcome contributions. See our
[Contributing Guide](CONTRIBUTING.md) for details.

### Quick start

_Prerequisite:_ NodeJS installed

To check documentation with `docsify`:

```bash
npm i docsify-cli -g
docsify serve docs
```

To install dependencies.

```bash
npm run install:all
```

### Install git hook

In the root folder run the installer script:

```bash
./git-hooks/install.sh
```
