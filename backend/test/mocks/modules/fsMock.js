const fsMock = ({ uiServiceConfig, manualConfig, logControlConfig }) => ({
  readFileSync: (filePath) => {
    switch (filePath) {
      case 'config/backend-service-config/backend-service-config.json':
        return JSON.stringify(uiServiceConfig);
      case 'config/backend-service-config/manualconfig.json':
        return JSON.stringify(manualConfig);
      case 'config/log-control/logcontrol.json':
        return JSON.stringify(logControlConfig);
      default:
        return '';
    }
  },
  existsSync: () => false,
});

export default fsMock;
