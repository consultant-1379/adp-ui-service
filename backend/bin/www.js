#!/usr/bin/env node

/**
 * Module dependencies.
 */
import http from 'http';
import https from 'https';
import app from '../app.js';
import metricApp from '../metricApp.js';
import { getLogger } from '../services/logging.js';
import configManager from '../config/configManager.js';
import certificateManager from '../services/certificateManager.js';
import fMHandler from '../services/faultHandler/fMHandler.js';

const logger = getLogger();

const useHttps = configManager.useHttps();

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const portValue = parseInt(val, 10);

  if (Number.isNaN(portValue)) {
    // named pipe
    return val;
  }

  if (portValue >= 0) {
    // port number
    return portValue;
  }

  return false;
}

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.GAS_SERVICE_PORT || '3000');
app.set('port', port);

const metricPort = normalizePort(process.env.GAS_METRICS_PORT || '3888');
metricApp.set('port', metricPort);

/**
 * Create HTTP/HTTPS server.
 */

const options = useHttps ? certificateManager.getServerHttpsOpts() : {};
const server = useHttps ? https.createServer(options, app) : http.createServer(app);
const metricServer = useHttps
  ? https.createServer(options, metricApp)
  : http.createServer(metricApp);

/**
 * Certificate watch
 */

certificateManager.on('server-certificates-changed', () => {
  const opts = certificateManager.getServerHttpsOpts();
  server.setSecureContext(opts);
  metricServer.setSecureContext(opts);
});

/**
 * Event listener for HTTP/HTTPS server "error" event.
 */

function onError(error, serverPort, serverName) {
  if (error.syscall !== 'listen') {
    fMHandler.produceFaultIndication({
      fault: 'SERVER_ERROR',
      customConfig: {
        description: `eric-adp-gui-aggregator-service service internal server error in ${serverName} HTTP server: ${error}`,
      },
    });
    logger.error(`Server error in ${serverName} HTTP server`);
    throw error;
  }

  const bind = typeof serverPort === 'string' ? `pipe ${serverPort}` : `port ${serverPort}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`Error in ${serverName} HTTP server: ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Error in ${serverName} HTTP server: ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP/HTTPS server "listening" event.
 */

function onListening(httpServer, serverName) {
  const addr = httpServer.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`The ${serverName} HTTP server is listening on ${bind}`);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', (err) => onError(err, port, 'main'));
server.on('listening', () => onListening(server, 'main'));

metricServer.listen(metricPort);
metricServer.on('error', (err) => onError(err, metricPort, 'metric'));
metricServer.on('listening', () => onListening(metricServer, 'metric'));

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing server');
  server.close(() => {
    app.close();
  });
  metricServer.close(() => {
    metricApp.close();
  });
});
