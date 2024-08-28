import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { ifDefined } from '@eui/lit-component';
import { AppView } from '../../../../src/components/app-view/app-view.js';
import eeaConfig from '../../../test-utils/mockdata/ericsson.expert.analytics.config.json' assert { type: 'json' };
import ecmConfig from '../../../test-utils/mockdata/cloud.manager.config.json' assert { type: 'json' };
import testAppConfig from '../../../test-utils/mockdata/test-app.config.json' assert { type: 'json' };
import appViewLocale from '../../../../src/components/app-view/locale/en-us.json' assert { type: 'json' };
import c from '../../../../src/utils/constants.js';

import UiSettingsUtil from '../../../../src/utils/uiSettingsUtil.js';

import isRendered from '../../../test-utils/isRendered.js';
import { stubRouter } from '../../../test-utils/utils.js';

const HIDDEN_APP_TITLE = 'App in Hidden Groups';
const HIDDEN_CATEGORY_TITLE = 'Hidden category';

const { ALL_APPS, PRODUCT_NAME, FAVORITE_STATE, GROUPPING_TYPE } = c;

const actionBarLocale = {
  CATEGORIES: 'Categories',
  ALPHABETICAL: 'A-Z',
  TILES: 'Tiles',
  LIST: 'List',
  FAVORITES: 'Favorites',
};

const dict = { ...appViewLocale, ...actionBarLocale };

const CONSTANTS = {
  eCardContainer: 'e-card-container',
  eAppCard: 'e-app-card',
  eAppView: 'e-app-view',
  eActionBar: 'e-action-bar',
  groupDropDown: '.groupingType-dropdown eui-dropdown',
  groupName: '.groupContainer .groupName',
  cardContainer: '.cardContainer',
  displayName: 'display-name',
};

const { apps: eeaApps, groups: eeaGroups } = eeaConfig;
let route;
let uiSettingsUtilGetStub;

function isSorted(array) {
  let direction;
  return array.reduce((prev, next, i, arr) => {
    if (direction === undefined) {
      direction = prev <= next;
      return direction ? 1 : -1 || true;
    }
    return direction + 1 ? arr[i - 1] <= next : arr[i - 1] > next;
  })
    ? Number(direction)
    : false;
}

async function renderAppView({
  productName,
  groupingType,
  apps,
  favoriteApps,
  groups,
  showFavoritesOnly,
}) {
  const htmlTemplate = html`
    <e-app-view
      .rootApps=${apps}
      .favoriteApps=${favoriteApps}
      .groups=${groups}
      .productName=${productName}
      .groupingType=${ifDefined(groupingType)}
      .showFavoritesOnly=${showFavoritesOnly}
    ></e-app-view>
  `;
  const element = await fixture(htmlTemplate);
  await isRendered(element);
  return element;
}

function getNumberOfCards(appView) {
  const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
  return Array.from(categories).reduce(
    (sumOfAppCards, category) =>
      sumOfAppCards + category.shadowRoot.querySelectorAll(CONSTANTS.eAppCard).length,
    0,
  );
}

function getNumberOfCardsPerGroups(appView) {
  const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
  return Array.from(categories).map((category) => {
    const title = category.shadowRoot.querySelector(CONSTANTS.groupName).textContent;
    const cardNumber = category.shadowRoot.querySelectorAll(CONSTANTS.eAppCard).length;
    return { title, cardNumber };
  });
}

describe('AppView Component Tests', () => {
  let appView;
  let actionBar;

  function evaluateEmptyState(text) {
    const emptyTextContainer = appView.shadowRoot.querySelector('.empty-state .message p');
    const emptyText = emptyTextContainer.textContent;
    const appCardCount = getNumberOfCards(appView);
    expect(emptyTextContainer).to.not.null;
    expect(emptyText).to.eq(text);
    expect(appCardCount).to.be.eq(0);
  }

  const initPageReferences = () => {
    actionBar = appView.shadowRoot.querySelector(CONSTANTS.eActionBar);
  };

  const beforeFunction = async () => {
    uiSettingsUtilGetStub.withArgs('groupingType').returns(null);
    uiSettingsUtilGetStub.withArgs('viewType').returns(null);

    const productName = eeaGroups[0].name;
    appView = await renderAppView({
      productName,
      apps: eeaApps,
      groups: eeaGroups,
    });
    initPageReferences();
  };

  before(async () => {
    uiSettingsUtilGetStub = sinon.stub(UiSettingsUtil, 'get');
    route = stubRouter();
    AppView.register();
  });

  after(() => {
    sinon.restore();
  });

  describe('Basic application setup', () => {
    before(beforeFunction);

    const expectedCategories = eeaGroups.filter((group) => group.type === 'category').length + 1; // categories + 'Others'

    it('should create a new <e-app-view>', () => {
      const { shadowRoot } = appView;
      expect(shadowRoot, 'Shadow root does not exist').to.exist;
      expect(appView).to.not.null;
    });

    it(`should render ${expectedCategories} card containers`, () => {
      const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
      expect(Array.from(categories)).to.have.lengthOf(expectedCategories);
    });

    it(`should render the Action Bar component`, () => {
      const { shadowRoot } = actionBar;
      expect(shadowRoot, 'Shadow root does not exist').to.exist;
      expect(actionBar).to.not.be.null;
    });

    it(`should render grouping selector dropdown with "Categories" and "A-Z" options`, () => {
      const expectedItems = [dict.CATEGORIES, dict.ALPHABETICAL];
      const dropdown = actionBar.shadowRoot
        .querySelector(CONSTANTS.groupDropDown)
        .shadowRoot.querySelector('.dropdown');
      const options = dropdown.querySelectorAll('eui-menu-item');
      const optLabels = Array.from(options).map((item) => item.getAttribute('label'));

      expect(optLabels).to.deep.equal(expectedItems);
    });

    it('All apps which has a sub-category should be grouped to its groupNames category', () => {
      const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
      categories.forEach((category) => {
        const categoryTitle = category.shadowRoot.querySelector(CONSTANTS.groupName).textContent;
        if (categoryTitle === dict.OTHERS) {
          return;
        }
        const categoryName = eeaGroups.find((group) => group.displayName === categoryTitle).name;

        const cards = category.shadowRoot
          .querySelector(CONSTANTS.cardContainer)
          .querySelectorAll(CONSTANTS.eAppCard);
        const appTitles = Array.from(cards).map((card) => card.getAttribute(CONSTANTS.displayName));

        appTitles.forEach((appTitle) => {
          const appName = eeaApps.find((app) => app.displayName === appTitle).groupNames[1];
          expect(categoryName).to.be.eq(appName);
        });
        expect(isSorted(appTitles), 'AppTitles are not sorted.').to.eq(1);
      });
    });

    it('An app with a root groupNames category should be grouped into the "Others" category', () => {
      const rootCategory = eeaGroups.find(
        (group) => !group.groupNames || group.groupNames.length === 0,
      );
      const otherApps = eeaApps.filter(
        (app) => app.groupNames.length === 1 && app.groupNames.includes(rootCategory.name),
      );

      const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
      const otherCategory = Array.from(categories).find(
        (category) =>
          category.shadowRoot.querySelector(CONSTANTS.groupName).textContent === dict.OTHERS,
      );
      const cards = otherCategory.shadowRoot
        .querySelector(CONSTANTS.cardContainer)
        .querySelectorAll(CONSTANTS.eAppCard);
      const appTitles = Array.from(cards).map((card) => card.getAttribute(CONSTANTS.displayName));
      expect(isSorted(appTitles), 'AppTitles are not sorted.').to.eq(1);
      otherApps.forEach((app) => {
        expect(appTitles).to.include(app.displayName);
      });
    });
  });

  describe('Categories grouping', () => {
    const { apps: ecmApps, groups: ecmGroups } = ecmConfig;

    before(beforeFunction);

    it('should render a grouping dropdown', () => {
      const dropdown = actionBar.shadowRoot.querySelector(CONSTANTS.groupDropDown);
      const { shadowRoot } = dropdown;
      expect(shadowRoot).to.exist;
      expect(dropdown).to.not.null;
    });

    it('grouping dropdown should have the Categories default type', () => {
      const defaultLabel = actionBar.shadowRoot
        .querySelector(CONSTANTS.groupDropDown)
        .getAttribute('label');

      expect(defaultLabel).to.be.eq(dict.CATEGORIES);
    });

    it(`should render ${eeaApps.length} app cards within the categories`, () => {
      const appCardCount = getNumberOfCards(appView);
      expect(appCardCount).to.be.eq(eeaApps.length);
    });

    it('Categories should be ordered alphabetically and the "Others" category should be the last one', () => {
      const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
      const categoryTitles = Array.from(categories).map(
        (category) => category.shadowRoot.querySelector(CONSTANTS.groupName).textContent,
      );
      const lastCategory = categoryTitles.pop();

      expect(isSorted(categoryTitles), 'CategoryTitles are not sorted.').to.eq(1);
      expect(lastCategory).to.be.eq(dict.OTHERS);
    });

    it('when the only product category is the "Others" category, its group title should not be displayed', async () => {
      const productName = ecmGroups[0].name;
      appView = await renderAppView({
        productName,
        groupingType: GROUPPING_TYPE.CATEGORY,
        apps: ecmApps,
        groups: ecmGroups,
      });
      initPageReferences();
      const category = appView.shadowRoot.querySelector(CONSTANTS.eCardContainer);
      const categoryTitle = category.shadowRoot.querySelector(CONSTANTS.groupName).textContent;
      expect(categoryTitle).to.be.eq('');
    });
  });

  describe('ALL Page', () => {
    const { apps: allPageApps, groups: allPageGroups } = testAppConfig;
    let groups;

    before(async () => {
      appView = await renderAppView({
        productName: ALL_APPS,
        apps: allPageApps,
        groups: allPageGroups,
      });
      initPageReferences();
    });

    it(`should render ${allPageApps.length} app cards within the categories`, () => {
      const appCardCount = getNumberOfCards(appView);
      expect(appCardCount).to.be.eq(allPageApps.length);
    });

    it('should render all categories and not show the hidden category', () => {
      groups = getNumberOfCardsPerGroups(appView);
      expect(groups).to.have.lengthOf(3);
      expect(groups.map((group) => group.title).includes(HIDDEN_CATEGORY_TITLE)).to.be.false;
    });

    it(`should render app cards without category in the others group`, () => {
      const othersGroup = groups.find((group) => group.title === dict.OTHERS);

      expect(othersGroup).to.not.be.undefined;
      expect(othersGroup.cardNumber).to.eq(
        allPageApps.filter(
          (app) => app.groupNames.length === 1 || app.displayName === HIDDEN_APP_TITLE,
        ).length,
      );
    });
  });

  describe('A-Z grouping', () => {
    before(async () => {
      uiSettingsUtilGetStub.withArgs('groupingType').returns(GROUPPING_TYPE.ALPHABETICAL);
      const productName = eeaGroups[0].name;
      appView = await renderAppView({
        productName,
        groupingType: GROUPPING_TYPE.ALPHABETICAL,
        apps: eeaApps,
        groups: eeaGroups,
      });

      initPageReferences();
    });

    it('grouping dropdown should be set to A-Z grouping type', () => {
      const defaultLabel = actionBar.shadowRoot
        .querySelector(CONSTANTS.groupDropDown)
        .getAttribute('label');
      expect(defaultLabel).to.be.eq(dict.ALPHABETICAL);
    });

    it('should have groups of sorted capital letters', () => {
      const capitalLetterRegexp = /^[A-Z]$/;
      const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
      const groupTitles = Array.from(categories).map(
        (category) => category.shadowRoot.querySelector(CONSTANTS.groupName).textContent,
      );

      groupTitles.forEach((groupTitle) => {
        expect(capitalLetterRegexp.test(groupTitle)).to.be.true;
      });
      expect(isSorted(groupTitles), 'GroupTitles are not sorted.').to.eq(1);
    });

    it(`should render ${eeaApps.length} app cards within the categories`, () => {
      const appCardCount = getNumberOfCards(appView);
      expect(isSorted(eeaApps), 'Apps are not sorted.').to.eq(1);
      expect(appCardCount).to.be.eq(eeaApps.length);
    });

    it('apps should be grouped under proper letter categories', () => {
      const categories = appView.shadowRoot.querySelectorAll(CONSTANTS.eCardContainer);
      categories.forEach((category) => {
        const groupTitle = category.shadowRoot.querySelector(CONSTANTS.groupName).textContent;
        const cards = category.shadowRoot
          .querySelector(CONSTANTS.cardContainer)
          .querySelectorAll(CONSTANTS.eAppCard);
        const appTitles = Array.from(cards).map((card) => card.getAttribute(CONSTANTS.displayName));

        appTitles.forEach((appTitle) => {
          expect(appTitle.charAt(0).toUpperCase()).to.be.eq(groupTitle);
        });
      });
    });
  });

  describe('View type', () => {
    it('should render a view type dropdown', () => {
      const dropdown = actionBar.shadowRoot.querySelector('.viewType-dropdown');
      const { shadowRoot } = dropdown;
      expect(shadowRoot).to.exist;
      expect(dropdown).to.not.null;
    });

    it('view type dropdown should have the Tiles as default type', () => {
      const defaultLabelIcon = actionBar.shadowRoot
        .querySelector('.viewType-dropdown')
        .getAttribute('label-icon');
      expect(defaultLabelIcon).to.be.eq('view-tiles');
    });
  });

  describe('Favorite setting', () => {
    let showFavoritesOnly = false;
    let spy;

    before(async () => {
      spy = sinon.spy(window.EUI.Router, 'goto');
      appView = await renderAppView({
        productName: ALL_APPS,
        apps: eeaApps,
        groups: eeaGroups,
      });
      initPageReferences();
    });

    after(() => {
      spy.restore();
    });

    it('should render favorites pill', () => {
      const pill = actionBar.shadowRoot.querySelector('.favorite-pill');
      const { shadowRoot } = pill;
      expect(shadowRoot).to.exist;
      expect(pill).to.not.null;
    });

    it('should display all apps if favorites is unselected', () => {
      expect(getNumberOfCards(appView)).to.eq(eeaApps.length);
    });

    it('should only display favorite apps if favorites is selected', async () => {
      showFavoritesOnly = true;
      const numberOfFavoriteApps = Math.floor(Math.random() * eeaApps.length);
      const favoriteApps = eeaApps
        .slice(0, numberOfFavoriteApps)
        .map((app) => ({ ...app, favoriteState: FAVORITE_STATE.FAVORITE }));

      appView = await renderAppView({
        productName: ALL_APPS,
        apps: eeaApps,
        groups: eeaGroups,
        favoriteApps,
        showFavoritesOnly,
      });
      initPageReferences();

      expect(getNumberOfCards(appView)).to.eq(numberOfFavoriteApps);
    });

    it('should redirect page when favorites pill is clicked', async () => {
      const expectedRoute = `${route}?${PRODUCT_NAME}=${ALL_APPS}`;
      const pill = actionBar.shadowRoot.querySelector('.favorite-pill');
      pill.click();
      expect(spy.called).to.be.true;
      expect(spy.calledWith(expectedRoute)).to.be.true;
    });
  });

  describe('Empty state handling', () => {
    it('should display message if no apps configured and no product specified', async () => {
      const productName = ALL_APPS;
      appView = await renderAppView({ productName, apps: [] });
      initPageReferences();
      evaluateEmptyState(dict.NO_APPS);
    });

    it('should display message if no apps configured for product', async () => {
      const productName = eeaGroups[0].name;
      appView = await renderAppView({ productName, apps: [] });
      initPageReferences();
      evaluateEmptyState(dict.NO_APPS_FOR_PRODUCT);
    });

    it('should display message if no favorite app set for product', async () => {
      const productName = eeaGroups[0].name;
      eeaApps.forEach((app) => {
        app.isFavorite = false;
      });
      appView = await renderAppView({
        productName,
        apps: eeaApps,
        showFavoritesOnly: true,
      });
      initPageReferences();
      evaluateEmptyState(dict.NO_FAVORITE_APPS);
    });

    it('should display message if no apps configured and no favorite app set for product', async () => {
      const productName = ALL_APPS;
      appView = await renderAppView({
        productName,
        showFavoritesOnly: true,
        apps: [],
      });
      initPageReferences();
      evaluateEmptyState(dict.NO_FAVORITE_APPS);
    });
  });
});
