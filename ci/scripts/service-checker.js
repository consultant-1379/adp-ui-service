#!/usr/bin/env node
/* eslint-disable no-await-in-loop */

/**

The script fetches all discovered apps, groups, components and packages from GAS meta endpoints, collects the related service names per each of these,
and compares this list with the required service list given as command line argument.
The microservices API is called using port forwarding on each GAS pods using API paths.
Checks MAX_TRIES times, and waits WAIT_INTERVAL seconds in between.
If API calls use secure communication (HTTPS) then key/pem shall be obtained.

Usage:
  ./service-checker.js <k8s-namespace> <ingress_protocol> <helm-chart-name> <mock-service1> <mock-service2>

*/

import fetch from 'node-fetch';
import * as k8s from '@kubernetes/client-node';
import * as net from 'net';
import * as https from 'https';
import fs from 'fs';

const GAS_APPS_PATH = 'ui-meta/v1/apps';
const GAS_COMPONENTS_PATH = 'ui-meta/v1/components';
const GAS_GROUPS_PATH = 'ui-meta/v1/groups';
const GAS_PACKAGES_PATH = 'ui-serve/v1/list-packages';
const MAX_TRIES = 50;
const WAIT_INTERVAL = 10;
const PORT_FORWARD_START_PORT = 8085;
const LOCALHOST = '127.0.0.1';

const cliArgs = process.argv.slice(2);

const K8S_NAMESPACE = cliArgs[0];
const INGRESS_PROTOCOL = cliArgs[1];
const HELM_CHART_NAME = cliArgs[2];
const REQUIRED_SERVICES = cliArgs.slice(3).map((serviceName) => serviceName.trim());

console.log(
  `The received cli params: ${JSON.stringify({
    K8S_NAMESPACE,
    INGRESS_PROTOCOL,
    HELM_CHART_NAME,
    REQUIRED_SERVICES,
  })}`,
);

let podNames;
let tries = 0;
let allRequiredServiceIsFound = false;
const podProperties = [];

if (REQUIRED_SERVICES.length === 0) {
  console.log(`Define the list of mockservices to wait for.`);
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const KEY_CERT_FILE = 'key.pem';
const CERT_FILE = 'cert.pem';
let clientCert = null;
let clientCertKey = null;
let tlsAgent = null;

function parseSecretJSON(secretJSON) {
  try {
    const secret = JSON.parse(secretJSON);
    const secretData = secret.data;
    clientCert = Buffer.from(secretData[CERT_FILE], 'base64').toString('utf-8');
    clientCertKey = Buffer.from(secretData[KEY_CERT_FILE], 'base64').toString('utf-8');
  } catch (error) {
    console.error(`Secret json parsing failed: ${error.name} - ${error.message}.`);
  }
}

function fetchSecret() {
  try {
    const secretJSON = fs.readFileSync('ci/scripts/secrets/client-secret.json');
    if (!secretJSON) {
      console.log('Client certificate for keycloak api not found!');
    }
    console.log('Client certificate for keycloak api found!');
    parseSecretJSON(secretJSON);
  } catch (error) {
    console.error(`Secret fetching failed: ${error.name} - ${error.message}.`);
  }
}

if (INGRESS_PROTOCOL === 'https') {
  fetchSecret();

  const options = {
    keepAlive: true,
    rejectUnauthorized: false,
    cert: clientCert,
    key: clientCertKey,
    ALPNProtocols: ['http/1.1'], // Enable ALPN negotiation. For some server the TLS not working without ALPN
  };

  tlsAgent = new https.Agent(options);

  if (!clientCert || !clientCertKey) {
    console.log(
      `Cannot make HTTPs connection because ${clientCert ? 'clientCertKey' : 'clientCert'} missing`,
    );
    console.log('Quiting');
    process.exit(1);
  }
}

const wait = async (s) =>
  new Promise((resolve) => {
    setTimeout(resolve, s * 1000);
  });

const fetchAPI = async (url, defaultValue) => {
  const fetchOptions = INGRESS_PROTOCOL === 'https' ? { agent: tlsAgent } : {};
  try {
    const response = await fetch(url, fetchOptions);
    return response.json();
  } catch (e) {
    console.log(e);
    return defaultValue;
  }
};

async function fetchEndpoints(port) {
  const appsEndpoint = `${INGRESS_PROTOCOL}://${LOCALHOST}:${port}/${GAS_APPS_PATH}`;
  const componentsEndpoint = `${INGRESS_PROTOCOL}://${LOCALHOST}:${port}/${GAS_COMPONENTS_PATH}`;
  const groupsEndpoint = `${INGRESS_PROTOCOL}://${LOCALHOST}:${port}/${GAS_GROUPS_PATH}`;
  const packagesEndpoint = `${INGRESS_PROTOCOL}://${LOCALHOST}:${port}/${GAS_PACKAGES_PATH}`;

  return {
    apps: await fetchAPI(appsEndpoint, []),
    components: await fetchAPI(componentsEndpoint, []),
    groups: await fetchAPI(groupsEndpoint, []),
    packages: await fetchAPI(packagesEndpoint, {}),
  };
}

async function getGasPodNames() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  const namespacedPods = await k8sApi.listNamespacedPod(K8S_NAMESPACE);

  podNames = namespacedPods.body.items
    .filter((item) => item.metadata.name.includes(HELM_CHART_NAME))
    .map((pod) => pod.metadata.name);
}

async function checkDiscoveredServices() {
  while (tries < MAX_TRIES && !allRequiredServiceIsFound) {
    console.log(`#${tries}. Fetching data from REST API...`);

    for (const podProperty of podProperties) {
      const result = await fetchEndpoints(podProperty.port);

      const getServiceList = (resultPart) => resultPart.map((r) => r.service);

      const foundServices = [
        ...Object.keys(result.packages),
        ...getServiceList(result.apps),
        ...getServiceList(result.components),
        ...getServiceList(result.groups),
      ];

      const foundService = REQUIRED_SERVICES.filter((service) => foundServices.includes(service));
      const notFoundService = REQUIRED_SERVICES.filter(
        (service) => !foundServices.includes(service),
      );

      podProperty.ready = notFoundService.length === 0;

      console.log(`Found services: ${foundService.join(',')}`);
      console.log(`Still missing services: ${notFoundService.join(',')}`);
    }

    allRequiredServiceIsFound = podProperties.every((podProperty) => podProperty.ready);
    if (allRequiredServiceIsFound) {
      break;
    }

    tries += 1;
    console.log(
      `Discovery still in progress, sleeping for ${WAIT_INTERVAL} seconds. Elapsed time: ${
        tries * WAIT_INTERVAL
      }s`,
    );
    await wait(WAIT_INTERVAL);
  }

  if (allRequiredServiceIsFound) {
    console.log(`All services are found in time`);
    console.log(`Deployment ready, all mock services are discovered!`);
    process.exit(0);
  } else {
    console.log(`Some services are not found in time`);
    console.log(`Deployment did not succeed in time!`);
    process.exit(1);
  }
}

async function createPortForward() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const forward = new k8s.PortForward(kc);

  return Promise.allSettled(
    podNames.map(async (podName, index) => {
      const server = net.createServer(async (socket) => {
        await forward.portForward(K8S_NAMESPACE, podName, [3000], socket, null, socket);
      });

      const portForwardedPort = PORT_FORWARD_START_PORT + index;

      return new Promise((resolve) => {
        server.listen(portForwardedPort, LOCALHOST, () => {
          console.log(`Portforward server listening on ${LOCALHOST}:${portForwardedPort}`);
          podProperties.push({ port: portForwardedPort, serverReference: server, ready: false });
          resolve();
        });
      });
    }),
  );
}

await getGasPodNames();
await createPortForward();
await checkDiscoveredServices();
