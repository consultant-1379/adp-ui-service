import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commandArgs = process.argv.slice(2);
const shouldValidate = commandArgs.includes('--validate-schema-examples');
const shouldGenerate = commandArgs.includes('--generate');

const SCHEMAS = [
  {
    schemaPath: path.join(__dirname, '..', 'ui-logging/specs/ui.logging.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/ui.logging.md'),
  },
  {
    schemaPath: path.join(__dirname, '..', 'ui-meta/specs/gui.domain.web.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/gui.domain.web.md'),
  },
  {
    schemaPath: path.join(__dirname, '..', 'ui-meta/specs/ui.meta.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/ui.meta.md'),
  },
  {
    schemaPath: path.join(__dirname, '..', 'ui-serve/specs/gui.domain.package.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/gui.domain.package.md'),
  },
  {
    schemaPath: path.join(__dirname, '..', 'ui-serve/specs/ui.serve.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/ui.serve.md'),
  },
  {
    schemaPath: path.join(__dirname, '..', 'ui-serve/specs/ui.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/ui.md'),
  },
  {
    schemaPath: path.join(__dirname, '..', 'userpermission/specs/userpermission.spec.yaml'),
    outputFile: path.join(__dirname, '..', 'markdown/userpermission.md'),
  },
];

const validateExamples = ({ schemaPath }) => {
  const command = `${path.join(
    'node_modules',
    '.bin',
    'openapi-examples-validator',
  )} ${schemaPath}`;

  console.log(`Executing command: ${command}`);

  execSync(command, { stdio: 'inherit' });
};

const generateMarkdown = ({ schemaPath, outputFile }) => {
  const command =
    `${path.join('node_modules', '.bin', 'widdershins')}` +
    ` --search false` +
    ` --resolve true` +
    ` --theme 'darkula'` +
    ` --summary` +
    ` --code true` +
    ` --language_tabs 'javascript:JavaScript'` +
    ` --user_templates=./templates/openapi3` +
    ` -o ${outputFile}` +
    ` ${schemaPath}`;

  console.log(`Executing command: ${command}`);

  execSync(command, { stdio: 'inherit' });
};

SCHEMAS.forEach((schemaData) => {
  if (shouldValidate) {
    validateExamples(schemaData);
  }
  if (shouldGenerate) {
    generateMarkdown(schemaData);
  }
});
