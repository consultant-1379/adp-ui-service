# CI/CD

GAS has multiple CI pipelines to automatize different tasks.

## Jenkins

Service level CI pipelines are executed with Jenkins.
The [Presentation view](https://seliius27190.seli.gic.ericsson.se:8443/view/Presentation/)
contains an **ADP GAS Light** section which shows all GAS related pipelines.

The pipelien definition files are located in the `ci/` folder with `*.jenkinsfile` extension.

## Bob

Internally most job steps call different Bob rules and tasks.
The main bob file is in the root of the repo: `ruleset2.0.yaml`. But to organize Bob tasks
some rules are moved under the `ci/rulesets` folder.
To execute rules from these rulesets, start bob from the root and use the `-r <rulesetfile>` options
with Bob.

## Pipelines

### Pre-code-review

It is executed for every Gerrit patchset. Checks the commit in various ways:

- lint
- build ui + backend
- create package locally
- execute unit tests
- execute selenium tests
- k8s install test
- Sonarqube analysis
- 3pp analysis with FOSSA and SCAS
- dry-run document generation

### Drop

It is executed when a Gerrit patchset is reviewed and merged to the master.
Beside the PCR tests it has extra steps:

- an integration test suite with mocks services
- publish helm and docker artifacts
- publish marketplace documents
- publish release documents in eridoc
- update product related info in Munin

### Release

This pipeline is started manually to create a release (`+` version) from GAS

- tags drop artifacts with a new version (replacing `-` to `+`)
- releases the release related documents in eridoc
- update marketplace docs with new release
- update Munin info

### Demo deployment

It simply deploys a GAS with Mock services and configures the Ingress controller
to make it available from a given path.

It can be executed manually, but also it is executed every week to the latest drop version to
have a permanent demo deployment.

### Design Rule checks

This pipeline executes Helm and Image Design rule checks periodically on the latest version.
However this is stricter as the job fails on warnings as well. Warnings are issued for Design Rules
which are planned to be turned on in the future.

If the job fails it creates or updates a jira ticket, to make it visible for the dev team.

?> The DR check executed here uses an extra config from the `ci/configs/` folder, to enable
some features which are disabled by default. This way the DR checks can be execute to a greater
part of the overall Helm chart.

### Update Base OS

This job:

- updates the base os version in the relevant config files
- creates a commit
- merges commit after the PCR is executed and Verify +1 is granted

This job is triggered by a Spinnaker pipeline from the Base OS service when a new version is released.

### Vulnerability Analysis

This job executes Vulnerability Analysis for GAS. Multiple tolls are used to check the
GAS artifacts for security issues.

### Outdated 3pps Handler

This job check if new versions of direct, production 3pps are available and create a task
with a list of these 3pps or update existing task.

This job uses outdated-3pps-to-jira.js script from ci-toolbox to create or update tasks.

See more info here
<https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/general_ci/+/master/docker/toolbox/nodejs_helpers/docs/outdated-3pps-ticket-generation.md>

### Auto 3pps Handler

This job fetch all commits with `auto-3pps-handling` topic for this project and check
if 3pps registration finished and new 3pps versions are synced with munin.

If 3pps registration finished seccessfully and new 3pps versions synced with munin then
this job will add a new patchset to the appropriate commits.

## Metadata

Folder `docs/release/metadata` is intended for the application developers. Contains json fragments used
in the Structured Data.

### PM Metrics Fragment

PM Metrics json file from all services included in GUI Aggregator are collected and merged
to describe all PM Metrics provided by the application.
Detailed description of the file can be found on
[this wiki page](https://eteamspace.internal.ericsson.com/x/a2OhQw)
