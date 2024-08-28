import ProductCard from './ProductCard.js';
import AppCard from './AppCard.js';

const cssPaths = {
  productCard: 'e-product-card',
  appCard: 'e-app-card',
  groupName: '.groupName',
  viewAll: '.viewAllLink',
};

class CardContainer {
  constructor(root) {
    this.root = root;
  }

  async productCards() {
    const productCards = await this.root.shadow$$(cssPaths.productCard);
    return productCards.map((card) => new ProductCard(card));
  }

  async appCards() {
    const appCards = await this.root.shadow$$(cssPaths.appCard);
    return appCards.map((card) => new AppCard(card));
  }

  async groupName() {
    const groupName = await this.root.shadow$(cssPaths.groupName);
    return groupName.getText();
  }

  async viewAllLink() {
    return this.root.shadow$(cssPaths.viewAll);
  }
}

export default CardContainer;
