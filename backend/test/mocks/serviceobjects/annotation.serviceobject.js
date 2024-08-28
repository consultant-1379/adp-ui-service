export default {
  metadata: {
    name: 'domain1',
    labels: {
      'ui.ericsson.com/part-of': 'workspace-gui',
      'app.kubernetes.io/name': 'domain-service-1',
      'app.kubernetes.io/version': '2.0.1-44',
    },
    annotations: {
      'ui.ericsson.com/external-baseurl': 'http://localhost/context',
      'ui.ericsson.com/config-context': '/configcontext',
    },
  },
  spec: {
    selector: { 'dui-generic': 'annotation' },
    ports: [{ port: 4000 }],
  },
};
