import { createProxyMiddleware } from 'http-proxy-middleware';
import UIServiceCollection from './uiServiceCollection.js';
import certificateManager from './certificateManager.js';
import CONSTANTS from '../config/constants.js';
import { getLogger } from './logging.js';
import { normalizeURLSegment, normalizeURLEnding } from '../utils/URLUtil.js';
import { proxyRequestLoggerPlugin } from './requestLogger.js';
import telemetryService from './telemetryService.js';

const logger = getLogger('proxy');

class ProxyService {
  constructor() {
    this.serviceMap = {};
    this.checkURL = this.checkURL.bind(this);
    this.addService = this.addService.bind(this);
    this.deleteService = this.deleteService.bind(this);
    this.refreshAgent = this.refreshAgent.bind(this);
    this.proxyWrapper = this.proxyWrapper.bind(this);
    this.httpsAgent = certificateManager.getTLSOptions(CONSTANTS.TLS_TYPE_INTERNAL_GUI)?.tlsAgent;
    this.proxyMiddleware = this.getProxy(this.httpsAgent);
    this.proxyHttpMiddleware = this.getProxy();

    UIServiceCollection.on('service-added', this.addService);
    UIServiceCollection.on('service-modified', this.addService);
    UIServiceCollection.on('service-deleted', this.deleteService);

    certificateManager.on('certificates-changed', this.refreshAgent);
  }

  refreshAgent() {
    // eslint-disable-next-line new-cap
    const httpsAgent = certificateManager.getTLSOptions(CONSTANTS.TLS_TYPE_INTERNAL_GUI)?.tlsAgent;
    this.proxyMiddleware = this.getProxy(httpsAgent);
  }

  cleanUpPreviousService(serviceWithUrl) {
    Object.values(this.serviceMap)
      .filter((service) => service.name === serviceWithUrl.name)
      .forEach((service) => this.deleteService(service));
  }

  async addService(serviceWithUrl) {
    serviceWithUrl = { ...serviceWithUrl };
    this.cleanUpPreviousService(serviceWithUrl);
    if (!serviceWithUrl.protocol) {
      logger.error(
        `Protocol is not set and not recognized for service: ${serviceWithUrl.name} (${serviceWithUrl.uid}). Skipped from proxy list.`,
      );
      return;
    }
    this.serviceMap[serviceWithUrl.uid] = serviceWithUrl;
    logger.info(`Adding [${serviceWithUrl.uid}] to proxy list`);
    logger.debug(`[${serviceWithUrl.uid}] params: ${JSON.stringify(serviceWithUrl)}`);
  }

  deleteService(serviceWithUrl) {
    delete this.serviceMap[serviceWithUrl.uid];
    logger.info(`Removing [${serviceWithUrl.uid}] from proxy list`);
  }

  getMiddleware() {
    return [this.checkURL, this.proxyWrapper];
  }

  proxyWrapper(request, ...args) {
    if (request.proxy.protocol === 'https') {
      return this.proxyMiddleware(request, ...args);
    }
    return this.proxyHttpMiddleware(request, ...args);
  }

  checkURL(request, response, next) {
    let { path } = request;
    path = path.replace(request.baseUrl, '');
    // serviceUID/filePath
    const matches = path.match(/^\/([^/]+)\/(.*)$/);
    if (!matches) {
      response.status(400).json({
        msg: 'Request path must match the pattern: serviceUID/filePath',
        path,
      });
      return;
    }
    const serviceUID = matches[1];
    if (!(serviceUID in this.serviceMap)) {
      response.status(404).json({
        msg: `Unknown service UID`,
        path,
        serviceUID,
      });
      return;
    }
    const filepath = matches[2];
    if (!filepath) {
      response.status(400).json({
        msg: `Filepath is missing`,
        path,
        serviceUID,
      });
      return;
    }

    const service = this.serviceMap[serviceUID];
    const { protocol } = service;

    const serviceURL = normalizeURLEnding(
      `${service.protocol}://${service.serviceurl}${normalizeURLSegment(
        service.uiContentConfigContext,
      )}`,
    );
    request.proxy = {
      service,
      serviceUID,
      serviceURL,
      filepath,
      protocol,
    };
    next();
  }

  getProxy(agent) {
    return createProxyMiddleware({
      router: (request) => this.route(request),
      agent,
      secure: false,
      changeOrigin: true,
      followRedirects: true,
      ignorePath: true,
      headers: { Connection: 'keep-alive' },
      plugins: [proxyRequestLoggerPlugin],
      on: {
        error: (err, req, res, target) => this.proxyError(err, req, res, target),
        proxyReq: (proxyReq, req) => {
          const ctx = telemetryService.extractContext(req);
          const { span: childSpan, ctx: spanCtx } = telemetryService.createSpan(
            req,
            telemetryService.spanKindServerId,
            ctx,
          );
          const { headers: telemetryHeaders } = telemetryService.injectContext(spanCtx);

          Object.keys(telemetryHeaders).forEach((header) => {
            proxyReq.setHeader(header, telemetryHeaders[header]);
          });

          req.dstSpan = childSpan;
        },
        proxyRes: (proxyRes, req) => {
          req.dstSpan.end();
        },
      },
    });
  }

  proxyError(err, req, res, target) {
    const errorMessage = `${err.name}: ${err.message}`;
    logger.error(
      `Proxy error for service [${req.proxy.serviceUID}] (${req.method} ${req.originalUrl}): ${errorMessage}`,
    );
    res.status(500).json({
      msg: `Proxy error`,
      error: err,
      serviceUID: req.proxy.serviceUID,
      proxy: req.proxy,
      target,
    });
  }

  route(request) {
    return `${request.proxy.serviceURL}/${request.proxy.filepath}`;
  }
}
const proxyService = new ProxyService();
export default proxyService;
