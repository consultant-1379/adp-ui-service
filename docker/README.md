# Dockerfile for building eric-adp-gui-aggregator-service

For more info check [Docker chapter](../docs/development/docker.md) in documentation.

## Build

After a docker login to the used ARM repository, run the following command from the repository root directory:

```bash
DOCKER_BUILDKIT=1 docker build . -f docker/Dockerfile -t eric-adp-gui-aggregator-service \
--secret id=arm_npm_token,src=.bob/var.token \
--secret id=rnd_arm_npm_token,src=.bob/var.rnd-token \
--secret id=arm_user,env=ARM_USER_SELI \
--secret id=arm_pwd,env=ARM_TOKEN_SELI
```

Make sure to generate the npm tokens for authentication, and set ARM_USER_SELI and ARM_TOKEN_SELI environment
variables as well before referencing them in `docker build` command.

Start the image with specified port:

```bash
docker run -d -p 8080:3000 eric-adp-gui-aggregator-service
```

For additional information regarding the docker run parameters,
check the [GAS Standalone deployment section](../docs/development/standalone.md).
