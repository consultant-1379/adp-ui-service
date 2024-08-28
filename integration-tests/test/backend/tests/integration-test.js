import { createRequire } from 'module';
import { expect } from 'chai';
import supertest from 'supertest';
import fetch from 'node-fetch';
import path from 'path';
import sortFn from '../util/sort-util.js';
import ConfigUtilClass from '../util/config-util.js';
import { servicesToTest } from '../util/servicesToTest.js';

const require = createRequire(import.meta.url);

const PUBLIC_UI_FILES = {
  'config.json': require('../../../../frontend/public/config.json'),
  'config.package.json': require('../../../../frontend/public/config.package.json'),
  'frontend-config.json': require('../fixtures/frontend-config.json'),
};

const FRONTEND_ROUTE = '/ui';

const PARAMS = {
  ContentType: 'Content-Type',
};

const configUtil = new ConfigUtilClass(servicesToTest);

const LIST_PACKAGES = `/ui-serve/v1/list-packages`;

describe('Integration tests for GUI Aggregator Service', () => {
  let request;
  let serviceMap;
  const fetchStaticFileAndApplyCheck = async (fullPath, checkFunction) =>
    request
      .get(fullPath)
      .expect(PARAMS.ContentType, /json/)
      .expect((response) => {
        checkFunction(response.body);
      });
  const checkFileReturned = async (route, fileName) =>
    fetchStaticFileAndApplyCheck(path.join(route, fileName), (content) =>
      expect(content).to.deep.equal(PUBLIC_UI_FILES[fileName]),
    );

  const determineServiceID = (serviceNamePart) => {
    const ID = Object.keys(serviceMap).filter((value) => value.includes(serviceNamePart))[0];
    const serviceID = serviceMap[ID]?.uid;
    return { serviceID };
  };

  before(async () => {
    request = supertest(configUtil.getServiceUrl());
    const response = await fetch(`${configUtil.getServiceUrl()}${LIST_PACKAGES}`);
    serviceMap = await response.json();
  });

  it('Provides Liveness endpoint', async () => {
    await request.get('/status/live').expect(200);
  });

  it('Provides Readyness endpoint', async () => {
    await request.get('/status/ready').expect(200);
  });

  it('Discovered deployed apps', async () => {
    const APPS_RESP = configUtil.getAppsResponse();
    await request
      .get('/ui-meta/v1/apps')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        const apps = response.body;
        const sortedApps = apps.sort(sortFn('name'));
        const sortedExpectedApps = APPS_RESP.sort(sortFn('name'));
        expect(response.body).to.have.lengthOf(APPS_RESP.length);
        sortedApps.forEach((app, index) => expect(app).to.deep.eq(sortedExpectedApps[index]));
      });
  });

  it('Discovered deployed groups', async () => {
    const GROUPS_RESP = configUtil.getGroupsResponse();
    await request
      .get('/ui-meta/v1/groups')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        const groups = response.body;
        expect(response.body).to.have.lengthOf(GROUPS_RESP.length);
        expect(groups.sort(sortFn('name'))).to.deep.eq(GROUPS_RESP.sort(sortFn('name')));
      });
  });

  it('Discovered deployed components', async () => {
    const COMPONENT_RESP = configUtil.getComponentResponse();
    await request
      .get('/ui-meta/v1/components')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        const components = response.body;
        expect(response.body).to.have.lengthOf(COMPONENT_RESP.length);
        expect(components.sort(sortFn('service'))).to.deep.eq(
          COMPONENT_RESP.sort(sortFn('service')),
        );
      });
  });

  it('Discovers actions', async () => {
    const ACTIONS_RESP = configUtil.getActionsResponse();
    await request
      .get('/ui-meta/v1/actions')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        const { actions } = response.body;
        expect(actions).to.have.lengthOf(ACTIONS_RESP.length);
        expect(actions.sort(sortFn('id'))).to.deep.eq(ACTIONS_RESP.sort(sortFn('id')));
      });
  });

  it('Generates Import-map', async () => {
    await request
      .get('/ui-serve/v1/import-map')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        expect(response.body).to.include.keys(['imports', 'scopes']);
      });
  });

  it('Provides help-content-metadata', async () => {
    await request
      .get('/ui/help-content-metadata.json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        expect(response.body).to.include.keys(['files']);
      });
  });

  it('Provides help-content zip', async () => {
    await request
      .get('/ui/adp_gui_aggregator_service_user_guide.zip')
      .expect('Content-Type', 'application/zip')
      .expect(200)
      .expect((response) => {
        expect(parseInt(response.headers['content-length'], 10)).to.be.gt(0);
      });
  });

  servicesToTest.forEach((serviceToTest) => {
    it(`Proxy files from ${serviceToTest.deploymentName} Service`, async () => {
      const { serviceID } = determineServiceID(serviceToTest.deploymentName);
      // This service does not provide packages
      if (!serviceID) {
        return;
      }

      for (const file of serviceToTest.filesToCheck) {
        // eslint-disable-next-line import/no-dynamic-require
        const testFile = require(`${serviceToTest.folderPath}/${file}`);
        // eslint-disable-next-line no-await-in-loop
        await request
          .get(`/ui-serve/v1/static/${serviceID}/${file}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect((response) => {
            expect(response.body).to.deep.eq(testFile);
          });
      }
    });
  });

  it('mock service packages are available and properly configured in import maps', async () => {
    const MAIN_FILE = 'hidden-mock';
    const EXTRA_FILE = `${MAIN_FILE}-extra.js`;
    await request
      .get('/ui-serve/v1/import-map')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        expect(response.body.imports).to.include.keys([MAIN_FILE, `${MAIN_FILE}/`]);
      });
    const importMap = await request.get('/ui-serve/v1/import-map');

    const ingressRequest = supertest(configUtil.getIngressURL());

    const mainFile = importMap.body.imports[MAIN_FILE];
    const mainFilePath = importMap.body.imports[`${MAIN_FILE}/`];
    await ingressRequest
      .get(mainFile)
      .expect('Content-Type', /application\/javascript/)
      .expect(200);
    await ingressRequest
      .get(`${mainFilePath}${EXTRA_FILE}`)
      .expect('Content-Type', /application\/javascript/)
      .expect(200);
  });

  it('Should return ui config files upon request', async () => {
    const configFile = 'config.json';
    const configPackage = 'config.package.json';
    await checkFileReturned(FRONTEND_ROUTE, configFile);
    await checkFileReturned(FRONTEND_ROUTE, configPackage);
  });

  it('Contains ui config file, created by the uiconfigmap', async () => {
    const UI_CONFIGMAP_DIR = '/deployment-config';
    const configFile = 'frontend-config.json';
    const fileToCompare = PUBLIC_UI_FILES[configFile];
    const restFields = ['hostname', 'path', 'protocol'];
    await fetchStaticFileAndApplyCheck(
      path.join(FRONTEND_ROUTE, UI_CONFIGMAP_DIR, configFile),
      (content) => {
        expect(content).to.not.be.undefined;
        for (const [key, value] of Object.entries(fileToCompare)) {
          expect(content[key]).to.deep.eq(value);
        }
        expect(content.rest).to.not.be.undefined;
        restFields.forEach((fieldName) => {
          expect(content.rest[fieldName]).to.not.be.undefined;
        });
      },
    );
  });

  it('Can add group to app with groupOverride config', async () => {
    const APPS_RESP = configUtil.getAppsResponse();
    await request
      .get('/ui-meta/v1/apps')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((response) => {
        const apps = response.body;
        expect(response.body).to.have.lengthOf(APPS_RESP.length);
        const chartsApp = apps.find((app) => app.name === 'charts');
        expect(chartsApp.groupNames).to.include('mock-group');
      });
  });
});
