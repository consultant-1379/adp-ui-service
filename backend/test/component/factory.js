import supertest from 'supertest';
import * as td from 'testdouble';

const factory = () => {
  let app;
  let metricApp;
  let server;
  let metricServer;

  const loadServer = async (...mocks) => {
    mocks.forEach(async (mock) => {
      const { libName, namedExports, defaultExport } = mock;
      await td.replaceEsm(libName, namedExports, defaultExport);
    });
    app = (await import('../../app.js')).default;
    td.reset();
    server = await app.listen();
    return supertest.agent(server);
  };
  const loadServerWithMetrics = async (...mocks) => {
    mocks.forEach(async (mock) => {
      const { libName, namedExports, defaultExport } = mock;
      await td.replaceEsm(libName, namedExports, defaultExport);
    });
    app = (await import('../../app.js')).default;
    metricApp = (await import('../../metricApp.js')).default;
    td.reset();
    server = await app.listen();
    metricServer = await metricApp.listen();
    return supertest.agent(metricServer);
  };
  const closeServer = async () => {
    app.close();
    await server.close();
  };
  const closeServerWithMetrics = async () => {
    app.close();
    await server.close();
    metricApp.close();
    await metricServer.close();
  };

  return {
    loadServer,
    loadServerWithMetrics,
    closeServer,
    closeServerWithMetrics,
  };
};

export default factory;
