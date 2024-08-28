import { expect, fixture } from '@open-wc/testing';
import { SystembarUserInfo } from '../../../../src/components/systembar-user-info/systembar-user-info.js';

describe('SystembarUserInfo Component Tests', () => {
  before(() => {
    SystembarUserInfo.register();
  });

  describe('Basic component setup', () => {
    it('should render <e-systembar-user-info>', async () => {
      const component = await fixture('<e-systembar-user-info></e-systembar-user-info>');
      expect(component.shadowRoot).to.exist;
    });
  });
});
