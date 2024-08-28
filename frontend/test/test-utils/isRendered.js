import { waitUntil, aTimeout } from '@open-wc/testing-helpers';
import CONSTANT from './constants';

const isReady = async (elements) => {
  if (elements.length === 0) {
    return true;
  }
  const element = elements.shift();
  const isCustomElement = element.tagName.includes('-');
  if (isCustomElement) {
    await waitUntil(
      () => !element.isLoading && element?.shadowRoot?.hasChildNodes(),
      `Element ${element.localName} should have children in time.`,
      { interval: CONSTANT.WAIT_INTERVAL, timeout: CONSTANT.CHILDREN_WAIT_TIMEOUT },
    );
    return isReady([...elements, ...element.shadowRoot.children]);
  }
  return isReady([...elements, ...element.children]);
};

export default async (element) => {
  await waitUntil(() => isReady([element]), 'Element should become ready in time', {
    interval: CONSTANT.WAIT_INTERVAL,
    timeout: CONSTANT.ROOT_WAIT_TIMEOUT,
  });
  await aTimeout(CONSTANT.NEXT_TICK_WAIT_TIMEOUT);
};
