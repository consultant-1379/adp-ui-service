import { getLogger } from './logging.js';

const logger = getLogger('requests');
const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

export const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  res.on('close', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    logger.debug(
      `${req.method} ${req.originalUrl} [${res.statusCode}] Duration: ${durationInMilliseconds} ms`,
    );
  });
  next();
};

/**
 * Plugin for the HTTP-Proxy-Middleware module
 * @param {*} proxyServer
 */
export const proxyRequestLoggerPlugin = (proxyServer /* options */) => {
  proxyServer.on('proxyReq', (proxyReq, req /* res */) => {
    req.proxy.time = process.hrtime();
  });
  proxyServer.on('proxyRes', (proxyRes, req /* res */) => {
    const duration = getDurationInMilliseconds(req.proxy.time);
    const originalUrl = req.originalUrl ?? `${req.baseUrl || ''}${req.url}`;
    const exchange = `[HPM] ${req.method} ${originalUrl} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}] Duration: ${duration} ms`;
    logger.debug(exchange);
  });
};
