import express from 'express';

import * as fs from 'fs';
import http from 'http';
import https from 'https';

import chokidar from 'chokidar';

import telemetryService from './services/telemetryService.js';

const router = express.Router();

/*
 Generate cert:
 openssl genrsa -out server-key.pem 2048
 openssl req -new -key server-key.pem -out server-csr.pem
 openssl x509 -req -in server-csr.pem -signkey server-key.pem -out server-cert.pem
*/
const { MOCK_ID, TLS, PUBLIC_PATH, CONTEXT_ROOT } = process.env;

let credentials = {};
let server;

if (TLS === 'true') {
  const getServerCredential = () => {
    const privateKey = fs.readFileSync('/run/secrets/servercert/key.pem', 'utf8');
    const certificate = fs.readFileSync('/run/secrets/servercert/cert.pem', 'utf8');
    const ca = [];
    const certAuth = fs.readFileSync('/run/secrets/ca/ca.pem', 'utf8');
    ca.push(certAuth);
    try {
      const ingressClientCa = fs.readFileSync('/run/secrets/ingress/ca.pem', 'utf8');
      ca.push(ingressClientCa);
    } catch (e) {
      console.log('Ingress CA is not available.');
    }
    return {
      key: privateKey,
      cert: certificate,
      ca,
      requestCert: true,
    };
  };

  credentials = getServerCredential();

  chokidar.watch('/run/secrets').on('all', (event, path) => {
    console.log('Certificates are changed, updating server secure context', event, path);
    server.setSecureContext(getServerCredential());
  });
}

const requestLogger = (req, res, next) => {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, '0');
  const formattedDate = `${pad(now.getFullYear())}-${pad(now.getMonth() + 1)}-${now.getDate()}`;
  const formattedTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const { method, url } = req;
  res.on('finish', () => {
    const duration = (new Date() - now) / 1000;
    console.log(
      `[${formattedDate} ${formattedTime}][${MOCK_ID}] ${method}:${url} Status: ${res.statusCode} Duration: ${duration}`,
    );
  });
  next();
};

const app = express();

app.use(telemetryService.tracingMiddleware);

router.use(requestLogger);

const port = 4000;

const dataHandler = (req, res) => {
  console.log(req.url);
  res.send(JSON.stringify({ data: `Some useful data from [${MOCK_ID}] Microservice.` }));
};

router.get('/data', dataHandler);

const BUILT_APPS = [
  'action-consumer',
  'action-provider',
  'e-ui-app-1',
  'e-ui-app-2',
  'e-ui-tree-apps',
  'esm-service-1',
  'dev-portal-mock-gui',
];

if (fs.existsSync('./deployment-config/config.json')) {
  const config = JSON.parse(fs.readFileSync('./deployment-config/config.json', 'utf-8'));
  router.get('/config.json', (_req, res) => {
    res.json(config);
  });
}

router.use(
  '/',
  express.static(`./public/${PUBLIC_PATH}${BUILT_APPS.includes(PUBLIC_PATH) ? '/build' : '/'}`),
);

app.use(CONTEXT_ROOT ? `${CONTEXT_ROOT}` : '', router);

server = TLS === 'true' ? https.createServer(credentials, app) : http.createServer(app);
server.listen(port, () => {
  console.log(`Service [${MOCK_ID}] is running on port ${port} with contextroot ${CONTEXT_ROOT}`);
});
