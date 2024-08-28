export default {
  metadata: {
    name: 'domain1',
    labels: {
      'ui.ericsson.com/part-of': 'workspace-gui-1',
      'app.kubernetes.io/name': 'domain1',
    },
  },
  spec: {
    selector: { 'dui-generic': 'domain1' },
    ports: [{ port: 4000 }],
  },
};
