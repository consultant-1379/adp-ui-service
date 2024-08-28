/**
 * Bubbles a CustomEvent up in the DOM. Bubbles and composed are set to true,
 * to bubble up, and step over webcomponent boundaries
 *
 * @param {Object} context The EventTarget object where the event is fired
 * @param {String} name The name of the event
 * @param {Object} [detail] The event's detail object containing the payload
 * @param {Object} [config] Extra config object which is passed to the CustomEvenet constructor
 * @returns
 */
const bubble = (context, name, detail = {}, config = {}) => {
  const event = new CustomEvent(name, {
    bubbles: true,
    composed: true,
    ...config,
    detail,
  });
  context.dispatchEvent(event);
  return event;
};

/**
 * Returns path to the current service frontend root
 */
const getStaticPath = () => {
  const currentUrl = new URL(import.meta.url);
  return currentUrl.href.split('/src')[0];
};

export { bubble, getStaticPath };
