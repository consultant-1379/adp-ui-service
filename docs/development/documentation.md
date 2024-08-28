# Documentation

The documentation is based on [Markdown](https://www.markdownguide.org/basic-syntax/) format.
Some part of this documentation is published to the [ADP Marketplace](https://adp.ericsson.se/marketplace/gui-aggregator-lightweight/documentation/development/dpi/service-user-guide#deployment)
, but all of them can be checked with [Gerrit web view](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/).
Also the documentation can be started locally with an npm library.

## Docsify

For better user and developer experience the pages can be viewed with [docsify](https://docsify.js.org/).
This is a VueJS based SPA which generates an online documentation from Markdown files.
Currently docsify is configured to include JS and CSS files from external CDN-s, It is suitable for
most developers to check the documentation on their own machine.

It is recommended to install `docsify-cli` globally, which helps initializing and previewing
the website locally.

```bash
npm i docsify-cli -g
```

To preview your site, run the local server with `docsify serve`.
You can preview your site in your browser on `http://localhost:3000`. The files are watched by the server
any changes is instantly visible.

```bash
docsify serve docs
```

The docsify configuration is in the `index.html`. Here you can configure the documentation engine
add new plugins or modify the styles.

!> The `relativePath: true` setting is important as it makes docsify to work similarly
as Gitiles ~and ADP Marketplace docs~. (Marketplace docs does not support relative URLs)

The files starting with `_` are used for navigational and other internal configuration purposes
in docsify. The left side navigation is defined by `_sidebar.md` and it has to be updated manually
if a new file is created. The top navigation is generated from `_navbar.md`.

?> For information and warning block use the !> or ?> tags.

Used plugins:

- Copy-code - adds the copy to clipboard button to every code block
- Darklight-Theme + Themeable - adds a dark-light theme switcher button and a highly customizable theme
- Search - adds a local search feature

**Custom plugin** is written to imitate **Markdown-Include** functionality. This is supported by the
ADP Marketplace, so to have similar rendering it is added to docsify as well.
In short: using the **\{!filename.md!\}** notation md files can be included in other documents.
Useful to make documentation maintainable.

Plugins which could improve docsify experience:

- <https://docsify.js.org/#/awesome?id=plugins>
- <https://mermaid-js.github.io/mermaid/#/README>
- <https://docsify.js.org/#/markdown?id=supports-mermaid>
- <https://jhildenbiddle.github.io/docsify-themeable/#/introduction>
- <https://upupming.site/docsify-katex/docs/#/>

## ADP Marketplace

The documentation for the marketplace is stored under the `docs/release` directory. In the drop pipeline
the \*.md files are converted to HTML, zipped together, uploaded to an ARM repository and then refreshed
on the marketplace.

There are two config files (`marketplace_*.yaml`) for the conversion and for the upload phases
in this directory. If the file structure is changed then update these.

For reference check the [Marketplace uploader](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-cicd/bob-adp-release-auto/+/refs/heads/master/marketplace/#Marketplace-Uploader).

!> These documents are uploaded to the ADP Marketplace so please use only supported markdown syntax.
Even if these docs can be visualized by Docsify, don't use special tags like ?> or !>

Check the [Doc handler](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-cicd/bob-adp-release-auto/+/refs/heads/master/marketplace/bin/doc-handler)
for supported features and extensions:

- [Markdown-Include](https://github.com/cmacmackin/markdown-include)
- [TOC](https://python-markdown.github.io/extensions/toc/)
- [SuperFences](https://facelessuser.github.io/pymdown-extensions/extensions/superfences/)
- [Tables](https://python-markdown.github.io/extensions/tables/)

!> There is a limitation in the marketplace link handling, _relative_ links are not working.
To link between documents use absolute URLs, which won't work in Gerrit or docsify unfortunately.

For more information check the [Marketplace Document Handling](https://eteamspace.internal.ericsson.com/display/ACD/Marketplace+Document+Handling)
wiki page. This contains the list of _Predefined Documents_, which are the recognized documents.

## Markdown-include Example

An example how to include document fragments into different md files.

1. Create fragment-example.md
2. Add it to the target md file:

```text
# Main title

...

## Subtitle

{!fragment-example.md!}

...
## Other title

```

## Markdown linting with Vale

Vale is a command-line tool that brings code-like linting to prose. See details at [Github](https://github.com/errata-ai/vale/blob/v2/README.md).

Developers are advised to run Vale locally (either via bob (`bob lint:vale`), or after installing Vale
locally (`choco install vale`)) after changing .md files, to keep them tidy.

Vale is ran by the precodereview and Drop pipelines too, and is currently set up to point out
(and fail on) errors only. The custom vocabulary of the project can be expanded as necessary by adding
entries to `docs\styles\Vocab\EEA4_custom_terms\accept.txt`. Keep in mind that entries are case sensitive.

To use Vale with VS Code follow these steps ([Form the docs](https://github.com/errata-ai/vale-vscode#using-vale)):

1. install vale locally: `choco install vale`
2. install `errata-ai.vale-server` VS Code extension
3. set `vale.core.useCLI` to `true` in the VS Code settings
4. restart VS Code.

_Note:_ the spellcheck only runs after the markdown file is saved.

## Gerrit - Gitiles

Gerrit through the [Gitiles](https://gerrit.googlesource.com/gitiles/) plugin provides a web view
for git repositories. Gitiles automatically renders \*.md Markdown files into HTML for simplified
documentation. By this the repository can be used as a shareable documentation for developers.
For example check the landing page of [GAS Gerrit repository](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/EEA/adp-ui-service/)

Files named `README.md` are automatically displayed below the file's directory listing.

?> README.md files are meant to provide orientation for developers browsing the repository,
especially for first-time users.

For reference check [Markdown support in Gitiles](https://gerrit.googlesource.com/gitiles/+/HEAD/Documentation/markdown.md)

## API documentation

API documentation is in the `docs/api` folder. The api documentation is in OpenAPI format in yaml files
called specifications.

API specifications must meet certain design rules, which are verified during the PRC pipeline.
At first this validation can be performed locally. Every DR error or warning should be fixed if
possible, if not - describe it in the [Ignored rules and exceptions](#ignored-rules-and-exceptions)
chapter. For more information about linting process, please refer to the following chapter
[OpenAPI Linting](#openapi-linting).

The "examples" section is validated to the api spec during the lint phase of the verify job.
Markdown files are generated from the specs and are committed so they could be viewed in the git webview.

Once the API specs are updated the markdown files can be generated by executing `bob generate-api-specs`
and the generated markdowns must be committed to update the git webview.

The "examples" section can be validated manually by executing `npm run validateExamples` in the `docs/api`
folder.

### OpenAPI Linting

Specifications are checked against predefined rulesets using the `api-linter-check` tool.
More about how this tool works read [here](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-cicd/adp-checkers/#api_linter_check-command-usage).
Additional information and the description of possible rulesets can be found [here](https://eteamspace.internal.ericsson.com/display/ACD/API+Linter+Checker).

**Important**: The result of running the `api-linter-check` tool is a report detailing
whether all the design rules have been followed. Failing to meet any of the rules will not
terminate the script.

For development purposes this project provides 2 ways of checking the specifications:

1. Run `lint-openapi-specs-file` bob rule with additional properties:

   - `api-check-ruleset`: Name of the ruleset (only one ruleset can be specified).
   - `api-spec-path`: Path to the specification (only one file can be checked).
   - `api-check-dir`: Path to the directory where the resulted HTML report should be
     saved (`.bob/api-linter-check` by default).

   _Example:_

   ```bash
   bob lint-openapi-specs-file -p api-check-ruleset="teaoas" -p api-spec-path="docs/api/userpermission/specs/userpermission.spec.yaml"
   ```

2. Run `ci/scripts/api-specs-check.sh` script. It's designed to perform linting according to
   specified ruleset(s) on a list of specifications.
   The resulted reports will be saved in the `.bob/api-linter-check/reports` directory. To create this
   directory run `bob lint-openapi-specs:create-dir`.

   _Arguments:_

   - `<rulesets>`: A comma-separated list of rulesets to be applied during the linting process.
   - `[list_of_local_paths]`: One or more documents to be checked for compliance.

   _Example:_

   ```bash
   # Check one specification
   ci/scripts/api-specs-check.sh "teaoas" "docs/api/userpermission/specs/userpermission.spec.yaml"

   # Check a few specifications
   ci/scripts/api-specs-check.sh "teaoas" "docs/api/userpermission/specs/userpermission.spec.yaml" "docs/api/ui-logging/specs/ui.logging.spec.yaml"

   # Check specifications from '/docs/api/ui-serve/specs' directory
   ci/scripts/api-specs-check.sh "teaoas" $(find ./docs/api/ui-serve/specs -type f -name "*.yaml")
   ```

> **Note:** To lint the newest changes from the last commit run `bob lint-openapi-specs:run-linter`
> command.

### Ignored rules and exceptions

Within this project, it's not possible to implement some of the design rules. Unfortunately, the
design of `api-linter-check` tool didn't foresee scenarios where certain rules could be ignored.
Therefore, warnings and errors continue to show up in the reports, even though they need to be
ignored.

> **Note:** In the tables below, column "Exempt level" indicated whether the rule is completely
> ignored or if it applies to the specification with exceptions, as detailed in the
> "Explanation" column.

Here's the list of specifications with description of the exceptions that were made for them

- gui.domain.package.spec.yaml

  | ID             | Exempt level       | Explanation                                                                                          |
  | -------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
  | DR-A0104-061-D | Specific exception | 'config.package.json' path can't be changed for kebab-case, because of backward compatibility issues |

- gui.domain.web.spec.yaml

  | ID              | Exempt level       | Explanation                                                                                  |
  | --------------- | ------------------ | -------------------------------------------------------------------------------------------- |
  | DR-A0104-0315-D | Fully ignored      | False positive: The project doesn't support multiple API versions                            |
  | GL-A0104-111-D  | Fully ignored      | False positive: API doesn't return Content-Location header                                   |
  | DR-A0104-061-D  | Specific exception | 'config.json' path can't be changed for kebab-case, because of backward compatibility issues |

- ui.spec.yaml

  | ID                         | Exempt level       | Explanation                                                       |
  | -------------------------- | ------------------ | ----------------------------------------------------------------- |
  | DR-A0104-0315-D            | Fully ignored      | False positive: The project doesn't support multiple API versions |
  | GL-A0104-111-D             | Fully ignored      | False positive: API doesn't return Content-Location header        |
  | oas3-server-trailing-slash | Specific exception | '/' path can't be changed                                         |

- ui.meta.spec.yaml

  | ID              | Exempt level  | Explanation                                                       |
  | --------------- | ------------- | ----------------------------------------------------------------- |
  | DR-A0104-0315-D | Fully ignored | False positive: The project doesn't support multiple API versions |
  | GL-A0104-111-D  | Fully ignored | False positive: API doesn't return Content-Location header        |

- ui.serve.spec.yaml

  | ID              | Exempt level       | Explanation                                                                                                                              |
  | --------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
  | DR-A0104-0315-D | Fully ignored      | False positive: The project doesn't support multiple API versions                                                                        |
  | GL-A0104-111-D  | Fully ignored      | False positive: API doesn't return Content-Location header                                                                               |
  | GL-A0104-111-D  | Specific exception | `#/components/schemas/config.package.json` and `#/components/examples/config.package.json` are specified in one of the tag's description |

**Important:** If developers need to ignore more warnings or if some warnings are fixed, please
adjust or add to the tables accordingly to maintain accuracy.
