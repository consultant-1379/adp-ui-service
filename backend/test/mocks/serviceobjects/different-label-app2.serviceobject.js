export default {
  metadata: {
    name: 'domain2',
    labels: {
      'ui.ericsson.com/part-of': 'workspace-gui-2',
      'app.kubernetes.io/name': 'domain2',
    },
  },
  spec: {
    selector: { 'dui-generic': 'domain2' },
    ports: [{ port: 4000 }],
  },
};
