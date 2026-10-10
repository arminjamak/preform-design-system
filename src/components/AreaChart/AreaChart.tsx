import { LineChart, type LineChartProps } from '../LineChart/LineChart';

export type AreaChartProps = Omit<LineChartProps, 'area'> & {
  /** Stack series so the top edge shows the total (e.g. resin by material adding up to total consumption). */
  stacked?: boolean;
};

/** LineChart with the gradient area fill on by default; `stacked` turns it into a stacked area chart with flat translucent bands. */
export function AreaChart({ stacked = false, ...props }: AreaChartProps) {
  return <LineChart {...props} area stacked={stacked} />;
}
