import CONSTANTS from '../config/constants.js';

/**
 * Return an input string tagged for privacy logging
 *
 * @param data - the string to be tagged
 * @return data string tagged
 */
function buildPrivacyTaggedData(data) {
  if (!data) {
    return null;
  }
  return `[${CONSTANTS.TAG_PRIV11}]${data}[${CONSTANTS.TAG_PRIV11}]`;
}

/**
 * Get the UI information as a formatted text string.
 *
 * @param {object} req - The request object
 *
 * @returns {string} The formatted UI information
 */
function formatUIInformation(req) {
  const ulId = req.body.uniqueLogId ? `[${req.body.uniqueLogId}] ` : '';
  const formattedUIInformation = `[${req.body.category}] ${ulId}${req.body.message}`;
  const username = buildPrivacyTaggedData(req._authCookie?.userName);

  return {
    level: req.body.severity,
    message: formattedUIInformation,
    timestamp: req.body.timestamp,
    extraInfo: username ? { username } : null,
  };
}

export { formatUIInformation };
