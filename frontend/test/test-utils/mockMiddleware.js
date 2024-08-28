import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const eeaConfig = require('./mockdata/ericsson.expert.analytics.config.json');

const { apps, groups } = eeaConfig;

const sessionExpiredText = '<html>kc-form-login</html>';
const sessionExpiredXML = '<?xml version = "1.0"?><login>kc-form-login</login>';
const contentTypeString = 'Content-Type';

const returnJson = (res, data) => {
  res.statusCode = 200;
  res.setHeader(contentTypeString, 'application/json');
  return res.end(JSON.stringify(data));
};

const returnText = (res, data) => {
  res.statusCode = 200;
  res.setHeader(contentTypeString, 'text/html;charset=utf-8');
  return res.end(data);
};

const returnXML = (res, data) => {
  res.statusCode = 200;
  res.setHeader(contentTypeString, 'application/x-www-form-urlencoded');

  return res.end(data);
};

export default function mockMiddleware({ url, res }, next) {
  switch (url) {
    case '/ui-logging/v1/logs':
      res.statusCode = 200;
      return res.end();
    case '/ui-meta/v1/apps':
      return returnJson(res, apps);
    case '/ui-meta/v1/groups':
      return returnJson(res, groups);
    case '/ui-meta/v1/components':
      return returnJson(res, []);
    case '/ui-meta/loginform':
      return returnText(res, sessionExpiredText);
    case '/ui-meta/xml/loginform':
      return returnXML(res, sessionExpiredXML);
    default:
      return next();
  }
}
