import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  HeatmapChart,
  ScatterChart,
  PieChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  HeatmapChart,
  ScatterChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  SVGRenderer,
]);

export default echarts;
export * from 'echarts/core';
export type { EChartsOption } from 'echarts';
