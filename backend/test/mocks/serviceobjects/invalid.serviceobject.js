export default {
  metadata: {
    name: 'invalid',
    labels: {
      'ui.ericsson.com/part-of': 'invalid-client',
    },
  },
  spec: {
    selector: { 'dui-generic': 'invalid' },
    ports: [{ port: 4000 }],
  },
};
