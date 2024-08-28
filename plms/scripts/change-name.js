import { createRequire } from 'module';
import * as fs from 'fs';
import yaml from 'js-yaml';

const require = createRequire(import.meta.url);
const nameMapping = require('./name-mapping.json');

// arguments
const cliArgs = process.argv.slice(2);
const dependencyFile = cliArgs[0];
const direction = cliArgs[1];
if (!['scas', 'fossa'].includes(direction)) {
  console.log('Direction must be: "scas" | "fossa"');
  process.exit(1);
}
const dependencies = yaml.load(fs.readFileSync(dependencyFile, 'utf8'));

console.log(`Processing dependency file: ${dependencyFile}`);

// map name
dependencies.dependencies.forEach((dependency) => {
  if (direction === 'scas' && dependency.name in nameMapping) {
    dependency.name = nameMapping[dependency.name];
  }
  if (direction === 'fossa') {
    dependency.name = dependency.additional_info['fossa-attribution'].Title;
  }
});

fs.writeFileSync(
  `${dependencyFile}`,
  yaml.dump(dependencies, { noArrayIndent: true, lineWidth: 1000 }),
  'utf8',
);
console.log(
  `Input file ${dependencyFile} is processed, names are converted to ${direction} compatible`,
);
