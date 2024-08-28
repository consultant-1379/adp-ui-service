/* eslint consistent-return:0 */
import { string } from 'rollup-plugin-string';
import { fromRollup } from '@web/dev-server-rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';
import gzipPlugin from 'rollup-plugin-gzip';
import alias from '@rollup/plugin-alias';
import devOptions from './dev/ui-service-dev.js';
import importMap from './dev/importMapGenerator.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const replaceCss = fromRollup(string);
const commonJSPlugin = fromRollup(commonjs);
const nodeResolvePlugin = fromRollup(nodeResolve);
const nodePoly = fromRollup(nodePolyfills);
const gzip = fromRollup(gzipPlugin);
const aliasPlugin = fromRollup(alias);

const brotliPromise = promisify(brotliCompress);

const hmr = process.argv.includes('--hmr');
const removeVersionQuery = (context) => context.url.replace('?version=__VERSION__', '');

let userInfoEnabled = true;

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  nodeResolve: {
    extensions: ['.mjs', '.cjs', '.js'],
    preferBuiltins: false,
  },
  open: './',
  watch: !hmr,
  port: 8080,
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
    gzip({
      customCompression: (content) => brotliPromise(Buffer.from(content)),
      fileName: '.br',
    }),
  ],
  mimeTypes: {
    '**/index.css': 'css',
    // es-module-shim will convert to cssStylesheet, import for definition needs to be a string
    // Force application/javascript mimetype for all other css files
    '**/*.css': 'js',
  },
  middleware: [
    // Middleware uses Koa syntax -> https://github.com/koajs/koa
    // Warning!!!: Don't use destructuring on context when reading values, throws errors
    function mockExternals(context, next) {
      // Sample for mocking external service responses
      // if(context.url === '/rest/v1'){
      //   context.body = {
      //     mock: 'response',
      //   }
      //   // Return undefined serves the result in current state
      //   return;
      // }
      // Signal move to next middleware function, do not remove
      return next();
    },
    function userInfo(context, next) {
      if (removeVersionQuery(context) === '/userpermission/v1/userinfo') {
        if (userInfoEnabled) {
          context.body = JSON.stringify(devOptions.userinfo);
        } else {
          context.response.status = 400;
        }
        return;
      }
      return next();
    },
    function userInfoEnable(context, next) {
      if (removeVersionQuery(context) === '/testing/userinfo/enable') {
        userInfoEnabled = true;
        return;
      }
      return next();
    },
    function userInfoDisable(context, next) {
      if (removeVersionQuery(context) === '/testing/userinfo/disable') {
        userInfoEnabled = false;
        return;
      }
      return next();
    },
    function serve(context, next) {
      if (removeVersionQuery(context).includes('/serve/')) {
        // e.g. request url: /serve/e-ui-app-1/apps/checkboxes/checkboxes.js
        // file to be responded: ../../mock/domain-ui-generic/public/e-ui-app-1/build/apps/checkboxes/checkboxes.js
        const regex = /.*\/serve/;
        const urlWithoutVersion = removeVersionQuery(context);
        const matches = urlWithoutVersion.match(regex);
        const mockPath = urlWithoutVersion.split(matches[0])[1];
        const mockId = mockPath.split('/')[1];
        const filePath = path.join(
          __dirname,
          `../mock/domain-ui-generic/public/${mockId}/build`,
          mockPath.replace(`/${mockId}`, ''),
        );

        if (fs.existsSync(filePath)) {
          const body = fs.readFileSync(filePath);
          context.response.status = 200;
          context.type = context.url.endsWith('.css') ? 'text/css' : 'application/javascript';
          context.body = body;
        } else {
          context.response.status = 404;
        }
        return;
      }
      return next();
    },
    function logs(context, next) {
      if (removeVersionQuery(context) === '/ui-logging/v1/logs') {
        context.response.status = 200;
        return;
      }
      return next();
    },
    function devImportMap(context, next) {
      if (removeVersionQuery(context) === '/ui-serve/v1/import-map') {
        importMap.imports['@adp/ui-components'] = './libs/shared/@adp/ui-components/src/index.js';
        context.body = JSON.stringify(importMap);
        // Return undefined serves the result in current state
        return;
      }
      return next();
    },
    function appMeta(context, next) {
      if (removeVersionQuery(context) === '/ui-meta/v1/apps') {
        // TODO add extras
        context.body = JSON.stringify(devOptions.apps);
        // Return undefined serves the result in current state
        return;
      }
      return next();
    },
    function componentMeta(context, next) {
      if (removeVersionQuery(context) === '/ui-meta/v1/components') {
        // TODO add extras
        context.body = JSON.stringify(devOptions.components);
        // Return undefined serves the result in current state
        return;
      }
      return next();
    },
    function groupMeta(context, next) {
      if (removeVersionQuery(context) === '/ui-meta/v1/groups') {
        // TODO add extras
        context.body = JSON.stringify(devOptions.groups);
        // Return undefined serves the result in current state
        return;
      }
      return next();
    },
    function actionsMeta(context, next) {
      if (removeVersionQuery(context) === '/ui-meta/v1/actions') {
        // TODO add extras
        context.body = JSON.stringify({ actions: devOptions.actions });
        // Return undefined serves the result in current state
        return;
      }
      return next();
    },
    function nodePolyfillFix(context, next) {
      if (removeVersionQuery(context) === '/node_modules/buffer/index.js') {
        // rollup-plugin-node-polyfills is incorrectly replacing global buffer with npm
        // version installed by another dependency which does not work.
        // Send it to the correct place.
        // Buffer installed as a sub-dependency of @wdio/cli
        context.redirect('/node_modules/rollup-plugin-node-polyfills/polyfills/buffer-es6.js');
        return;
      }
      return next();
    },
    function publicAssets(context, next) {
      // Don't mess with any of these requests
      const nonPublic = ['/src', '/node_modules', '/__web-dev-server'];
      for (const folder of nonPublic) {
        if (context.url.startsWith(folder)) {
          return next();
        }
      }

      // Send everything else to public folder
      context.url = `public${context.url}`;
      return next();
    },
    // Do not define any further middleware after this point
    // Anything marked with next will now be passed through
    // the web-dev-server middleware and compiled if needed.
  ],
});
