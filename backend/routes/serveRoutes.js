import express from 'express';
import { createRequire } from 'module';
import configQueryService from '../services/configQueryService.js';
import proxyService from '../services/proxyService.js';
import CONSTANTS from '../config/constants.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../config/api-config.json');

const router = express.Router();

export default () => {
  router.get(apiConfig.serve.routes.packages.path, (_req, res) =>
    res.json(configQueryService.getPackages()),
  );

  router.get(apiConfig.serve.routes.importMap.path, (_req, res) =>
    res.json(configQueryService.getImportMap()),
  );

  router.use(apiConfig.serve.routes.static.path, proxyService.getMiddleware());
  // to pervent the invalid favicon request error
  router.get(CONSTANTS.FAVICON_ROUTE, (req, res) => res.sendStatus(404));

  return router;
};
