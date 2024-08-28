import { expect } from 'chai';
import { createRequire } from 'module';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';
import configManagerMock from '../mocks/modules/configManagerMock.js';

const require = createRequire(import.meta.url);
const samplePackageMap = require('../mocks/dummyfiles/domain-app1-package-map.json');

const UNIQUE_SAMPLE_DEPENDENCIES = 3;
const SAMPLE_INGRESS_PATH = '/Demo';
describe('ImportMap generation', () => {
  let importMapUtil;
  let mergedPackageMap;
  let sampleLength = 0;
  const modules = [];

  const mockModules = async () => {
    await td.replaceEsm('../../services/logging.js', { ...loggingMock });
    await td.replaceEsm('../../config/configManager.js', null, configManagerMock);
    importMapUtil = (await import('../../utils/ImportMapUtil.js')).default;
    td.reset();
  };

  before(async () => {
    await mockModules();
    mergedPackageMap = importMapUtil.mergePackageList(Object.values(samplePackageMap));
    Object.keys(samplePackageMap).forEach((service) => {
      sampleLength += samplePackageMap[service].meta.modules.length;
      modules.push(...samplePackageMap[service].meta.modules);
    });
  });

  it('Merge packageMap into package list', () => {
    expect(Object.keys(mergedPackageMap)).to.have.lengthOf(sampleLength);
  });

  it('Calculates importMap based on packages, precedes entries with ingress path from GAS config', () => {
    configManagerMock.ingressPath = () => SAMPLE_INGRESS_PATH;
    const importMap = importMapUtil.calculateImportMap(samplePackageMap);
    const uniqueModules = [...new Set(modules.map((module) => module.name))];
    // Unique modules have 5 occurrences, non-unique ones only 2 (the versioned ones)
    const importMapLength = uniqueModules.length * 5 + (modules.length - uniqueModules.length) * 2;
    const scopeKeys = Object.keys(importMap.scopes);
    const scopeEntries = Object.values(importMap.scopes)
      .map((scopeEntry) => Object.values(scopeEntry))
      .flat();

    expect(
      Object.values(importMap.imports).every((importPath) =>
        importPath.startsWith(SAMPLE_INGRESS_PATH),
      ),
    ).to.be.true;

    expect(scopeKeys.every((scopeKey) => scopeKey.startsWith(SAMPLE_INGRESS_PATH))).to.be.true;
    expect(scopeEntries.every((scopeEntry) => scopeEntry.startsWith(SAMPLE_INGRESS_PATH))).to.be
      .true;

    expect(Object.keys(importMap.imports)).to.have.lengthOf(importMapLength);
    expect(Object.keys(importMap.scopes).length).to.be.eq(UNIQUE_SAMPLE_DEPENDENCIES);
  });
});
