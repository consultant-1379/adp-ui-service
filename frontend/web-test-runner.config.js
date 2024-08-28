import { string } from 'rollup-plugin-string';
import { fromRollup } from '@web/dev-server-rollup';
import { defaultReporter, summaryReporter } from '@web/test-runner';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';
import injectProcessEnv from 'rollup-plugin-inject-process-env';

import mockMiddleware from './test/test-utils/mockMiddleware.js';
import CONSTANT from './test/test-utils/constants.js';
import reporter from './test/test-utils/reporter.js';
import devOptions from './dev/ui-service-dev.js';

import importMap from './dev/importMapGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const replaceCss = fromRollup(string);
const commonJSPlugin = fromRollup(commonjs);
const nodeResolvePlugin = fromRollup(nodeResolve);
const nodePoly = fromRollup(nodePolyfills);
const aliasPlugin = fromRollup(alias);
const injectProcessPlugin = fromRollup(injectProcessEnv);

let userInfoEnabled = true;

export default {
  testRunnerHtml: (testFramework) =>
    `<html>
    <body>
      <!-- process variable needed for floating-ui. Falls over otherwise as files are not rolled up -->
      <script type="module"
        src="../../node_modules/@webcomponents/scoped-custom-element-registry/scoped-custom-element-registry.min.js"></script>
      <script type="module"
        src="../../node_modules/es-module-shims/dist/es-module-shims.js"></script>
      <script type="module-shim" src="${testFramework}"></script>
    </body>
  </html>`,
  coverage: true,
  coverageConfig: {
    exclude: ['**/node_modules/**/*', '**/web_modules/**/*', '**/npm/**/*', '**/locale/**'],
    include: ['**/src/**'],
  },
  nodeResolve: {
    extensions: ['.mjs', '.cjs', '.js'],
    preferBuiltins: false,
  },
  concurrentBrowsers: 1, // Not is base config
  browserStartTimeout: 300_000, // Not is base config
  mimeTypes: {
    '**/index.css': 'css',
    // es-module-shim will convert to cssStylesheet, import for definition needs to be a string
    // Force application/javascript mimetype for all other css files
    '**/*.css': 'js',
  },
  plugins: [
    aliasPlugin({
      entries: [
        {
          find: 'error-app',
          replacement: path.join(__dirname, 'src/apps/error-app/error-app.js'),
        },
      ],
    }),
    replaceCss({ include: ['**/*.css', '**/*.json'] }),
    nodeResolvePlugin({
      extensions: ['.mjs', '.cjs', '.js'],
      preferBuiltins: false,
    }),
    commonJSPlugin({
      extensions: ['.js', '.cjs'],
      requireReturnsDefault: 'preferred',
    }),
    nodePoly(),
    injectProcessPlugin({
      NODE_ENV: 'test',
    }),
  ],
  files: 'test/**/*.test.js',
  reporters: [
    defaultReporter({ reportTestResults: false, reportTestProgress: true }),
    summaryReporter(),
    reporter(),
  ],
  testFramework: {
    config: {
      timeout: CONSTANT.ROOT_WAIT_TIMEOUT * 2,
    },
  },
  middleware: [
    mockMiddleware,
    function userInfo(context, next) {
      if (context.url === '/userpermission/v1/userinfo') {
        if (userInfoEnabled) {
          context.body = JSON.stringify(devOptions.userinfo);
        } else {
          context.response.status = 400;
        }
      }
      return next();
    },
    function userInfoEnable(context, next) {
      if (context.url === '/testing/userinfo/enable') {
        userInfoEnabled = true;
      }
      return next();
    },
    function userInfoDisable(context, next) {
      if (context.url === '/testing/userinfo/disable') {
        userInfoEnabled = false;
      }
      return next();
    },
    function devImportMap(context, next) {
      if (context.url === '/ui-serve/v1/import-map') {
        importMap.imports['@adp/ui-components'] = './libs/shared/@adp/ui-components/src/index.js';
        context.body = JSON.stringify(importMap);
        // Return undefined serves the result in current state
        return next();
      }
      return next();
    },
    function nodePolyfillFix(context, next) {
      if (context.url === '/node_modules/buffer/index.js') {
        // rollup-plugin-node-polyfills is incorrectly replacing global buffer with npm
        // version installed by another dependency which does not work.
        // Send it to the correct place.
        // Buffer installed as a sub-dependency of @wdio/cli
        context.redirect('/node_modules/rollup-plugin-node-polyfills/polyfills/buffer-es6.js');
        return next();
      }
      return next();
    },
    function publicAssets(context, next) {
      // Don't mess with any of these requests
      const nonPublic = [
        '/src',
        '/node_modules',
        '/__web-dev-server__',
        '/?wtr-session-id',
        '/__web-test-runner__',
        '/test',
      ];
      for (const folder of nonPublic) {
        if (context.url.startsWith(folder)) {
          return next();
        }
      }

      // Send everything else to public folder
      context.url = `/public${context.url}`;
      return next();
    },
  ],
};
