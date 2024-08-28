class TelemetryServiceMock {
  createSpan() {
    return {
      span: {
        end: () => {
          // placeholder for createSpan.span.end()
        },
      },
      ctx: {},
    };
  }

  injectContext() {
    // placeholder for telemetryService.injectContext
  }

  setHttpResponseSpanOptions() {
    // placeholder for telemetryService.setHttpResponseSpanOptions
  }

  getTraceId() {
    // placeholder for telemetryService.getTraceId
  }
}

export default new TelemetryServiceMock();
