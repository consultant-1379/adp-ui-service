import { getLogger } from '../services/logging.js';

const logger = getLogger();

const generateAbsoluteURL = (relativeURL, baseURL) => {
  if (baseURL && !baseURL.endsWith('/')) {
    baseURL += '/';
  }
  if (relativeURL.startsWith('/')) {
    relativeURL = relativeURL.substr(1);
  }
  return new URL(relativeURL, baseURL).href;
};

const updateToAbsoluteUrl = (metaData, ingressBaseurl) => {
  if ('url' in metaData) {
    try {
      metaData.url = generateAbsoluteURL(metaData.url, ingressBaseurl);
    } catch (e) {
      logger.warning(
        `Application (${metaData.service}/${metaData.name}) has invalid (not absolute) url: ${ingressBaseurl}/${metaData.url}`,
      );
    }
  }
};

const normalizeURLEnding = (urlSegment) => {
  if (urlSegment && urlSegment.endsWith('/')) {
    urlSegment = urlSegment.slice(0, -1);
  }
  return urlSegment;
};

const normalizeURLSegment = (urlSegment) => {
  urlSegment = normalizeURLEnding(urlSegment);

  if (urlSegment && !urlSegment.startsWith('/')) {
    urlSegment = '/'.concat(urlSegment);
  }
  return urlSegment;
};

export { updateToAbsoluteUrl, generateAbsoluteURL, normalizeURLEnding, normalizeURLSegment };
