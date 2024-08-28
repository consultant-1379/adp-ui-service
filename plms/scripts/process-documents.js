import * as fs from 'fs';
import yaml from 'js-yaml';

// ------------- MAIN -------------------

const docNames = {
  pri: 'PRI',
  'user-guide': 'Service User Guide',
  'dev-guide': 'Application Developers Guide',
  'risk-assessment': 'RA and PIA',
  'vul-anal': 'Vulnerability Analysis Report',
  'test-spec': 'Test Specification',
  'test-report': 'Test Report',
  'sec-coding': 'Secure Coding Report',
  'characteristics-report': 'Characteristics Report',
  'k8s-test-report': 'K8S Robustness Report',
  api: 'Interface Description',
};

// arguments
const cliArgs = process.argv.slice(2);
const generatedDocumentList = cliArgs[0];
const result = cliArgs[1];
const docList = yaml.load(fs.readFileSync(cliArgs[0], 'utf8'));
const docKeyValuePairs = [];

console.log(`Processing file: ${generatedDocumentList}`);

Object.keys(docNames).forEach((docName) => {
  const regex = new RegExp(docNames[docName]);
  const foundDoc = docList.find((doc) => regex.test(doc.title));
  if (foundDoc) {
    docKeyValuePairs.push(`"${docName}-title=${foundDoc.title}"`);
    docKeyValuePairs.push(`"${docName}-id=${foundDoc.doc_number}"`);
    docKeyValuePairs.push(`"${docName}-rev=${foundDoc.revision}"`);
    console.log(`Document ${docNames[docName]} parameters are parsed successfully`);
  } else {
    console.log(`Document ${docNames[docName]} not found!`);
  }
});

fs.writeFileSync(`${result}`, docKeyValuePairs.join(' '), 'utf8');

console.log('Documents are parsed successfully');
