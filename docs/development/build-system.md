# Build System

The local build system is based on NPM and Bob.

A series of NPM scripts are written to ease the local development of NodeJS and EUI-SDK projects.
The root project contains multiple npm scripts, which can initialize the repository or
start development server.

**Bob** is used to execute tasks in CI, but it can be used locally as well to execute
build related tasks, eg. creating docker images, helm charts.

## NPM Tasks

### Install dependencies

Packages are handled by NPM and all dependency is defined in package.json files.
For CI there are optimized versions of the commands where some npm features are switched off
(--preffer-offline & --no-audit)

```bash
npm run install:all       # Install dependencies in all project
npm run ci:all            # Clean Install dependencies in all project. (optimized for quick run in CI)
```

### Start locally

Start the GUI Aggregator service locally.

```bash
npm start               # Start GUI Aggregator service service in production mode
                        # it also serves the built frontend
npm run start:dev       # Start both the server and the frontend in autorefresh mode
npm run start:server    # Start the server in development mode
npm run start:frontend  # Start the ui locally
```

_Note: development server runs on `http://localhost:3000` and ui server runs on `http://localhost:8080`_

### Linting

There are multiple static code analyzer steps which can check the repository for various issues.
The analyzers have config files in the root of the repo and some has in subproject as well.

Linters and configs:

- ESlint <https://eslint.org/>
  - .eslintrc\*
  - .eslintignore
- Markdownlint <https://github.com/igorshubovych/markdownlint-cli>
  - .markdowlint.json
  - .markdowlintignore
- Vale <https://github.com/errata-ai/vale/blob/v2/README.md>
  - \*.md files only
  - .vale.ini
  - \docs\styles\Vocab\EEA4_custom_terms\accept.txt, reject.txt
- lockfile-lint <https://github.com/lirantal/lockfile-lint>
  - .lockfile-lintrc\*
- hadolint <https://github.com/hadolint>
  - ci/config/hadolint-config.yaml

```bash
npm run lint                  # execute all lint tasks
npm run lint:markdown         # lint all *.md files in the repository.
npm run lint:package-lock     # lint package-lock.json files
npm run lint:frontend         # run lint task in the frontend project
npm run lint:server           # run lint task in the backend project
```
