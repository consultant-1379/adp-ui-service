# ----------- Main params
# --- BASE OS Specific params
ARG BASE_OS_VERSION=5.6.0-11
ARG COMMON_BASE_OS_DOCKER_URL=armdocker.rnd.ericsson.se/proj-ldc/common_base_os_release/sles
ARG NODEJS_BUILDER_VERSION=20.12.2-0
ARG NODEJS_BUILDER_URL=armdocker.rnd.ericsson.se/proj-adp-cicd-drop/adp-nodejs-lts-builder-image
ARG BASE_OS_REPO=arm.sero.gic.ericsson.se/artifactory/proj-ldc-repo-rpm-local/common_base_os/sles/

# ----------- Builder: Node.js
FROM $NODEJS_BUILDER_URL:$NODEJS_BUILDER_VERSION as nodejs

# ----------- Builder: EUI client (brand2)
FROM nodejs as builder_eui_client
ARG DEV

WORKDIR /eui_client

# Install NPM dependencies
COPY frontend/package.json package.json
COPY frontend/package-lock.json package-lock.json
COPY frontend/.npmrc .npmrc
COPY frontend/patches patches

RUN --mount=type=secret,id=arm_npm_token --mount=type=secret,id=rnd_arm_npm_token \
    export ARM_NPM_TOKEN=$(cat /run/secrets/arm_npm_token) && \
    export RND_ARM_NPM_TOKEN=$(cat /run/secrets/rnd_arm_npm_token) && \
    npm ci

# Copy SRC and run build
ARG VERSION
COPY frontend/ .
RUN export VERSION="$VERSION" && if [ "$DEV" = true ] ; then echo "DEV mode on frontend is ON" && npm run build:dev; else npm run build:prod ; fi

# ----------- Builder: Server (Node.js)
FROM nodejs as builder_server
ARG DEV

WORKDIR /server

# Install NPM dependencies
COPY backend/package.json package.json
COPY backend/package-lock.json package-lock.json
COPY backend/.npmrc .npmrc

RUN --mount=type=secret,id=arm_npm_token --mount=type=secret,id=rnd_arm_npm_token \
    export ARM_NPM_TOKEN=$(cat /run/secrets/arm_npm_token) && \
    export RND_ARM_NPM_TOKEN=$(cat /run/secrets/rnd_arm_npm_token) && \
    if [ "$DEV" = true ] ; then echo "DEV mode on backend is ON" && npm ci; else npm ci --production --unsafe-perm ; fi

# Copy SRC
COPY backend/ .

# Remove configs not needed for runtime, but can contain E/// sensitive information
RUN rm package-lock.json .npmrc

# ----------- Build Server
# The layer in the final image should consist of three separate layers only.
#   1. Common Base OS layer
#   2. Common Execution environment layer
#   3. Service layer

# ---- 1. Common Base OS layer
FROM $COMMON_BASE_OS_DOCKER_URL:$BASE_OS_VERSION as production

# ---- 2. Common Execution environment layer
ARG BASE_OS_REPO
ARG BASE_OS_VERSION
ARG CBO_HARDENING_REPO="https://arm.sero.gic.ericsson.se/artifactory/proj-ldc-repo-rpm-local/common_base_os/hardening"
ARG CBO_HARDENING_ARCHIVE="common-base-os-hardening-cxa301047-${BASE_OS_VERSION}.tar.gz"

RUN --mount=type=secret,id=arm_user --mount=type=secret,id=arm_pwd \
    export ARM_USER=$(cat /run/secrets/arm_user) && \
    export ARM_PWD=$(cat /run/secrets/arm_pwd) && \
    zypper addrepo -C -G -f https://${ARM_USER}:${ARM_PWD}@${BASE_OS_REPO}${BASE_OS_VERSION} COMMON_BASE_OS_SLES_REPO \
    && zypper --gpg-auto-import-keys refresh \
    && zypper install -l -y curl \
    && zypper clean --all

RUN curl "${CBO_HARDENING_REPO}/${BASE_OS_VERSION}/${CBO_HARDENING_ARCHIVE}" --output ${CBO_HARDENING_ARCHIVE} \
    && tar -xf ${CBO_HARDENING_ARCHIVE} \
    && chmod 750 /cbo-harden.sh \
    && /cbo-harden.sh

RUN rm -f /cbo-harden.sh \
    && rm -f /${CBO_HARDENING_ARCHIVE}

RUN echo 'LANG=en_US.UTF-8' >> /etc/environment

RUN echo "264522:x:264522:264522:An Identity for eric-adp-gui-aggregator-service:/nonexistent:/bin/false" >>/etc/passwd
RUN echo "264522:!::0:::::" >>/etc/shadow

# ---- 3. Service layer
COPY --chown=264522:0 --from=nodejs /opt/nodejs/ /opt/nodejs/
COPY --chown=264522:0 --from=builder_server /server/ /runtime/server/
COPY --chown=264522:0 --from=builder_eui_client /eui_client/build /runtime/frontend/

ENV PATH=${PATH}:/opt/nodejs/latest/bin

ENV PATH=/runtime/bin:${PATH}
ENV NODE_ENV=production
ENV LANG=en_US.UTF-8

COPY --chown=264522:0 docker/entrypoint.sh /runtime/server

# Remove npm and its links as npm is not needed for running the Service
RUN rm -rf /opt/nodejs/latest/lib/node_modules/npm \
    && rm /opt/nodejs/latest/bin/npm \
    && rm /opt/nodejs/latest/bin/npx

USER 264522

COPY docker/probe.sh /runtime/probe.sh

WORKDIR /runtime/server
ENTRYPOINT ["./entrypoint.sh"]
