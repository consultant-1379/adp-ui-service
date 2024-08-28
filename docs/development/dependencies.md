# Dependency handling

This section covers the technical aspect of the dependency handling.
For 3pp registration check the [FOSS handling chapter](third-party-registration.md#foss-handling).

## Intro

[NPM](https://docs.npmjs.com/cli/v7/commands/npm) is used as package manager for NodeJS projects.
In an NPM project the `package.json` file contains information about the dependencies.
The git repo contains multiple npm projects and each of them has its own package descriptor.

It is important to distinguish between _development_ and _product_ dependencies. _Development_
dependencies are used during development, CI, testing and other similar phases (e.g. test frameworks,
lint tools etc.). There is no strict rules for them.

_Product_ dependencies are used at normal execution of the service (e.g. EUISDK libraries, ExpressJs
etc.). Such dependencies **must** be registered in SCAS. [FOSS handling](third-party-registration.md#foss-handling)
Also security and vulnerability aspects of these dependencies are important.

## Package versions

The `package.json` contains the required dependencies which are fetched from remote repositories.
Each project contains an `.npmrc` file which defines from where to fetch these packages. If not set
otherwise npm falls back to the global user settings, where the default is _registry.npm.org_.
Internally every package _must_ come from an ARM repository.

NPM uses semantic versioning (3 part: major, minor, patch) for package versions. In `package.json` the
version of dependencies can be defined multiple way, like exact version, match minor, match major.

The currently installed exact versions are stored in `package-lock.json` files, which are also
committed to the repository. By this the environment can be consistently reproduced on different
machines.

## Manage versions

NPM provides a set of commands to handle dependencies. Normally these commands affect both
production and development dependencies, but with the `--production` or `--save-dev` flags it
can be controlled.

In all cases the commands respect the semver rules to find the best matching version.
For most commands it is possible to specify packages to limit the executed command.

See [NPM CLI Reference](https://docs.npmjs.com/cli/v7/commands/npm) for more information.

Install dependencies

_Note:_ from NPM v7 the peer dependencies are automatically installed. This is not desired for
production dependencies where we want to keep the 3pp list short. Use the `--legacy-peer-dep` flag
to skip automatic installation.

```bash
npm install --legacy-peer-dep
```

List dependencies with outdated versions.
When the latest version is in the semver range, it is colored by yellow.
Red is used when latest version needs major version change.

```bash
npm outdated
```

Update dependency versions to the latest matching according to the semver rules. _Note:_ this command
always updates the product dependencies.

```bash
npm update
```

Update dependency version of a specific dependency. It can be a deep dependency.

```bash
npm update <dependency-name>
```

### Version increase

Follow these major steps when updating the version of a dependency:

1. set token env variables for Munin and SCAS
2. increase the version in `package.json` (check both root and backend)
3. run `bob npm-install` (so that fossa tool finds the new version under each subproject)
4. run `Automatic 3pp handling` steps of the [Third Party Registration](third-party-registration.md)
5. update/remove dependency in `va-mitigation-config.yaml` if this is a vulnerability fix
6. commit

In case of weird unrelated changes in `package-lock.json` or auto dependency json,
clean up your local environment with following hints, and then retry above steps:

1. make sure you have latest repo with latest package lock files (compare all 3 with remote)
2. delete `node_module` folders
3. run `npm cache clean --force`
4. only install the increased dependency, e.g. run `npm install express-validator@6.14.0`
5. double-check if dependency version is updated both in `node_modules` subfolder and in lock file

### Update to latest versions

Keeping the devDependencies updated can help to use the latest version of the different tools.
However handling and upgrading dependencies with the default npm tools can be cumbersome,
so instead the [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) tool can be used.

This can handle multiple npm projects at once and also can separate development and production
dependencies. Also support include/exclude lists if any case a dependency should not be updated to
the latest version.
To set project specific configs add / edit the `.ncurc.json` files in the projects.

```bash
# To run the preconfigured tool on all project
npm run update-dev-dependencies
# If new versions are added to package.jsons, call install
npm run install:all
```

## Dependency overrides

Update [Table of npm dependency overrides](dependency-overrides.md) if needed.
