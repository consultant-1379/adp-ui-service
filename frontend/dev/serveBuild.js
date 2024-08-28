/* eslint-disable import/no-extraneous-dependencies */
import Koa from 'koa';
import serve from 'koa-static';
import mount from 'koa-mount';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';
import { glob } from 'glob';
import config from '../web-dev-server.config.js';

const PORT = 8080;
const BUILD_PATH = '../build';
const UI_PATH = '/ui';
const BACKEND_PATH = '/';
const FRONTEND_CONFIG = '/deployment-config/frontend-config.json';
const CONFIG_PACKAGE_JSON = './config.package.json';
const MOCKS_FOLDER = '../../mock/domain-ui-generic/';
const PUBLIC_FOLDER = 'domain-ui-generic/public';

const { middleware } = config;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = new Koa();

const buildDir = path.join(__dirname, BUILD_PATH);
console.log(`Static files are served from: ${buildDir}`);

const frontendConfigFile = readFileSync(path.join(buildDir, FRONTEND_CONFIG));
let frontendConfigJson;
try {
  frontendConfigJson = JSON.parse(frontendConfigFile);
} catch (err) {
  console.error(err);
}

app.use(
  // eslint-disable-next-line prefer-arrow-callback
  function uiPathRedirect(context, next) {
    if (context.url === UI_PATH) {
      context.redirect(`${UI_PATH}/`);
      return;
    }
    // eslint-disable-next-line consistent-return
    return next();
  },
);

app.use(
  // eslint-disable-next-line prefer-arrow-callback
  mount(UI_PATH, function uiConfigHandler(context, next) {
    if (context.url === FRONTEND_CONFIG) {
      frontendConfigJson.rest = {};
      frontendConfigJson.rest.path = `${BACKEND_PATH}`;
      context.body = JSON.stringify(frontendConfigJson);
      return;
    }
    // eslint-disable-next-line consistent-return
    return next();
  }),
);

const configPackageFile = readFileSync(path.join(buildDir, CONFIG_PACKAGE_JSON));
let configPackageJson;
try {
  configPackageJson = JSON.parse(configPackageFile);
} catch (err) {
  console.error(err);
}

const mockConfigPackageFiles = glob.sync(
  path.join(__dirname, `${MOCKS_FOLDER}**/build/config.package.json`),
);

let mockModules = [];
for (const file of mockConfigPackageFiles) {
  const fileContent = readFileSync(file);
  const mockId = file.split(PUBLIC_FOLDER)[1].split('/')[1];
  try {
    const packages = JSON.parse(fileContent);
    mockModules = [...mockModules, ...packages.modules.map((module) => ({ ...module, mockId }))];
  } catch (err) {
    console.error(err);
  }
}

app.use(
  // eslint-disable-next-line prefer-arrow-callback
  mount(BACKEND_PATH, function importMapHandler(context, next) {
    if (context.url.includes('/ui-serve/v1/import-map')) {
      const importMap = {};

      for (const module of configPackageJson.modules) {
        importMap[module.name] = path.join(UI_PATH, module.path, module.main);
      }

      for (const module of mockModules) {
        if (!(module.name in importMap)) {
          importMap[module.name] = path.join(
            BACKEND_PATH,
            `/serve/${module.mockId}/`,
            module.path,
            module.main,
          );
        }
      }

      context.body = JSON.stringify({ imports: importMap });
      return;
    }
    // eslint-disable-next-line consistent-return
    return next();
  }),
);

app.use(mount(UI_PATH, serve(buildDir)));

middleware.forEach((mw) => app.use(mount(BACKEND_PATH, mw)));

console.log(`The built UI is served at: http://localhost:${PORT}/ui`);
app.listen(PORT);
