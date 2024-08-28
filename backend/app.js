import express from 'express';
import helmet from 'helmet';
import expressStaticGzip from 'express-static-gzip';
import * as path from 'path';
import v8 from 'v8';
import { fileURLToPath } from 'url';
import configManager from './config/configManager.js';
import { load } from './loaders/index.js';
import { getLogger, loggingService } from './services/logging.js';
import k8sQueryService from './services/k8sQueryService.js';
import manualServiceConfigHandler from './services/manualServiceConfigHandler.js';
import certificateManager from './services/certificateManager.js';
import pmService from './services/pmService.js';
import telemetryService from './services/telemetryService.js';
import { requestLogger } from './services/requestLogger.js';
import { censorObject } from './utils/formatUtil.js';

const FRONTEND_ROUTE = configManager.getGuiContext();

const app = express();
app.disable('x-powered-by');

// Apply helmet
const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
};

app.use(helmet(helmetOptions));

const logger = getLogger();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const currentConfigs = configManager.getConfig();
logger.info('The current configs are as follows:');
logger.info(JSON.stringify(censorObject(currentConfigs), null, 4));

const heapStatistics = v8.getHeapStatistics();
logger.info(
  `Heap size memory limit is set to ${Math.round(heapStatistics.heap_size_limit / 1024 / 1024)}MB.`,
);

pmService.applyMetricsCollectionMiddleware(app);

loggingService.setTelemetryService(telemetryService);

app.use(requestLogger);

app.use(telemetryService.tracingMiddleware);
if (process.env.NODE_ENV === 'production') {
  app.get(FRONTEND_ROUTE, (req, res, next) => {
    if (req.url !== `${FRONTEND_ROUTE}/`) {
      return res.redirect(`${FRONTEND_ROUTE}/`);
    }
    return next();
  });

  app.use(
    FRONTEND_ROUTE,
    expressStaticGzip(path.join(__dirname, '../frontend'), {
      enableBrotli: true,
      serveStatic: {
        maxAge: '1d',
        setHeaders: (res, filepath) => {
          if (filepath.includes('initImportmap.js')) {
            res.set('Cache-Control', 'no-cache');
          }
          if (express.static.mime.lookup(filepath) === 'text/html') {
            res.set('Expires', '0');
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
          }
        },
      },
    }),
  );
}

if (process.env.NODE_ENV === 'bridge') {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  const { createProxyMiddleware } = require('http-proxy-middleware');
  app.use(
    FRONTEND_ROUTE,
    createProxyMiddleware({
      target: 'http://localhost:8080',
      followRedirects: true,
      logLevel: 'debug',
      pathRewrite: {
        [`${FRONTEND_ROUTE}`]: '',
      },
    }),
  );
}

// Run Loaders
load(app);

const startK8sService = async () => {
  if (configManager.getConfig().k8sQueryServiceEnabled) {
    await k8sQueryService.startWatching();
  } else {
    logger.info('K8S Service is disabled.');
  }
  manualServiceConfigHandler.triggerInitialEvents();
};

startK8sService();

// needed to close the app gracefully in tests
app.close = () => {
  pmService.shutDown();
  k8sQueryService.stopWatching();
  configManager.stopAllConfigWatch();
  certificateManager.stopCertificateWatch();
};

export default app;
