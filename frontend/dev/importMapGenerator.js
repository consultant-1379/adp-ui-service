import * as fs from 'fs';
import { glob } from 'glob';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const configPackageJson = require('../public/config.package.json');

const MOCKS_FOLDER = '../mock/domain-ui-generic/public/';

const imports = {};

function addModuleToImportmap(module, pathStart = '/') {
  const name = `${module.name}`;
  if (!(module.name in imports)) {
    let path =
      module.path[0] === '.'
        ? `${module.path.replace('.', '')}/${module.main}`
        : `${module.path}/${module.main}`;
    path = pathStart + path;
    imports[name] = path.replaceAll('//', '/');
  }
}

function readJSON(path) {
  const packageJson = JSON.parse(fs.readFileSync(path));
  packageJson.modules.forEach((module) => {
    addModuleToImportmap(module, `/serve/${path.replace(MOCKS_FOLDER, '').split('/')[0]}/`);
  });
}

configPackageJson.modules.forEach((module) => addModuleToImportmap(module));

const files = glob.sync(`${MOCKS_FOLDER}**/config.package.json`);
files.forEach((file) => readJSON(file));

export default { imports };
