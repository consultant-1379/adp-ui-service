const testMode = process.env.NODE_ENV === 'test';
const getLogger = () => {
  if (testMode) {
    return {
      log: () => null,
      info: () => null,
      warning: () => null,
      debug: () => null,
      error: () => null,
    };
  }
  return {
    log: (...args) => console.log(args),
    info: (...args) => console.info(...args),
    warning: (...args) => console.warn(...args),
    debug: (...args) => console.debug(...args),
    error: (...args) => console.error(...args),
  };
};
const addConfigListener = () => null;
const addCertificateListener = () => null;
const LOG_LEVELS = { error: 3, warning: 4, info: 6, debug: 7 };
const loggingService = {
  on: () => true,
  setTelemetryService: () => true,
};
export { loggingService, getLogger, addConfigListener, addCertificateListener, LOG_LEVELS };
