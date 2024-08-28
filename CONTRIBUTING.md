# Contributing to Lightweight GUI Aggregator Service

When contributing to this repository, please first discuss the change you wish
to make in the [discussion forum][forum] for the project or via
email, or any other method with the
[guardians](#project-guardians) of this repository before making a change.

The following is a set of guidelines for contributing to the GUI Aggregator
project. These are mostly guidelines, not rules. Use your best judgment, and
feel free to propose changes to this document submitting a patch.

## Table of Contents

[TOC]

## Project Guardians

The guardians are the maintainer of this project. They are responsible to
moderate the [discussion forum][forum], guide the contributors and review the
submitted patches.

- EEA Smart Insights Team (<PDLSCRUMNW@pdl.internal.ericsson.com>)

## Development Environment prerequisites

The development framework for GUI Aggregator Service is based on [bob][bob]. To be
able to run bob, the following tools need to exist on the host:

- bash
- docker

Bob expects you to have a valid docker login towards your docker registry on the
host, currently it can't handle automatic login by itself. Bob tasks use images
from the armdocker repository. You can login to these repositories with the following commands:

```bash
docker login armdocker.rnd.ericsson.se
```

Additional information on the [Development environment][dev-env], the
[Kubernetes deployment][kubernetes] and the local [Tilt deployment][tilt]
can be found in the development guide.

## How can I use this repository?

This repository contains the source code of Lightweight GUI Aggregator Service including
functional and test code, documentation and configuration files for manual and
automatic build and verification.

If you want to fix a bug or just want to experiment with adding a feature,
you'll want to try the service in your environment using a local copy of the
project's source.

You can start cloning the GIT repository to get your local copy:

```text
git clone ssh://<SIGNUM>@gerrit-gamma.gic.ericsson.se:29418/EEA/adp-ui-service
```

> **Note:** To access the repository you need to be part of the ADP Readers group. For more information
> check the [ADP GS and RS Software Repository Access Groups](https://eteamspace.internal.ericsson.com/display/ACD/ADP+GS+and+RS+Software+Repository+Access+Groups)
> wiki page.

A more detailed description is available in the [documentation][dev-env] on how
to use the Gerrit codereview tool.

> **Note:** Please follow the
> [guidelines for contributors](#submitting-contributions)
> before you push your change for review.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Lightweight GUI Aggregator Service.
Following these guidelines helps maintainers and the community understand your
report, reproduce the behavior, and find related reports.

Before creating bug reports, please check
[this list](#before-submitting-a-bug-report) as you might find out that you
don't need to create one. When you are creating a bug report,
please [include as many details as possible](#how-do-i-submit-a-good-bug-report).

> **Note:** If you find a **Closed** issue that seems like it is the same
> thing that you're experiencing, open a new issue and include a link to
> the original issue in the body of your new one.

#### Before Submitting A Bug Report

- **Check the [Service User Guide][guide].** You might be able to find
  the cause of the problem and fix things yourself.
- **Check the [FAQs on the forum][forum]** for a list of
  common questions and problems.
- **Perform a search in [Jira][jira-bug]** to see if the problem has already been
  reported. If it has **and the issue is still open**, add a comment to the
  existing issue instead of opening a new one.
- **Perform a search in the [discussion forum][forum]** for the project to
  see if that bug was discussed before.
  If not, **consider starting a new thread** to get a quick preliminary
  feedback from the project maintainers.

#### How Do I Submit A (Good) Bug Report?

Bugs are tracked as cards in Jira. In the [Marketplace][marketplace] click on the
"Report a Bug" button.

Explain the problem and include additional details to help maintainers reproduce
the problem:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many
  details as possible.
- **Include details about your configuration and environment**.
- **Describe the behavior you observed** and point out what exactly is
  the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **If the problem wasn't triggered by a specific action**, describe what you
  were doing before the problem happened.

### Suggesting Features

This section guides you through submitting an enhancement suggestion, including
completely new features and minor improvements to existing functionality.
Following these guidelines helps maintainers and the community understand your
suggestion and find related suggestions.

Before creating feature suggestions, please check
[this list](#before-submitting-a-feature-suggestion) as you might find out
that you don't need to create one. When you are creating a feature suggestion,
please [include as many details as possible](#how-do-i-submit-a-good-feature-suggestion).

#### Before Submitting A Feature Suggestion

- **Check the [Service User Guide][guide].** for tips — you might discover
  that the feature is already available.
- **Perform a search in [Jira][jira-request]** to see if the feature has already been
  suggested. If it has, add a comment to the existing issue instead of
  opening a new one.
- **Perform a search in the [discussion forum][forum]** for the project to
  see if that enhancement was discussed before.
  If not, **consider starting a new thread** to get a quick preliminary
  feedback from the project maintainers.

#### How Do I Submit A (Good) Feature Suggestion?

Feature suggestions are tracked as cards in Jira. In the [Marketplace][marketplace] click on the
"Get Support" button.

- **Use a clear and descriptive title** for the issue to identify
  the suggestion.
- **Provide a step-by-step description of the suggested feature** in as many
  details as possible.
- **Explain why this feature would be useful** to most users of the service.

### Submitting Contributions

This section guides you through submitting your own contribution, including bug
fixing, new features or any kind of improvement on the content of this
repository. The process described here has several goals:

- Maintain the project's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible solution
- Enable a sustainable system for project's maintainers to review contributions

#### Before Submitting A Contribution

- **Engage the project maintainers** in the proper way so that they are prepared
  to receive your contribution and can provide valuable suggestion on the design
  choices. Follow the guidelines to [report a bug](#reporting-bugs) or to
  [propose an enhancement](#suggesting-features).

#### How Do I Submit A (Good) Contribution?

Please follow these steps to have your contribution considered by the
maintainers:

- **Follow the [style guides](#styleguides)** when implementing your change.
- **Provide a proper description of the change and the reason for it**,
  referring to the associated Jira issue if it exists.
- **Provide proper automatic tests to verify your change**, extending the
  existing test suites or creating new ones in case of new features.
- **Update the project documentation if needed**. In case of new features,
  they shall be properly described in the relevant documentation.
- After you submit your contribution, **verify that the automatic
  [CI pipeline][pipeline] for your change is passing**.
  If the CI pipeline is failing, and you believe that the failure is unrelated to
  your change, please leave a comment on the change request explaining why you
  believe the failure is unrelated. A maintainer will re-run the pipeline for you.
  If we conclude that the failure was a false positive, then we will open an issue
  to track that problem.

While the prerequisites above must be satisfied prior to having your pull
request reviewed, the reviewer(s) may ask you to complete additional design
work, tests, or other changes before your change request can be ultimately
accepted.

## Styleguides

### Git Commit Messages

- Respect the [commit message Design Rule][commit-dr]
- The commit message should include the Jira card id e.g. [EEAEPP-56955] or if there
  is no card just add [no-jira]

### Code Styleguide

Both the backend and the frontend npm projects use eslint rules to verify code formatting.
Prettier code formatter is configured to automatically format code in accordance to these rules
and is ready to use in the Visual Studio Code IDE.

Additional details on the IDE can be found in the [Development Environment documentation][dev-env].

### Documentation Styleguide

Documentation is created in markdown format. All markdown files are linted by markdownlint and Vale.
Additional details on the Documentation can be found in the [Documentation][documentation]
part of the development guide. Developers are advised to run Vale locally (bob lint:vale) after
modifying .md files. The custom dictionary for Vale can be expanded as necessary (\docs\styles\Vocab\EEA4_custom_terms\accept.txt).

[jira-request]: https://eteamproject.internal.ericsson.com/issues/?jql=project%20%3D%20ADPRS%20AND%20resolution%20%3D%20Unresolved%20AND%20component%20%3D%20%22GAS%20Light%22%20AND%20type%20%3D%20Request%20ORDER%20BY%20priority%20DESC%2C%20updated%20DESC
[jira-bug]: https://eteamproject.internal.ericsson.com/browse/ADPRS-1585?jql=project%20%3D%20ADPRS%20AND%20resolution%20%3D%20Unresolved%20AND%20component%20%3D%20%22GAS%20Light%22%20AND%20type%20%3D%20Bug%20ORDER%20BY%20priority%20DESC%2C%20updated%20DESC
[forum]: https://teams.microsoft.com/l/channel/19%3aa1d6b8f467eb49fd9694fb565a6b757a%40thread.tacv2/General?groupId=9dffa945-3fbb-48a6-b1d6-561a33bc75dd&tenantId=92e84ceb-fbfd-47ab-be52-080c6b87953f
[bob]: https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-cicd/bob/
[pipeline]: https://seliius27190.seli.gic.ericsson.se:8443/job/adp-ui-service-precodereview/
[commit-dr]: https://confluence.lmera.ericsson.se/display/AA/Artifact+handling+design+rules
[guide]: https://adp.ericsson.se/marketplace/gui-aggregator-lightweight/documentation/development/dpi/service-user-guide#deployment
[marketplace]: https://adp.ericsson.se/marketplace/gui-aggregator-lightweight
[dev-env]: https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/HEAD/docs/development/dev-env.md
[tilt]: https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/HEAD/docs/development/tilt.md
[kubernetes]: https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/HEAD/docs/development/kubernetes.md
[documentation]: https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/+/HEAD/docs/development/documentation.md
