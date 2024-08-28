# Release documents

This part of the documentation describes the Release documents published by CI jobs.

## Service User Guide

This document is intended for service developers, application integrators and support teams.
It is generated from `/docs/release/conten/service_user_guide.md`. Two outputs are generated:

1. a HTML output which is uploaded to the ARM repository for the ADP Marketplace
2. a PDF output which is uploaded to EriDoc.

## Test Specification

This document is about the overview of the testing implemented in the product.

More specifically it describes the used testing methods, tools and requirements as per
testing levels such as unit testing, component testing, integration testing. It is also
containing the frequency and the location of the running tests.

The high level description of functional requirements can also be found in the document
with detailed test instructions.

## Test Report

This report is intended for the ADP development team, the ADP CICD team and application developers.
The output is a single zip file which includes all the HTML test reports produced in the Drop pipeline.

The archived file also includes a PDF document. This document is filled out during the pipeline run.
The source ejs template is the `/docs/release/content/test-report-template.ejs.md` file.
Additional info added during pipeline execution includes deployment environment details,
docker image details and deployment metrics.

The output zip archive is uploaded to EriDoc.

## Application developers guide

This guide is intended for developers.
It is generated from `/docs/release/content/application_developers_guide.md`.
The generated output is HTML for Marketplace and PDF for EriDoc.

## API specification

This document is for service users and application developers. The format is OpenAPI (Swagger) in
yaml files. The API descriptors are located in the /docs/api folder.

These API descriptors are zipped and uploaded to EriDoc.
