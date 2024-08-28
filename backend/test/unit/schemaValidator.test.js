import { expect } from 'chai';
import { createRequire } from 'module';
import { schemaValidator } from '../../utils/schemaValidator.js';

const require = createRequire(import.meta.url);
const originalJsonConfig = require('../mocks/configs/domain-app1.config.json');
const manualConfig = require('../../schemas/manualServiceConfig.json');

const VALID_URLS = [
  'https://seliics01586-01.ete.ka.sw.ericsson.se/eea/manualConfig.json',
  'http://blog.example.com',
  'https://www.example.com',
  'http://www.example.com',
  'http://www.example.com/product',
  'http://www.example.com/~product?id=1&page=2',
  'https://www.example.com?up=1',
  'http://www.site.com:8008',
  'http://255.255.255.255:9091/#sdf?sdfsf=1&b=2',
  'https://54.197.211.216',
];

const INVALID_URLS = [
  'seliics01586-01.ete.ka.sw.ericsson.se/eea/manualConfig.json',
  'https://seliics01586-01.ete.ka.sw.ericsson.se/eea/manualConfig.json.',
  'http://blog.example.com?',
  'www.example.com',
  'example.com',
];

describe('Unit tests for schemaValidator.js', () => {
  it('can successfully validate a json file', () => {
    const result = schemaValidator.validateConfig(originalJsonConfig);
    expect(result.valid).to.be.true;
  });

  it('can detect invalid schema', () => {
    // Deep-copy it as it can break other tests, since the same reference is used
    const jsonConfig = JSON.parse(JSON.stringify(originalJsonConfig));
    delete jsonConfig.apps[0].name;
    const result = schemaValidator.validateConfig(jsonConfig);
    expect(result.valid).to.be.false;
    expect(result.errors[0].message).to.eq('requires property "name"');
  });

  it('URL regex should match valid URLs', () => {
    const urlPattern = new RegExp(manualConfig.items.properties.URL.pattern);

    VALID_URLS.forEach((validUrl) => {
      expect(urlPattern.test(validUrl), `this URL should pass: ${validUrl}`).to.be.true;
    });
  });

  it('URL regex should not match invalid URLs', () => {
    const urlPattern = new RegExp(manualConfig.items.properties.URL.pattern);

    INVALID_URLS.forEach((invalidUrl) => {
      expect(urlPattern.test(invalidUrl), `this URL should not pass: ${invalidUrl}`).to.be.false;
    });
  });
});
