import { expect } from 'chai';
import { censorObject } from '../../utils/formatUtil.js';

const baseTestObject = {
  k8sLabelPropertyName: 'ui.ericsson.com/part-of',
  dependencies: {
    prometheus: {
      enabled: true,
      endpointsToCountRequests: ['/gas-internal', '/ui-serve/v1/static'],
      arrayToHide: [1, 2, 3],
    },
    stdout: {
      password: 'qwertyIsTheStrongestPassword',
      enabled: true,
    },
    hostnames: ['eric-fh-alarm-handler'],
    tls: {
      ca: 'test ca value',
    },
    fieldToHide: 'extremely',
  },
};

const defaultHidingLine = 'HIDDEN';

describe('Unit tests for formatUtils.js', () => {
  it('censorObject should leave regular fields intact', () => {
    const censoredObject = censorObject(baseTestObject);

    expect(censoredObject.dependencies.prometheus.enabled).to.be.equal(
      baseTestObject.dependencies.prometheus.enabled,
    );

    expect(censoredObject.dependencies.hostnames[0]).to.be.equal(
      baseTestObject.dependencies.hostnames[0],
    );
  });

  it('censorObject should hide values using default config', () => {
    const censoredObject = censorObject(baseTestObject);
    expect(censoredObject.dependencies.stdout.password).to.be.equal(defaultHidingLine);

    expect(censoredObject.dependencies.tls.ca).to.be.equal(defaultHidingLine);
  });
  it('censorObject should hide values using custom config', () => {
    const censoredObject = censorObject(baseTestObject, ['fieldToHide', 'arrayToHide']);
    expect(censoredObject.dependencies.prometheus.arrayToHide).to.be.equal(defaultHidingLine);

    expect(censoredObject.dependencies.fieldToHide).to.be.equal(defaultHidingLine);
  });
});
