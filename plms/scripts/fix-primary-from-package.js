import * as fs from 'fs';
import semver from 'semver';
import yaml from 'js-yaml';

const PRIMARY_FIELD = 'primary';
const DEFAULT_USAGE = 'Use as is';

// ------------- MAIN -------------------

// arguments
const cliArgs = process.argv.slice(2);
const dependencyFile = cliArgs[0];
const dependencies = yaml.load(fs.readFileSync(dependencyFile, 'utf8'));

const packageJsonFiles = cliArgs.slice(1);
const packageJsons = packageJsonFiles.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));

console.log(`Processing dependency file: ${dependencyFile} and package.jsons: ${packageJsonFiles}`);

const mergedPackageJsonDependencies = packageJsons
  .map((json) => json.dependencies)
  .reduce((acc, dep) => ({ ...acc, ...dep }), {});

// true if 3pp with this name exists in any package.json with a version that matches the version found by FOSSA
// e.g. (pkg vs fossa): 2.3.1 vs 2.3.1, ^2.3.1 vs 2.3.1 ... or ... ^2.3.1 vs 2.3.2, ^2.3.1 vs 2.4.0
const isPrimaryByPackageJson = (name, autoVersion) => {
  const versionInPackageJson = mergedPackageJsonDependencies[name];
  return versionInPackageJson && semver.satisfies(autoVersion, versionInPackageJson);
};
const isPrimaryOriginally = (dependency) => dependency[PRIMARY_FIELD]?.[0] === 'this';

const primaries = [];

dependencies.dependencies.forEach((dependency) => {
  const currentIsPrimary = isPrimaryOriginally(dependency);
  const desiredIsPrimary = isPrimaryByPackageJson(dependency.name, dependency.ID.split('+')[1]);
  if (currentIsPrimary !== desiredIsPrimary) {
    console.log(
      `[${dependency.ID}] changing primary to ${desiredIsPrimary} at root level and in mimer block`,
    );
    if (desiredIsPrimary) {
      dependency[PRIMARY_FIELD] = ['this'];
      dependency.mimer[PRIMARY_FIELD] = 'True';
    } else {
      dependency[PRIMARY_FIELD] = [''];
      dependency.mimer[PRIMARY_FIELD] = 'False';
    }
  }

  if (desiredIsPrimary) {
    primaries.push(dependency.ID);

    const generatedUsage = dependency.additional_info?.['fossa-attribution']?.Description;
    if (generatedUsage && dependency?.mimer?.usage && dependency?.mimer?.usage === DEFAULT_USAGE) {
      dependency.mimer.usage = generatedUsage;
    }
  }
});

console.log('---------- Primary Dependencies -------------');
console.log(primaries.join('\n'));
console.log('---------------------------------------------');

fs.writeFileSync(
  `${dependencyFile}`,
  yaml.dump(dependencies, { noArrayIndent: true, lineWidth: 1000 }),
  'utf8',
);
console.log(`Input file ${dependencyFile} is updated with the primary and mimer.usage attributes`);
