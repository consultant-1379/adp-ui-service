# Common Portal (GUI)

The Portal GUI project is an EUI-SDK based SPA application. It contains an EUI-SDK client-container
and the Portal implemented as EUI-SDK application. Its main goal to provide an entry point for
the cluster and show the list of available UI applications.

## Technology

The project uses the EUI-SDK framework to implement web applications.
It uses several 3pp libraries and frameworks in the development pipeline and in implementation.

- [EUI-SDK](https://euisdk.seli.wh.rnd.internal.ericsson.com/showcase/esm-docs/#welcome)
  \- internal framework
  - [Lit-HTML](https://lit.dev/docs/) - html templating library
- [Web-dev-server](https://modern-web.dev/docs/dev-server/overview/) - local development server
- [Rollup](https://rollupjs.org/guide/en/) - build tool for the frontend
- [WebDriverIO](https://webdriver.io) - Selenium based e2e testing framework
- [Open wc Testing](https://open-wc.org/docs/testing/testing-package/) - The package used for writing
  component tests
- [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) - Test runner used for executing
  component tests
- [Mocha](https://mochajs.org) - Generic test framework for component and e2e tests
- [Chai](https://www.chaijs.com/) - Assertion library used in component and e2e tests

## Common NPM tasks

For a full list of available tasks check `frontend/package.json`.

```bash
npm install         # install npm dependencies
npm run build:dev   # build the UI with Rollup
npm run build:prod  # build the UI with Rollup
npm start           # start the local dev server using web-dev-server
npm run lint        # lint the project
npm run test        # run the component tests
npm run test:*      # run test with different options
npm run e2e:local   # run e2e tests locally
npm run e2e:*       # run e2e tests with different options
```

## Development

EUI-SDK applications can be developed locally with mocked backend services, using web-dev-server
with Rollup plugins.

Start the development server first:

```bash
npm run start
```

By default it will open `http://localhost:8080` in a new browser tab. The development server
serves the UI assets and also provides mock endpoints which mock the GAS API and return proper
test data. Test config files are located in properly named folders
inside the `mock/charts/domain-ui-generic/public`folder.
The default mock service emulates 3 discovered services with different set of provided applications.

The development server configuration is in `web-dev-server.config.js`.
Here new services can be added or proxy services can be configured if required. Also the
source-map settings can be changed in this file.

When the devserver runs it watches UI source files. If any of them is changed then the server
reloads the UI to see the result immediately.

## Build

The build step involves Rollup build steps.

Rollup build creates the static assets, minifies and bundles the files and puts them into the `build`
folder based on the `rollup.config.js`.

With the `npm run srv` the content of the `build` folder can be served in browser.
_Note: the mock API endpoints are not mounted in the server at the moment._

## Testing

Both test level uses the Mocha framework to define test cases and organize test suites.
The functionalities provided by Mocha can be freely used to control test executions like
the `.only` or the `.skip` modifiers which can be appended to any `describe` or `it` block.

### Component tests

Component tests are implemented in the Mocha test framework. The tests are run with the Web Test Runner
framework. The WTR framework is using Playwright to fetch the necessary browsers to run the tests.
Playwright fetches the browsers and starts up test execution. Tests are run in the Chromium and Firefox
browsers sequentially.

Tests are located under a special folder called `test`.

Run tests in Headless Chromium and Firefox (with test coverage):

```bash
npm run test                  # Run tests in both Chromium and Firefox
npm run test:watch            # Run tests only in Chromium and watch for changes. This is used for debugging.
npm run test:install          # Fetch Playwright browsers (required to be run once,
                              # before executing component tests)
npm run test:chrome           # Launches Google Chrome in the current env
npm run test:watch:chrome     # Debug tests in Google Chrome
```

Run `npm run test:watch` to start in normal Chromium (with test coverage). Useful to develop or debug
component tests as breakpoints can be added to the execution.
To debug in Firefox open the same url in Firefox.

#### In Docker

Run tests in docker image. Useful to reproduce issues with CI runs. To do this you need Docker and bob
configured in your [development environment](dev-env.md).

```bash
bob test-ui
```

### E2E tests

For E2E testing the WebdriverIO framework is used, which is a selenium based execution framework.
For test definition the Mocha framework used here. These tests are different from component tests
as test are run in NodeJs and they control a browser instance to perform various tasks.
Then the test can make asserts against the visible DOM.

Before starting the Selenium tests some preliminary steps need to be taken. The mocks need to be built,
the Portal needs to be built, all UI assets need to be served and the backend endpoints need to be mocked
similarly to the dev server.

```bash
# Build mock applications in /mock/domain-ui-generic folder
npm run build:dev
# Build the UI from the /frontend folder
npm run build:selenium
# Start the serving the UI assets and the backend mocks
npm run serveBuild
```

Test files are located in the `test_js/specs` folder. To implement tests the PageObject pattern
is followed where there are predefined Objects which describe some part of the UI. These
PageObjects contain the low level logic how a given element can be found in the DOM. The tests
themselves only interact with these POs, making them mostly readable even for non-developers.
PageObject are located in the `test_js/page-object` folder.

The configuration for the WebdriverIO is `test_js/config/wdio.conf.js`. This file parses the
CLI for arguments and can alter the actual runtime configuration based on them.

```bash
npm run e2e:local   # execute all selenium files from the specs folder.
npm run e2e:local -- --spec <path to a spec file> # execute only the specified file
```

The runner will open the latest stable Chrome from [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/)
and start to execute the test steps. After all spec files are processed the browser is closed and
the test execution result can be checked in the console.
For CI execution a HTML based reporter is configured for better test reports.

### Integration tests

The frontend integration tests are in the root of the git repo in the integration-tests/test/ui folder.

Integration tests of the frontend are tests ensuring the frontend integration with the backend service
e.g. all system and app cards appear on the frontend discovered by the backend.
These tests use the WebdriverIO framework like the E2E tests.

## Debugging

The quickest debugging option is to use the built in tools provided by browsers. In developer
tools both the test and source files can be opened and breakpoints can be added.

This works for UI development and also for developing _component_ tests.

### Debug UI

It is possible to use the VSCode Debugger for debugging the UI application. This way it is possible
to add breakpoints inside VSCode, to use the debug console and so on.
It starts a Chrome instance then the VSCode is attached to it to take over the development toolbar.
The browser can be used normally and will react to breakpoints added to the source code.
Then the debug options of the VSCode can be used to inspect the current state.

The debugger will open `localhost:8080` with the Chrome instance.
To start UI debugging do the following from the `Run and Debug` menu:

1. **Serve Frontend**:
   In order to run the UI the UI files must be served so they could be opened in the browser for debugging.

2. **Launch Frontend Debugging**:
   This second step opens the Chrome browser and attaches VSCode to it. After the attach
   the execution stops at breakpoints added in VSCode while the browser can be interacted
   and refreshed as well.

### Debug component tests

1. Start Web Test Runner in watch mode:
   Either run `npm run test:watch` from command line or use the
   **Start and debug frontend component tests** debug option in VSCode.
   Then the tests can be edited in VSCode while debugging and development.

2. Follow the test menu options:
   Tests can be executed also in browser, while breakpoints can be added both to
   the test and the application source code.

### Debug Selenium tests

It is possible to quickly start the currently opened test file and add breakpoints to them.

- Start the server: `npm run serveBuild`
- Select `WebdriverIO` debug config
- Add break points to spec or PageObject files
- Run tests with `F5` or with the green play button to execute the currently open test file

!> There are limitations in debugging due to NodeJS and WebdriverIO. The WebdriverIO commands
are asynchronous methods but all of them is wrapped to be usable in synchronous fashion. Due to this
the WebdriverIO commands cannot be executed in the debug console directly. Doing so can hang up the
test execution process.

In case Selenium tests are running via Docker Compose (docker login is needed to the used ARM repository),
add below code snippet to `afterTest` method of `wdio.conf.js` to see browser console logs
(note that only works for warnings and errors):

```js
  async afterTest(test, context, { passed }) {
    const logs = await browser.getLogs('browser');
    logs?.forEach( (log) => console.warn(`[BROWSER] [${log.level}] ${log.message}`));
    ...
  }
```

If you would like to check the UI in local browser, add port forwarding to Docker Compose config:

```yaml
  mock-server:
    ...
    ports:
      - 8080:8080
```
