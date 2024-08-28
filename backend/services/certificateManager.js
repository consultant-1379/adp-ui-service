import { CertificateManager } from '@adp/base';
import { addCertificateListener, getLogger } from './logging.js';
import configManager from '../config/configManager.js';
import CONSTANTS from '../config/constants.js';

const { CERT_WATCH_DEBOUNCE_TIME } = CONSTANTS;

const logger = getLogger('tls');

const certificateManager = new CertificateManager({
  tlsEnabled: configManager.useHttps(),
  dependenciesConfig: configManager.getDependenciesConfig(),
  certificateWatchDebounceTime: CERT_WATCH_DEBOUNCE_TIME,
  certificatePath: configManager.getCertificatePath(),
  certificateConfig: {
    ca: 'cacertbundle.pem',
    key: 'key.pem',
    cert: 'cert.pem',
  },
  serverCertificateConfig: {
    certDir: 'httpServer',
    caCertDirs: ['httpCa', 'pm', 'ingress', 'internalUiCa', 'ha'],
    key: 'srvprivkey.pem',
    cert: 'srvcert.pem',
    verifyClientCert: configManager.verifyClientCertificate(),
  },
  logger,
});

addCertificateListener(certificateManager);

export default certificateManager;
