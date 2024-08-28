import * as fs from 'fs';
import yaml from 'js-yaml';

// ------------- MAIN -------------------

// arguments
const cliArgs = process.argv.slice(2);
const fileDep = cliArgs[0];
const fileDepSkip = cliArgs[1];
const dependencies = yaml.load(fs.readFileSync(fileDep, 'utf8'));
const skipDependencies = yaml.load(fs.readFileSync(fileDepSkip, 'utf8'));

console.log(`Processing file: ${fileDep}`);

console.log(`Will be skipped: ${skipDependencies.dependencies}`);

let filtered = [];

// Filter By PRIM ID
filtered = filtered.concat(
  dependencies.dependencies.filter((dependency) =>
    skipDependencies.dependencies.includes(dependency.bazaar.prim.trim()),
  ),
);

dependencies.dependencies = dependencies.dependencies.filter(
  (dependency) => !skipDependencies.dependencies.includes(dependency.bazaar.prim.trim()),
);

// Filter By Module Name
filtered = filtered.concat(
  dependencies.dependencies.filter((dependency) =>
    skipDependencies.dependencies.find((toBeskipped) => dependency.ID.startsWith(toBeskipped)),
  ),
);

dependencies.dependencies = dependencies.dependencies.filter(
  (dependency) =>
    !skipDependencies.dependencies.find((toBeskipped) => dependency.ID.startsWith(toBeskipped)),
);

fs.writeFileSync(
  `${fileDep}`,
  yaml.dump(dependencies, { noArrayIndent: true, lineWidth: 1000 }),
  'utf8',
);
console.log(`Dependencies are skipped from ${fileDep} successfully`);
console.log(`Skipped modules: ${filtered.map((dependency) => dependency.ID).join('; ')}`);
