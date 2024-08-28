import { DateTime } from 'luxon';
import rest from './rest';
import configManager from '../config/configManager';

const SEVERITY = {
  critical: { level: 'CRITICAL', order: 0 },
  error: { level: 'ERROR', order: 1 },
  warning: { level: 'WARNING', order: 2 },
  info: { level: 'INFO', order: 3 },
  debug: { level: 'DEBUG', order: 4 },
};

const APPLICATION_NAME = 'launcher-gui';
const DEFAULT_CATEGORY = 'GAS'; // see https://confluence.lmera.ericsson.se/display/AA/LOG+general+design+rules#LOGgeneraldesignrules-Category
const DEFAULT_UNIQUE_LOG_ID = '';

function createLog(
  severity,
  message,
  category = DEFAULT_CATEGORY,
  uniqueLogId = DEFAULT_UNIQUE_LOG_ID,
) {
  const logLevel = SEVERITY[configManager.getLogLevel()].order;
  if (severity.order < logLevel) {
    const timestamp = DateTime.now().toISO();
    rest.sendLogEvent({
      timestamp,
      severity: severity.level.toLowerCase(),
      applicationName: APPLICATION_NAME,
      message,
      category,
      uniqueLogId,
    });
  }
}

class Logger {
  constructor() {
    rest.setLogger(this);
    configManager.setLogger(this);
  }

  /**
   * @param {String} message - detailed log message
   * @param {String} category - optional, examples: IAM-token-generation, KM-genkey-issuecert
   * @param {String} uniqueLogId - optional, unique log identifier
   */
  debug(...params) {
    createLog(SEVERITY.debug, ...params);
  }

  /**
   * @param {String} message - detailed log message
   * @param {String} category - optional, examples: IAM-token-generation, KM-genkey-issuecert
   * @param {String} uniqueLogId - optional, unique log identifier
   */
  info(...params) {
    createLog(SEVERITY.info, ...params);
  }

  /**
   * @param {String} message - detailed log message
   * @param {String} category - optional, examples: IAM-token-generation, KM-genkey-issuecert
   * @param {String} uniqueLogId - optional, unique log identifier
   */
  warning(...params) {
    createLog(SEVERITY.warning, ...params);
  }

  /**
   * @param {String} message - detailed log message
   * @param {String} category - optional, examples: IAM-token-generation, KM-genkey-issuecert
   * @param {String} uniqueLogId - optional, unique log identifier
   */
  error(...params) {
    createLog(SEVERITY.error, ...params);
  }

  /**
   * @param {String} message - detailed log message
   * @param {String} category - optional, examples: IAM-token-generation, KM-genkey-issuecert
   * @param {String} uniqueLogId - optional, unique log identifier
   */
  critical(...params) {
    createLog(SEVERITY.critical, ...params);
  }
}

export default new Logger();
