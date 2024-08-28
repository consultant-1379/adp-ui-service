import express from 'express';
import { createRequire } from 'module';
import UserInfoService from '../services/userInfoService.js';
import configManager from '../config/configManager.js';

const require = createRequire(import.meta.url);
const apiConfig = require('../config/api-config.json');

const router = express.Router();

const INTERNAL_ERROR = {
  code: 'adp.internal.error',
  message: 'This API endpoint is not enabled. Check service configuration.',
};

export default () => {
  const userInfoService = new UserInfoService();

  const userinfoMiddleware = async (_req, res) => {
    const { userInfo, error } = await userInfoService.getUserInfo(_req);
    if (error) {
      return res.sendStatus(error.status);
    }
    return res.json(userInfo);
  };

  router.get(apiConfig.userPermission.routes.userInfo.path, async (req, res) => {
    if (!configManager.getUserPermissionConfig().enabled) {
      return res.status(500).json(INTERNAL_ERROR);
    }
    return userinfoMiddleware(req, res);
  });

  router.get(apiConfig.userPermission.routes.realmUserInfo.path, async (req, res) => {
    if (!configManager.getUserPermissionConfig().enabled) {
      return res.status(500).json(INTERNAL_ERROR);
    }
    return userinfoMiddleware(req, res);
  });

  router.post(apiConfig.userPermission.routes.permission.path, async (req, res) => {
    if (!configManager.getUserPermissionConfig().enabled) {
      return res.status(500).json(INTERNAL_ERROR);
    }
    const { permissions, error } = await userInfoService.getPermission(req);
    if (error) {
      return res.status(error.status).send(error.message);
    }
    return res.json(permissions);
  });

  return router;
};
