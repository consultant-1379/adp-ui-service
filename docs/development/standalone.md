# Using GAS in standalone mode

GAS can be started also in standalone mode, for example for local development or demo purposes.
This guide describes steps how to start GAS without Kubernetes cluster,
but still connecting to some local mock services.

In the following scenarios GAS is always started in a Docker container,
while mocks are started in different ways.

When starting GAS two config files are overwritten, and these defaults can be changed if you need:

- backend-service-config.json: k8s service and direct log streaming to the Log Transformer
  are turned off
- manual-service-config.json: services listed here will be known by GAS, you can add mocks here

To get the latest GAS started in your environment,
in below commands fill in the version that is available in Artifactory.

In the examples most of the images are pulled from Artifactory, so do a login beforehand:

```bash
  docker login armdocker.rnd.ericsson.se
```

## If mock is started with npm

If you have a Node.js application that is already started with npm and is listening on port 4000,
then start GAS with this command:

```bash
  docker run --name gas --net host -p 8080:3000 \
  -v <full path of project root>/standalone/backend-service-config.json: \
  /runtime/server/config/backend-service-config/backend-service-config.json \
  -v <full path of project root>/standalone/manual-service-config.json: \
  /runtime/server/config/backend-service-config/manual-service-config.json \
  armdocker.rnd.ericsson.se/proj-eea-drop/eric-adp-gui-aggregator-service:<version> # fill in version
```

## If mock is already running in Docker container

In order to GAS access mock's config files from its container, a common network is to be used.
This can either be the `host` network defined by Docker by default, or an own network defined by us.

If your mock was not started with host/own network, then GAS won't be able to connect.
In this case either re-run your mock container with `--net <host / your network>` switch,
or follow the further options as described below.

Please note that `host` mode is only supported in Linux environment, not in Docker Desktop (Win / Mac).
See <https://docs.docker.com/network/host/> for more information.

## Start GAS and mocks with docker-compose

Prerequisite: have docker-compose installed.

You can use standalone/docker-compose.yml to start everything with a single command.
If needed, build your images beforehand and update the mocks in the .yml.
If your mock has no Dockerfile, in .yml see `mock1`, otherwise use `mock2` as reference.
If you like, you can change or add GAS configuration options in `standalone/backend-service-config.yaml`.

Then to start everything, execute this from GAS project root (add `-d` switch to run in background):

```bash
docker-compose -f standalone/docker-compose.yml up
```

To stop every service:

```bash
docker-compose -f standalone/docker-compose.yml down
```

## Start GAS and mock manually with docker run

If you prefer using docker run instead of docker-compose, execute below commands from project root.
In the example commands feel free to replace GAS's mock service with your own.

### If mock has Dockerfile

Linux environment:

```bash
  vi mock.env # set MOCK_ID and PUBLIC_PATH if not given in your mock by default
  docker run --name mock --env-file mock.env -d -p 4000:4000 domain-ui-generic

  docker run --name gas --net host -p 8080:3000 \
  -v <full path of project root>/standalone/backend-service-config.json: \
  /runtime/server/config/backend-service-config/backend-service-config.json \
  -v <full path of project root>/standalone/manual-service-config.json: \
  /runtime/server/config/backend-service-config/manual-service-config.json \
  armdocker.rnd.ericsson.se/proj-eea-drop/eric-adp-gui-aggregator-service:<version> # fill in version
```

Windows / Mac environment (e.g. Docker Desktop):

```bash
  docker network create mynw

  vi mock.env # set MOCK_ID and PUBLIC_PATH if not given in your mock by default
  docker run --name mock --net mynw --env-file mock.env -d -p 4000:4000 domain-ui-generic

  vi standalone/manual-service-config.json # url shall be http://mock:4000
  docker run --name gas --net mynw -p 8080:3000 \
  -v <full path of project root>/standalone/backend-service-config.json: \
  /runtime/server/config/backend-service-config/backend-service-config.json \
  -v <full path of project root>/standalone/manual-service-config.json: \
  /runtime/server/config/backend-service-config/manual-service-config.json \
  armdocker.rnd.ericsson.se/proj-eea-drop/eric-adp-gui-aggregator-service:<version> # fill in version
```

### If mock does not have Dockerfile

Linux environment:

```bash
  docker run --name wrapped-mock --env-file mock.env -d -w /gui -p 4000:4000 \
  -v <full path of project root>/mock/domain-ui-generic/:/gui/ \
  armdocker.rnd.ericsson.se/proj-adp-cicd-drop/adp-nodejs-lts-builder-image \
  npm start

  docker run --name gas --net host -p 8080:3000 \
  -v <full path of project root>/standalone/backend-service-config.json: \
  /runtime/server/config/backend-service-config/backend-service-config.json \
  -v <full path of project root>/standalone/manual-service-config.json: \
  /runtime/server/config/backend-service-config/manual-service-config.json \
  armdocker.rnd.ericsson.se/proj-eea-drop/eric-adp-gui-aggregator-service:<version> # fill in version
```

Windows / Mac environment (e.g. Docker Desktop):

```bash
  docker network create mynw

  vi manual-service-config.json # url shall be http://wrapped-mock:4000
  docker run --name wrapped-mock --net mynw --env-file mock.env -d -w /gui -p 4000:4000 \
  -v <full path of project root>/mock/domain-ui-generic/:/gui/ \
  armdocker.rnd.ericsson.se/proj-adp-cicd-drop/adp-nodejs-lts-builder-image \
  npm start

  docker run --name gas --net mynw -p 8080:3000 \
  -v <full path of project root>/standalone/backend-service-config.json: \
  /runtime/server/config/backend-service-config/backend-service-config.json \
  -v <full path of project root>/standalone/manual-service-config.json: \
  /runtime/server/config/backend-service-config/manual-service-config.json \
  armdocker.rnd.ericsson.se/proj-eea-drop/eric-adp-gui-aggregator-service:<version> # fill in version
```
