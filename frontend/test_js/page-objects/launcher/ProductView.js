import LauncherView from './LauncherView.js';
import CardContainer from './CardContainer.js';

const RECENT_APPS = 'Recent Apps';
const FAVORITE_APPS = 'Favorite Apps';

const cssPaths = {
  cardContainer: 'e-card-container',
  productCardContainer: 'e-card-container[is-products]',
};

class ProductView extends LauncherView {
  async _getContainer(groupName) {
    const containers = await this.root.shadow$$(cssPaths.cardContainer);
    const groupNames = await containers.map((container) => container.getAttribute('group-name'));
    const index = groupNames.findIndex((groupN) => groupN.startsWith(groupName));
    return index >= 0 ? new CardContainer(containers[index]) : undefined;
  }

  async productCardContainer() {
    const productCardContainer = await this.root.shadow$(cssPaths.productCardContainer);
    return new CardContainer(productCardContainer);
  }

  async favoriteCardContainer() {
    return this._getContainer(FAVORITE_APPS);
  }

  async recentCardContainer() {
    return this._getContainer(RECENT_APPS);
  }
}

export default ProductView;
