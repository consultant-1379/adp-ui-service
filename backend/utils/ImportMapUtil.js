import semver from 'semver';
import { createRequire } from 'module';
import configManager from '../config/configManager.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../config/api-config.json');

const stripSlash = (str) => str.match(/^\/?(.*?)\/?$/)[1];
const concatPath = (...args) =>
  args
    .map(stripSlash)
    .filter((arg) => !!arg)
    .join('/');

class ImportMapUtil {
  /**
   * Calculates Module-list and Import-map for the serve endpoints
   */

  mergePackageList(packageList) {
    const packages = [];
    packageList.forEach((packageItem) => {
      packages.push(
        ...packageItem.meta.modules.map((value) => [
          `${value.name}@${value.version}`,
          {
            ...value,
            path: value.path,
            serviceName: packageItem.name,
            serviceUID: packageItem.uid,
          },
        ]),
      );
    });

    return Object.fromEntries(packages);
  }

  processId(packageID) {
    const namespaced = packageID.startsWith('@');
    if (namespaced) {
      packageID = packageID.slice(1);
    }
    let [name] = packageID.split('@');
    const [, version] = packageID.split('@');
    if (namespaced) {
      name = `@${name}`;
      packageID = `@${packageID}`;
    }
    return { name, version, packageID };
  }

  compareId({ name: nameA, version: versionA }, { name: nameB, version: versionB }) {
    const nameCompare = nameA.localeCompare(nameB);
    const versionCompare = semver.compare(versionA, versionB);
    return nameCompare || versionCompare;
  }

  resolveVersion(packageToFind, packages) {
    if (packageToFind in packages) {
      return packages[packageToFind];
    }
    const { name: nameToFind, version: versionToFind } = this.processId(packageToFind);
    const bestMatch = Object.keys(packages)
      .map(this.processId)
      .filter(({ name }) => name === nameToFind)
      .filter(({ version }) => semver.satisfies(version, versionToFind))
      .sort((a, b) => semver.compare(a.version, b.version))
      .slice(-1)[0];
    return packages?.[bestMatch?.packageID];
  }

  calculateImportMap(packageMap) {
    const packages = this.mergePackageList(Object.values(packageMap));
    const importMapEntries = {};
    const importMapScopes = {};

    const sortedPackages = Object.keys(packages).map(this.processId).sort(this.compareId);

    sortedPackages.forEach(({ name, packageID }) => {
      const packageItem = this.resolveVersion(packageID, packages);
      if (packageItem) {
        const { serviceUID, path, main, version } = packageItem;
        const basePath = `/${concatPath(
          configManager.ingressPath(),
          apiConfig.serve.prefix,
          apiConfig.serve.routes.static.path,
          serviceUID,
          path,
        )}/`;
        const mainPath = `/${concatPath(basePath, main)}`;
        importMapEntries[`${name}`] = mainPath;
        importMapEntries[`${name}.js`] = mainPath;
        importMapEntries[`${name}/`] = basePath;
        importMapEntries[`${name}@${version}`] = mainPath;
        importMapEntries[`${name}@${version}/`] = basePath;
      }
    });

    Object.entries(packages).forEach(([, packageItem]) => {
      if ('dependencies' in packageItem) {
        const scope = {};
        Object.entries(packageItem.dependencies).forEach(([name, version]) => {
          const dependencyModule = this.resolveVersion(`${name}@${version}`, packages);
          if (dependencyModule) {
            const { serviceUID, path, main } = dependencyModule;
            const basePath = `/${concatPath(
              configManager.ingressPath(),
              apiConfig.serve.prefix,
              apiConfig.serve.routes.static.path,
              serviceUID,
              path,
            )}/`;
            const mainPath = `/${concatPath(basePath, main)}`;
            scope[`${name}`] = mainPath;
            scope[`${name}.js`] = mainPath;
            scope[`${name}/`] = basePath;
          }
        });
        const pathPrefix = `/${concatPath(
          configManager.ingressPath(),
          apiConfig.serve.prefix,
          apiConfig.serve.routes.static.path,
          packageItem.serviceUID,
          packageItem.path,
          packageItem.main,
        )}`;
        importMapScopes[pathPrefix] = scope;
      }
    });

    return {
      imports: importMapEntries,
      scopes: importMapScopes,
    };
  }
}

export default new ImportMapUtil();
