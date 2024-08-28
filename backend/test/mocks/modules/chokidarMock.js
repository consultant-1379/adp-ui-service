const chokidarMock = {
  watch() {
    return this;
  },
  on() {
    return this;
  },
  close() {
    return Promise.resolve();
  },
};

export default chokidarMock;
