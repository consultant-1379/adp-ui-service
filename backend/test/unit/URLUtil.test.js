import { expect } from 'chai';
import * as td from 'testdouble';
import * as loggingMock from '../mocks/modules/logging.mock.js';

describe('Absolute URL generation - generateAbsoluteURL', () => {
  let generateAbsoluteURL;
  before(async () => {
    await td.replaceEsm('../../services/logging.js', { ...loggingMock });
    generateAbsoluteURL = (await import('../../utils/URLUtil.js')).generateAbsoluteURL;
    td.reset();
  });

  after(() => {
    td.reset();
  });

  const url = 'cb/#ab';
  const base = 'http://host/context';
  const local = 'http://local';
  it('generates proper urls', () => {
    const generateURL = (...args) => generateAbsoluteURL(...args);
    expect(generateURL(`${url}`, `${base}`)).to.be.eq(`${base}/${url}`);
    expect(generateURL(`${url}`, `${base}/`)).to.be.eq(`${base}/${url}`);
    expect(generateURL(`/${url}`, `${base}`)).to.be.eq(`${base}/${url}`);
    expect(generateURL(`/${url}`, `${base}/`)).to.be.eq(`${base}/${url}`);
  });

  it('leaves absolute url', () => {
    const generateURL = (...args) => generateAbsoluteURL(...args);
    expect(generateURL(`${local}/${url}`, `${base}`)).to.be.eq(`${local}/${url}`);
    expect(generateURL(`${local}/${url}`, undefined)).to.be.eq(`${local}/${url}`);
  });

  it('throws error for invalid case', () => {
    const generateURL = (...args) => generateAbsoluteURL(...args);
    expect(() => generateURL(`${url}`, undefined)).throws(TypeError);
    expect(() => generateURL(`${url}`, '/not-absolute-url/')).throws(TypeError);
  });
});
