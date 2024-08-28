# UI Integration Guide

[TOC]

## Overview

The Portal UI application is also available as a standalone package.
This document provides information about how to access the standalone package.

## Standalone Package

The standalone GAS Light User Interface (UI) is available in the SELI-GIC Artifactory in the
following project:

<https://arm.seli.gic.ericsson.se/artifactory/proj-eea4-other-release-local/com/ericsson/eea4/eric-adp-gas-common-portal/>

The following is an example artifact:

<https://arm.seli.gic.ericsson.se/artifactory/proj-eea4-other-release-local/com/ericsson/eea4/eric-adp-gas-common-portal/0.3.0-17/eric-adp-gas-common-portal-0.3.0-17.zip>

The ZIP file contains the production-ready version of the Portal UI application, which is created
during the GAS Light drop CI pipeline. The version of the artifact is the same as the version of
GAS Light, so the release notes are relevant for this package as well.

## Requirements

The ZIP file must be extracted into a directory where the server expects it (for example, a public
folder).

The Portal UI application uses REST APIs that are implemented in the GAS Light backend.
The following endpoints are required to be available:

- `/ui-meta/v1/apps`
- `/ui-meta/v1/groups`
- `/ui-logging/v1/logs`

For specifications for the REST APIs used by the Portal UI application, see
[Provided Interfaces](https://adp.ericsson.se/marketplace/gui-aggregator-lightweight/documentation/development/dpi/service-user-guide#provided-interfaces)
in the GAS Light documentation.
