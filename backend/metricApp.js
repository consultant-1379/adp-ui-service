import express from 'express';
import helmet from 'helmet';
import pmService from './services/pmService.js';

const metricApp = express();
metricApp.disable('x-powered-by');
metricApp.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

pmService.applyMetricsExposureMiddleware(metricApp);

metricApp.close = () => {
  pmService.shutDown();
};

export default metricApp;
