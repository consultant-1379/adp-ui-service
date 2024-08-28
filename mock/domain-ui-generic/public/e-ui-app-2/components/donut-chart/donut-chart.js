/**
 * Component DonutChart is defined as
 * `<e-donut-chart>`
 *
 * Imperatively create component
 * @example
 * let component = new DonutChart();
 *
 * Declaratively create component
 * @example
 * <e-donut-chart></e-donut-chart>
 *
 * @extends {LitComponent}
 */
import { LitComponent, html, definition } from '@eui/lit-component';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Donut } from '@eds/vanilla/charts/donut/Donut.js';
import donutStyle from './donut-chart.css';

class DonutChart extends LitComponent {
  /**
   * When the component is first upgraded, init the chart.
   */
  didUpgrade() {
    if (this.data) {
      this._createChart();
    }
  }

  /**
   * Hook into the lifecycle callback to update the chart
   * or create a new chart if any of the props are changed
   *
   * @function didChangeProps
   * @param {Map} changedProps - previous values of the changed props
   */
  didChangeProps(changedProps) {
    if (changedProps.has('data')) {
      if (this.chart) {
        this._destroyChart();
      }
      this._createChart();
    }
  }

  /**
   * Creates a new chart using private prop this._chartData
   *
   * @function _createChart
   * @private
   */
  _createChart = () => {
    this._chartData = { series: this.data };
    this.chart = new Donut({
      element: this.shadowRoot.getElementById('donut-chart-anchor'),
      showValue: true,
      showAbsoluteValue: true,
      data: this._chartData,
      unit: this.unit,
    });
    this.chart.init();
  };

  /**
   * Destroys the chart
   *
   * @function _destroyChart
   * @private
   */
  _destroyChart = () => {
    this.shadowRoot.querySelector('#donut-chart-anchor').innerHTML = null;
  };

  /**
   * Renders a style tag
   *
   * @function _colorStyle
   * @param {Array} colors - array of color variable names
   * @private
   */
  _colorStyle = (colors) => {
    let styleString = '';
    colors.forEach((color, index) => {
      styleString = `${styleString} .color-data-${index + 1} { fill: var(--${color}); }`;
    });
    return html`
      <style>
        ${styleString}
      </style>
    `;
  };

  /**
   * Returns an array of color variables, one for each
   * element inside the data.series array
   *
   * @function _setColors
   * @param {Object} data - data used to create the Donut chart
   * @private
   */
  _setColors = (data) => {
    const myColors = [];

    for (let i = 0; i < data.series.length; i += 1) {
      myColors.push(`color-data-${i + 1}`);
    }

    return myColors;
  };

  /**
   * Render the <e-donut-chart> component. This function is called each time a
   * prop changes.
   */
  render() {
    const colors = this._chartData ? this._setColors(this._chartData) : [];
    return html`
      ${this._colorStyle(colors)}
      <div class="donut-layout" part="layout">
        <div class="eds-chart" id="donut-chart-anchor"></div>
      </div>
    `;
  }
}

definition('e-donut-chart', {
  style: donutStyle,
  props: {
    data: { type: Array },
    unit: { attribute: true, type: String, default: 'g' },
    _chartData: { type: Object },
    hideLegend: { type: Boolean, attribute: true },
  },
})(DonutChart);

DonutChart.register();

export { DonutChart };
