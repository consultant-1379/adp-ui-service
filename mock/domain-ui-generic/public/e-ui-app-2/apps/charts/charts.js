/**
 * Charts is defined as
 * `<e-charts>`
 *
 * Imperatively create application
 * @example
 * let app = new Charts();
 *
 * Declaratively create application
 * @example
 * <e-charts></e-charts>
 *
 * @extends {App}
 */
import { App, html, definition } from '@eui/app';
import { Tile } from '@eui/layout';
import { DonutChart } from '../../components/donut-chart/donut-chart.js';
import style from './style.css';

export default class Charts extends App {
  static get components() {
    return {
      'e-chart-tile': Tile,
      'e-donut-chart': DonutChart,
    };
  }

  get meta() {
    return import.meta;
  }

  didConnect() {
    this.bubble('app:lineage', { metaData: this.metaData });
  }

  render() {
    this.firstDonutData = [
      { name: this.i18n?.KEY1, values: [4] },
      { name: this.i18n?.KEY2, values: [24] },
      { name: this.i18n?.KEY3, values: [67] },
      { name: this.i18n?.KEY4, values: [5] },
    ];
    this.secondDonutData = [
      { name: this.i18n?.KEY1, values: [4] },
      { name: this.i18n?.KEY2, values: [28] },
      { name: this.i18n?.KEY3, values: [52] },
      { name: this.i18n?.KEY4, values: [16] },
    ];
    this.thirdDonutData = [
      { name: this.i18n?.KEY1, values: [5] },
      { name: this.i18n?.KEY2, values: [32] },
      { name: this.i18n?.KEY3, values: [38] },
      { name: this.i18n?.KEY4, values: [25] },
    ];
    return html`
      <h2>${this.i18n?.TITLE}</h2>
      <div class="main-container">
        <e-chart-tile tile-title=${this.i18n?.FIRST_DONUT_TITLE}>
          <e-donut-chart
            .id="first-donut"
            slot="content"
            .data=${this.firstDonutData}
          ></e-donut-chart>
        </e-chart-tile>
        <e-chart-tile tile-title=${this.i18n?.SECOND_DONUT_TITLE}>
          <e-donut-chart
            .id="second-donut"
            slot="content"
            .data=${this.secondDonutData}
          ></e-donut-chart>
        </e-chart-tile>
        <e-chart-tile tile-title=${this.i18n?.THIRD_DONUT_TITLE}>
          <e-donut-chart
            .id="third-donut"
            slot="content"
            .data=${this.thirdDonutData}
          ></e-donut-chart>
        </e-chart-tile>
      </div>
    `;
  }
}

definition('e-charts', {
  style,
  props: {},
})(Charts);

Charts.register();
