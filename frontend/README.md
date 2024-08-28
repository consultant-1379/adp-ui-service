# E-UI SDK Micro Frontend Service skeleton

This is a skeleton implementation of E-UI SDK Micro Frontend Service. It can be used as a starting
point to build applications & components based on the new ESM refactoring.
This uses a **slimmed down** version of the E-UI SDK Container and as such must NOT to be used for
production. It is a continuously evolving area in E-UI SDK.

---

## Overview

This Micro Frontend service consists of the EUI SDK container & theme libraries and basic server file
used to host the project build.

---

## Public

The public folder contains 4 files which are listed below.

| name                | description                                                     |
| ------------------- | --------------------------------------------------------------- |
| config.json         | configure the navigation menu based on ADP UI-Meta schema       |
| config.package.json | configure modules made available to the GUI Aggregator Service. |
| index.css           | style the Container                                             |
| index.html          | import and run the Theme and Container                          |

### Configuring the navigation menu

The JSON file, `config.package.json`, contains the specification for the application. The schema for
an app specification is from the [ADP spec for UI-Meta](https://euisdk.seli.wh.rnd.internal.ericsson.com/applications/gas-spec).

### Micro Frontend Applications

This Micro Frontend Service only contains an EUI SDK container which has been themed.
When the Micro Frontend Service is served (`npm run srv`), GUI Aggregator fetches its `config.package.json`,
which contains information on each module that this Micro Frontend Service want's to make available.

---

## Source

The src folder contains the code which developer implemented, it will be further built upon by adding
apps, components, panels etc. as needed for further development.

---

## Work in Progress

This is a work in progress. Currently the E-UI SDK team are converting all framework packages to
follow all industry best practices.

- all packages are being migrated to JavaScript modules (no more AMD or UMD bundles).
- no bundling.
- no minification.
- export element classes.
- polyfills are the responsibility of the Application developer.
- components will eventually come with a custom-elements.json file documenting the component.
- TypeScript typings are added for each package.
- unit test is using @open-wc/testing.
- Rollup is used for the Micro Frontend Service (the E-UI SDK Container + Product Apps).

The following packages have been converted to date:

| package            | description                                                    |
| ------------------ | -------------------------------------------------------------- |
| @eui/app           | Application base class                                         |
| @eui/base          | Button, Accordion, etc.                                        |
| @eui/component     | E-UI SDK Component base class                                  |
| @eui/lit-component | E-UI SDK Lit-Component base class, using lit-html              |
| @eui/layout        | Layout components                                              |
| @eui/theme         | Theming in E-UI SDK, fonts,icons and colors based on EDS 3.9.0 |

> We are using the @proto scope during the conversion process.

The documentation for all components can be found in the [E-UI SDK Docs](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#welcome)

---

## Installation

`$ npm install`

## Testing

[`@open-wc/testing`](https://open-wc.org/docs/testing/testing-package/) is used to unit test all components.
It is an opinionated package that combines and configures testing libraries to minimize the amount of
ceremony required when writing tests.

### Running tests

Run all tests against the Firefox headless browser.

```shell
npm run test
```

Run all tests against all headless browsers (Chrome, Firefox and Safari).

```shell
npm run test:all
```

Run all tests against Chrome headless browser in watch mode.

```shell
npm run test:watch
```

---

## Development

To run the application in development mode, execute the following command. A browser will open and
display the apps.

> Import maps are used in this example and as yet are only supported by Chrome.

```shell
npm start
```

---

## Serve the Apps

It is possible to serve a built version of the applications. You must first build the Micro Front Service...

> Import maps are used in this example and as yet are only supported by Chrome.

### build the Micro Front Service

```shell
npm run build
```

### serve the Micro Frontend Service

```shell
npm run srv
```
