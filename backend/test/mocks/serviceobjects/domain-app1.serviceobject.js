export default {
  metadata: {
    name: 'domain1',
    labels: {
      'ui.ericsson.com/part-of': 'workspace-gui',
      'app.kubernetes.io/name': 'domain1',
      'app.kubernetes.io/version': '1.0.0',
    },
    annotations: {
      'ui.ericsson.com/protocol': 'https',
    },
  },
  spec: {
    selector: { 'dui-generic': 'domain1' },
    ports: [{ port: 4000 }],
  },
};
