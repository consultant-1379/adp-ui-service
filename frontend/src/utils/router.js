import { Router } from '@adp/ui-components';
import CONSTANTS from './constants';

const { PRODUCT_NAME, ALL_APPS, SHOW_FAVORITES_ONLY, EUISDK_TYPE } = CONSTANTS;

export default new (class extends Router {
  constructor() {
    super();

    this.varPrefix = '?';
    this.paramAssigner = '=';
    this.pageRoute = 'launcher';
    this.paramSeparator = '&';
  }

  getActualRoute(item) {
    const route = item.url || item.route;
    return item.type === EUISDK_TYPE ? `#${route}` : route;
  }

  addRoute(callback) {
    const id = Symbol('route');
    this.routes[id] = callback;
    return id;
  }

  removeRoute(routeId) {
    delete this.routes[routeId];
  }

  getProductUrl(productName) {
    return `#${this.pageRoute}${this.varPrefix}${PRODUCT_NAME}${this.paramAssigner}${productName}`;
  }

  goToMainPage() {
    this.router.goto(`${this.pageRoute}`);
  }

  goToProduct(productName) {
    this.router.goto(
      `${this.pageRoute}${this.varPrefix}${PRODUCT_NAME}${this.paramAssigner}${productName}`,
    );
  }

  goToAllApps(additionalParameter) {
    this.router.goto(
      `${this.pageRoute}${this.varPrefix}${PRODUCT_NAME}${this.paramAssigner}${ALL_APPS}${this.paramSeparator}${additionalParameter}`,
    );
  }

  doesURLContainFavorites() {
    const part = window.location.href.split(this.varPrefix);
    return part.length > 1 && part[1].includes(SHOW_FAVORITES_ONLY);
  }

  goToShowFavorites(productName) {
    this.router.goto(
      `${this.pageRoute}${this.varPrefix}${PRODUCT_NAME}${this.paramAssigner}${productName}${this.paramSeparator}${SHOW_FAVORITES_ONLY}`,
    );
  }

  loadPortal() {
    const getRoute = () => this.pageRoute;
    window.location.replace(`${this.router.appRoot}${getRoute()}`);
    window.location.reload();
  }
})();
