import { existsSync, readFileSync } from 'fs';
import { Agent } from 'https';
import { getLogger } from './logging.js';

const logger = getLogger('tls');

const readCertificate = (config) => {
  const { serverCertPath } = config;
  let iamServerCert;
  if (existsSync(serverCertPath)) {
    iamServerCert = readFileSync(serverCertPath, 'utf-8');
  } else {
    logger.error(`IAM certificate does not exist at: ${serverCertPath}`);
  }

  return iamServerCert || '';
};

class NonTLSCertificateManager {
  constructor(config) {
    this.config = config;
  }

  getTLSOptions() {
    const tlsAgent = new Agent({
      keepAlive: true,
      rejectUnauthorized: true,
      ca: readCertificate(this.config),
      ALPNProtocols: ['http/1.1'],
    });
    return {
      tlsAgent,
    };
  }
}

export default NonTLSCertificateManager;
