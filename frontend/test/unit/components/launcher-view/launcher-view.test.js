import { expect } from '@open-wc/testing';
import { LauncherView } from '../../../../src/components/launcher-view/launcher-view.js';

const DEFAULT_CLASSMAP = {
  'launcher-tile': true,
  'compact-view': false,
};

const COMPACT_CLASSMAP = {
  'launcher-tile': true,
  'compact-view': true,
};

describe('LauncherView Component Tests', () => {
  let launcherView;
  before(async () => {
    LauncherView.register();
    launcherView = new LauncherView();
    launcherView.isCompactView = false;
  });

  describe('Inspecting class map generation', () => {
    it('should return the default classmap', async () => {
      expect(launcherView.classMap).to.deep.eq(DEFAULT_CLASSMAP);
    });

    it(`should return the classmap for Compact view if it's set`, () => {
      launcherView.isCompactView = true;
      expect(launcherView.classMap).to.deep.eq(COMPACT_CLASSMAP);
    });
  });
});
