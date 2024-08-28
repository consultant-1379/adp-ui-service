class PmServiceMock {
  constructor(disabled) {
    this.disabled = disabled;
    this.metrics = new Map();
  }

  createMetric(type, param) {
    const metric = {
      value: 0,
      set(value) {
        this.value = value;
      },
      reset() {
        this.value = 0;
      },
    };
    this.metrics.set(param.name, metric);
    return metric;
  }

  deleteMetric(metricName) {
    this.metrics.delete(metricName);
  }

  isEnabled() {
    return !this.disabled;
  }

  getMetricValue(metricName) {
    return this.metrics.get(metricName).value;
  }
}

export default new PmServiceMock();
