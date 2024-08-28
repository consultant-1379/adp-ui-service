import LauncherView from './LauncherView.js';
import CardContainer from './CardContainer.js';
import ListContainer from './ListContainer.js';
import utils from '../../utils/helpers.js';

const cssPaths = {
  cardContainer: 'e-card-container',
  listContainer: 'e-list-container',
  groupingTypeDropdown: '.groupingType-dropdown eui-dropdown',
  viewTypeDropdown: '.viewType-dropdown',
  dropdownItem: 'eui-menu-item',
  favoritePill: '.favorite-pill',
  emptyState: '.empty-state',
};

class AppView extends LauncherView {
  async cardContainers() {
    const cardContainers = await this.root.shadow$$(cssPaths.cardContainer);
    return cardContainers.map((container) => new CardContainer(container));
  }

  async listContainers() {
    const listContainers = await this.root.shadow$$(cssPaths.listContainer);
    return listContainers.map((container) => new ListContainer(container));
  }

  async groupingTypeDropdown() {
    const actionBar = await this.actionBar();
    return actionBar.shadow$(cssPaths.groupingTypeDropdown);
  }

  async viewTypeDropdown() {
    const actionBar = await this.actionBar();
    return actionBar.shadow$(cssPaths.viewTypeDropdown);
  }

  async isEmptyStateVisible() {
    const emptyState = await this.root.shadow$(cssPaths.emptyState);
    return emptyState.isExisting();
  }

  async selectGroupingOption(option) {
    await utils.selectDropdownOption(await this.groupingTypeDropdown(), option);
  }

  async selectViewOption(option) {
    await utils.selectDropdownOption(await this.viewTypeDropdown(), option);
  }

  async favoritePill() {
    const actionBar = await this.actionBar();
    return actionBar.shadow$(cssPaths.favoritePill);
  }

  async findExpandableCards() {
    const results = [];
    const cardContainers = await this.cardContainers();
    await Promise.all(
      cardContainers.map(async (container) => {
        const appCards = await container.appCards();
        await Promise.all(
          appCards.map(async (appCard) => {
            if (await appCard.isExpandable()) {
              results.push(appCard);
            }
          }),
        );
      }),
    );
    return results;
  }
}

export default AppView;
