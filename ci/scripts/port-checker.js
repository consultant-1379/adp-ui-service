import * as k8s from '@kubernetes/client-node';

const cliArgs = process.argv.slice(2);

const K8S_NAMESPACE = cliArgs[0];
const HELM_CHART_NAME = cliArgs[1];
const TARGET_PORT = cliArgs[2];
const PORT = Number.parseInt(cliArgs[3].trim(), 10);

async function getChartServices() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  const namespacedServices = await k8sApi.listNamespacedService(K8S_NAMESPACE);

  return namespacedServices.body.items.filter((item) =>
    item.metadata.name.includes(HELM_CHART_NAME),
  );
}

function getPortByName(service, targetPort) {
  const { spec } = service;
  return spec.ports.find((port) => port.targetPort === targetPort);
}

const services = await getChartServices();

services.forEach((service) => {
  const { port } = getPortByName(service, TARGET_PORT);
  if (port !== PORT) {
    console.log(`Wrong port number ${port} expected to be ${PORT}`);
    process.exit(1);
  }
});

console.log('All ports are OK');
process.exit(0);
