import express from 'express';
import { createRequire } from 'module';
import { param, body, validationResult } from 'express-validator';
import configQueryService from '../services/configQueryService.js';
import synchronizationService from '../services/synchronizationService.js';
import uiServiceCollection from '../services/uiServiceCollection.js';
import CONSTANTS from '../config/constants.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../config/api-config.json');

const router = express.Router();

export default () => {
  router.get(apiConfig.meta.routes.apps.path, (_req, res) =>
    res.json(configQueryService.getApps()),
  );
  router.get(apiConfig.meta.routes.groups.path, (_req, res) =>
    res.json(configQueryService.getGroups()),
  );
  router.get(apiConfig.meta.routes.components.path, (_req, res) =>
    res.json(configQueryService.getComponents()),
  );
  router.get(apiConfig.meta.routes.actions.path, (_req, res) =>
    res.json({ actions: configQueryService.getActions() }),
  );
  router.put(
    `${apiConfig.meta.routes.services.path}/:serviceParam`,
    [body('name').not().isEmpty(), param('serviceParam').not().isEmpty()],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (req.body.name !== req.params.serviceParam) {
        return res
          .status(400)
          .json({ errors: 'Value in body must be the same as the query param.' });
      }

      if (uiServiceCollection.forceUpdateService(req.body.name)) {
        if (!req.headers.via || !req.headers.via.includes(CONSTANTS.VIA_HEADER_VALUE)) {
          try {
            await synchronizationService.propagateRefresh(req);
          } catch (error) {
            return res.status(500).json({ errors: error });
          }
          return res.sendStatus(202);
        }
        return res.sendStatus(200);
      }

      return res.sendStatus(404);
    },
  );
  // to pervent the invalid favicon request error
  router.get(CONSTANTS.FAVICON_ROUTE, (_req, res) => res.sendStatus(404));

  return router;
};
