export default {
  kind: 'Endpoints',
  apiVersion: 'v1',
  metadata: {
    name: 'domain1',
    labels: {
      'app.kubernetes.io/name': 'domain-service-1',
      'app.kubernetes.io/version': '2.0.1-44',
      'ui.ericsson.com/part-of': 'workspace-gui',
    },
    annotations: {
      'endpoints.kubernetes.io/last-change-trigger-time': '2022-01-05T15:16:26Z',
    },
  },
  subsets: [
    {
      addresses: [],
      ports: [],
    },
  ],
};
