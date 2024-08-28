import LauncherPage from '../page-objects/launcher/Launcher.page.js';

export async function getProductIndex(productName) {
  const productView = await LauncherPage.productView();
  const productCardContainer = await productView.productCardContainer();
  const productCards = await productCardContainer.productCards();
  const productTitles = await Promise.all(productCards.map((card) => card.title()));
  return productTitles.findIndex((title) => title === productName);
}

export async function openProduct(productName) {
  await LauncherPage.open();
  await LauncherPage.waitForLoading();

  const productView = await LauncherPage.productView();
  const productCardContainer = await productView.productCardContainer();
  const productCards = await productCardContainer.productCards();
  const index = await getProductIndex(productName);

  await productCards[index].click();
  await LauncherPage.waitForAppViewLoading();
}

export async function openApp(appName) {
  const appView = await LauncherPage.appView();
  const cardContainers = await appView.cardContainers();
  let appCards = await Promise.all(cardContainers.map((container) => container.appCards()));
  appCards = appCards.flat();
  const cardTitles = await Promise.all(appCards.map((appCard) => appCard.title()));
  const index = cardTitles.findIndex((title) => title === appName);

  await appCards[index].click();
}
