import express from 'express';
import { createRequire } from 'module';
import { body, validationResult } from 'express-validator';
import { getLogger, LOG_LEVELS } from '../services/logging.js';
import { formatUIInformation } from '../services/uiLogging.js';
import CONSTANTS from '../config/constants.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../config/api-config.json');

const logger = getLogger(CONSTANTS.LOGGING_CATEGORY_UI_PRIV);
const router = express.Router();

export default () => {
  router.post(
    apiConfig.logging.routes.logs.path,
    [
      body('message').not().isEmpty(),
      body('timestamp').isISO8601(),
      body('severity').isIn(Object.keys(LOG_LEVELS)),
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      } else {
        logger.log(formatUIInformation(req));
        res.sendStatus(200);
      }
    },
  );

  // to pervent the invalid favicon request error
  router.get(CONSTANTS.FAVICON_ROUTE, (req, res) => res.sendStatus(404));

  return router;
};
