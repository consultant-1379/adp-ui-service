import { expect, fixture, html } from '@open-wc/testing';
import { ErrorMessageDialog } from '../../../../src/components/error-message-dialog/error-message-dialog.js';
import isRendered from '../../../test-utils/isRendered.js';

async function renderApp(label = null) {
  const htmlTemplate = html`
    <e-error-message-dialog label=${label}>
      <div slot="content"></div>
    </e-error-message-dialog>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

describe('ErrorMessageDialog Tests', () => {
  before(async () => {
    ErrorMessageDialog.register();
  });

  describe('Basic component setup', () => {
    it('should create a new <e-error-message-dialog>', async () => {
      const errorMessage = await renderApp('error label');
      const { shadowRoot } = errorMessage;

      expect(shadowRoot, 'Shadow root does not exist').to.exist;
      expect(errorMessage).to.not.null;
    });
  });
});
