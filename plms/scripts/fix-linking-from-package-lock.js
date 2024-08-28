import * as fs from 'fs';
import yaml from 'js-yaml';

// ------------- MAIN -------------------

// arguments
const cliArgs = process.argv.slice(2);

const dependencyFile = cliArgs[0];
const dependencies = yaml.load(fs.readFileSync(dependencyFile, 'utf8'));

const packageJsonFile = cliArgs[1];
const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));

const linkingType = cliArgs[2];

const allowedLinking = ['', 'Dynamic', 'Static', 'Classpath', 'Not Linked'];
if (!allowedLinking.includes(linkingType)) {
  console.log(
    `linking type '${linkingType}' is invalid. Valid values: ${allowedLinking.join(', ')}`,
  );
  process.exit(1);
}

console.log(
  `Processing dependency file: ${dependencyFile} and package-lock.json: ${packageJsonFile}, with linking type: ${linkingType}`,
);

const flatDependencies = (packageConfig) => {
  const dependency = Object.entries(packageConfig.dependencies ?? {});
  return dependency.concat(dependency.flatMap(([, value]) => flatDependencies(value)));
};

const dependencyList = flatDependencies(packageJson)
  .filter(([, value]) => !value.dev)
  .map(([key, value]) => ({
    name: key,
    version: value.version,
  }));

const isIncluded = (name, version) =>
  dependencyList.find((dependency) => dependency.name === name && dependency.version === version);

let linkingsChanged = 0;
let totalMatchedLinking = 0;
let totalUnMatchedLinking = 0;
let totalEmptyLinking = 0;

dependencies.dependencies.forEach((dependency) => {
  if (dependency.versions.some((version) => isIncluded(dependency.name, version))) {
    totalMatchedLinking += 1;
    if (dependency.mimer.linking !== linkingType) {
      linkingsChanged += 1;
      dependency.mimer.linking = linkingType;
    }
  } else {
    totalUnMatchedLinking += 1;
  }
  if (!dependency.mimer.linking) {
    totalEmptyLinking += 1;
  }
});

console.log('---------- Linkings -------------');
console.log(`Number of dependencies located in package-lock: ${totalMatchedLinking}`);
console.log(`Number of changed dependencies linkings: ${linkingsChanged}`);
console.log(`Number of unchanged dependencies linkings: ${totalUnMatchedLinking}`);
console.log(`Number of remaining empty dependencies linkings: ${totalEmptyLinking}`);
console.log('---------------------------------');

fs.writeFileSync(
  `${dependencyFile}`,
  yaml.dump(dependencies, { noArrayIndent: true, lineWidth: 1000 }),
  'utf8',
);
console.log(`Input file ${dependencyFile} is updated with the linking attributes`);
