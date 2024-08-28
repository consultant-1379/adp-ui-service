import { EventEmitter } from 'events';

class CertificateManagerMock extends EventEmitter {
  getTLSOptions() {
    return null;
  }

  getServerHttpsOpts() {
    return null;
  }

  stopCertificateWatch() {
    return null;
  }
}

export default CertificateManagerMock;
