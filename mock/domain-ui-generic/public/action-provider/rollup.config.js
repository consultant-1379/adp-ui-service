/* eslint import/no-extraneous-dependencies:0 */
import path from 'path';
import { rmSync } from 'fs';
import { generateRollup, outDirectory } from '@eui/rollup-config-generator';
import { globSync } from 'glob';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import copy from 'rollup-plugin-copy';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const externalModules = require('./config/config.package.json').modules;

// just make sure our output dir is clean
try {
  rmSync(outDirectory, { recursive: true });
} catch (e) {
  // None exists
}

const userRollupConfig = {
  externals: [...externalModules.map((module) => module.name)],
  importMap: {
    imports: {
      '@eui/theme': './node_modules/@eui/theme/index.js',
    },
  },
};

const { euisdkRollupConfig } = generateRollup(userRollupConfig);

// remove 'html' plugin from @eui/rollup-config-generator because this app does not have ./public/index.html
const htmlPluginIndex = euisdkRollupConfig.plugins.findIndex(
  (plugin) => plugin.name === '@web/rollup-plugin-html',
);
euisdkRollupConfig.plugins.splice(htmlPluginIndex, 1);

// copy locale .json
const copyPluginIndex = euisdkRollupConfig.plugins.findIndex((plugin) => plugin.name === 'copy');
euisdkRollupConfig.plugins.splice(
  copyPluginIndex,
  0,
  copy({
    targets: [
      { src: 'apps/!(*.html|*.css|*.js)', dest: `${outDirectory}/apps/` },
      { src: 'config/!(*.html|*.css|*.js)', dest: `${outDirectory}/` },
    ],
    flatten: false, // Default true
  }),
);

// Allows the node builtins to be required/import: url, path, etc.
euisdkRollupConfig.plugins.push(nodePolyfills());

// Collecting source entries
// Need this step because by default @eui/rollup-config-generator search src files under /src folder
const jsfiles = globSync(['apps/**/*.js', './modules/*.js'], { posix: true });
const srcEntries = {};
const rootDirectory = process.cwd();

jsfiles.forEach((file) => {
  srcEntries[`${path.relative(path.resolve(rootDirectory), file).replace(/\.[^/.]+$/, '')}`] = file;
});

euisdkRollupConfig.input = { ...srcEntries, ...euisdkRollupConfig.input };

export default [euisdkRollupConfig];
