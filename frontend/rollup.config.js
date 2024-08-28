/* eslint import/no-extraneous-dependencies:0 */
import { rmSync } from 'fs';
import { generateRollup, outDirectory } from '@eui/rollup-config-generator';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import gzipPlugin from 'rollup-plugin-gzip';
import { glob } from 'glob';

const { VERSION } = process.env;

const brotliPromise = promisify(brotliCompress);

// just make sure our output dir is clean
try {
  rmSync(outDirectory, { recursive: true });
} catch (e) {
  // None exists
}

const userRollupConfig = {
  externals: [],
  importMap: {
    imports: {
      '@eui/container': './node_modules/@eui/container/index.js',
      '@eui/navigation-menu': './node_modules/@eui/navigation-menu/index.js',
      '@eui/action-framework': './node_modules/@eui/action-framework/index.js',
      '@eui/theme': './node_modules/@eui/theme/index.js',
      '@eui/component': './node_modules/@eui/component/index.js',
    },
  },
};

// Lookup every @adp/ui-components lib
const adpDistFolder = 'node_modules/@adp/ui-components/src';
const uiComponentsSrcFiles = glob.sync(`${adpDistFolder}/**/*.js`, {
  posix: true,
  ignore: [
    `${adpDistFolder}/**/*.css.js`,
    `${adpDistFolder}/**/*.json.js`,
    `${adpDistFolder}/constants.*`,
    `${adpDistFolder}/index.*`,
  ],
});

const adpRoutes = {};
uiComponentsSrcFiles.forEach((srcFile) => {
  const folder = srcFile.split('/')[4];
  const src = srcFile.split('/')[5];

  adpRoutes[`${adpDistFolder}/${folder}/${src}/${src}`] =
    `${adpDistFolder}/${folder}/${src}/${src}.js`;
});

const { euisdkRollupConfig } = generateRollup(userRollupConfig);

// Add @adp/ui-components libs to rollup inputs
euisdkRollupConfig.input = {
  ...adpRoutes,
  ...euisdkRollupConfig.input,
};

// Copy @adp/ui-components/ locale files
const copyPluginIndex = euisdkRollupConfig.plugins.findIndex((plugin) => plugin.name === 'copy');
euisdkRollupConfig.plugins.splice(
  copyPluginIndex,
  0,
  copy({
    targets: [
      {
        src: `${adpDistFolder}/!(*.html|*.css|*.js)`,
        dest: `${outDirectory}/node_modules/`,
      },
    ],
    flatten: false, // Default true
  }),
);

euisdkRollupConfig.plugins.push(
  replace({
    __VERSION__: encodeURIComponent(VERSION),
    include: [`**/initImportmap.js`],
    preventAssignment: true,
  }),
  nodePolyfills(), // Allows the node builtins to be required/import: url, path, etc.
  gzipPlugin({
    customCompression: (content) => brotliPromise(Buffer.from(content)),
    fileName: '.br',
  }),
);

export default [euisdkRollupConfig];
