
ARG TARGET_IMAGE
FROM ${TARGET_IMAGE}

USER root

ARG BASE_OS_VERSION=5.6.0-11
RUN zypper ar --gpgcheck-strict -C -f https://arm.sero.gic.ericsson.se/artifactory/proj-ldc-repo-rpm-local/common_base_os/sles/3.44.0-9?ssl_verify=no LDC-CBO-SLES \
  && zypper --gpg-auto-import-keys refresh \
  && zypper install -l -y util-linux iproute2 shadow \
  && zypper clean --all

RUN curl "https://arm.sero.gic.ericsson.se/artifactory/proj-ldc-repo-rpm-local/common_base_os/hardening/${BASE_OS_VERSION}/common-base-os-hardening-cxa301047-${BASE_OS_VERSION}.tar.gz" --output hardening.tar.gz \
  && tar -xf $PWD/hardening.tar.gz \
  && chmod 750 $PWD/cbo-harden.sh \
  && $PWD/cbo-harden.sh

RUN rm -f cbo-harden.sh \
  && rm -f hardening.tar.gz

ENTRYPOINT ["./entrypoint.sh"]