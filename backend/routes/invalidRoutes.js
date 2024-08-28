import express from 'express';
import { getLogger } from '../services/logging.js';

const router = express.Router();

const logger = getLogger();

export default () => {
  router.use((req, res) => {
    logger.info(`Invalid request: ${req.method} ${req.url}, on route: ${req.baseUrl}`);
    res.status(400).send();
  });
  return router;
};
