import express from 'express';
import { createRequire } from 'module';
import bodyParser from 'body-parser';
import { getCookieParserMiddleware } from '@adp/auth';
import {
  getMetaRoutes,
  getLoggingRoutes,
  getInvalidRoutes,
  getServeRoutes,
  getUserPermissionRoutes,
} from '../routes/index.js';
import { getAuditLogger } from '../services/auditLogging.js';
import { isReady } from '../utils/probeUtil.js';
import CONSTANTS from '../config/constants.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../config/api-config.json');

// Loads the express module, initializes routes and settings.

export default (app) => {
  app.get('/status/ready', (req, res) => {
    res.status(isReady()).end();
  });
  app.head('/status/ready', (req, res) => {
    res.status(isReady()).end();
  });

  app.get('/status/live', (req, res) => {
    res.status(200).end();
  });
  app.head('/status/live', (req, res) => {
    res.status(200).end();
  });

  app.use(getCookieParserMiddleware());
  app.use(express.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' })); // if the limit is increased, the service memory limit might need adjustment

  // Add Express middleware for audit logging
  app.use('/', (req, res, next) => {
    req.loggerAudit = getAuditLogger({
      req,
      res,
    });
    next();
  });

  // Check allowed request methods
  const interfaces = Object.keys(apiConfig).filter((i) => apiConfig[i].routes); // only those with routes
  interfaces.forEach((api) => {
    Object.keys(apiConfig[api].routes).forEach((endpoint) => {
      const allowedMethods = [
        ...CONSTANTS.ALLOWED_REQUEST_METHODS_DEFAULT,
        ...apiConfig[api].routes[endpoint].allowedDataMethods,
      ];
      const path = apiConfig[api].prefix + apiConfig[api].routes[endpoint].path;

      // filtering out the not allowed methods
      app.use(path, (req, res, next) => {
        if (!allowedMethods.includes(req.method.toUpperCase())) {
          res.set(CONSTANTS.ALLOW_HEADER, allowedMethods.join(', ')); // required by RFC 9110
          return res.sendStatus(405);
        }
        return next();
      });

      // overriding default Allow header with the actual allowed methods in case of OPTIONS request
      app.options(path, (_req, res) => {
        res.set(CONSTANTS.ALLOW_HEADER, allowedMethods.join(', ')); // required by RFC 9110
        res.sendStatus(200);
      });
    });
  });

  // Load API routes
  app.use(apiConfig.meta.prefix, getMetaRoutes());
  app.use(apiConfig.logging.prefix, getLoggingRoutes());
  app.use(apiConfig.serve.prefix, getServeRoutes());
  app.use(apiConfig.userPermission.prefix, getUserPermissionRoutes());
  app.use(getInvalidRoutes());

  // Return the express app
  return app;
};
