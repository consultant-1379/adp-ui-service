import * as fs from 'fs';
import yaml from 'js-yaml';

// arguments
const cliArgs = process.argv.slice(2);
const dependencyFile = cliArgs[0];
const outDependencyFileUnRegistered = cliArgs[1];
const dependencies = yaml.load(fs.readFileSync(dependencyFile, 'utf8'));

console.log(`
===============================================================================
Processing dependency file: ${dependencyFile}
`);

const isUnregistered = (dependency) => dependency.bazaar.register !== 'no';

dependencies.dependencies = dependencies.dependencies.filter(isUnregistered);
fs.writeFileSync(
  `${outDependencyFileUnRegistered}`,
  yaml.dump(dependencies, { noArrayIndent: true, lineWidth: 1000 }),
  'utf8',
);
console.log(`
Input file ${dependencyFile} is filtered to unregistered components in ${outDependencyFileUnRegistered}
===============================================================================
`);
