import { lazy, Suspense, type ComponentType, type CSSProperties } from "react";
import { DEFAULTS, num } from "./style";

export interface ChartBlockData {
  type: "chart";
  /** An Apache ECharts option -- the same field a dark-slide chart element takes. */
  option: Record<string, unknown>;
  /** Pixels. */
  widthPx?: number;
  heightPx?: number;
  /** Percentage of the text column. */
  width?: number;
  /** Excel number format for the chart's values. */
  numberFormat?: string;
  alt?: string;
}

interface InnerProps {
  option: unknown;
}

/**
 * fancy-echarts is an OPTIONAL peer: a document without a chart must not make
 * an app install a charting engine. So it is loaded on first use, and an app
 * without it gets a labelled placeholder rather than a build failure -- the
 * pattern fancy-slides' chart host uses.
 */
const ChartInner: ComponentType<InnerProps> = lazy(async () => {
  try {
    const mod: Record<string, unknown> = await import("@particle-academy/fancy-echarts");
    const EChart = mod.EChart as ComponentType<{ option: unknown; style?: CSSProperties }> | undefined;
    if (!EChart) return { default: Missing };
    (mod.registerAll as (() => void) | undefined)?.();
    return {
      default: ({ option }: InnerProps) => <EChart option={option} style={{ width: "100%", height: "100%" }} />,
    };
  } catch {
    return { default: Missing };
  }
});

function Missing() {
  return (
    <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", border: "0.5pt dashed #9CA3AF", color: "#6B7280", fontSize: "9pt" }}>
      Chart (install @particle-academy/fancy-echarts to draw it)
    </div>
  );
}

/**
 * The option laid out for a page: transparent behind it (the page shows
 * through, as in Word) and a grid that keeps axis labels inside the box.
 * Defaults only -- an option that sets its own keeps it.
 */
export function pageChartOption(option: Record<string, unknown>): Record<string, unknown> {
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  const hasAxes = option.xAxis !== undefined || option.yAxis !== undefined;
  const xAxis = isObj(option.xAxis) ? option.xAxis : undefined;
  const yAxis = isObj(option.yAxis) ? option.yAxis : undefined;
  // Bars run sideways when the CATEGORY axis is y.
  const horizontal = (yAxis?.type ?? "value") === "category";

  // Legend below the plot, as Word places it; only when the file did not.
  const legendShown = isObj(option.legend) && option.legend.show !== false;
  const legend =
    isObj(option.legend) && legendShown && option.legend.top === undefined && option.legend.bottom === undefined
      ? { ...option.legend, bottom: 0 }
      : option.legend;

  // Axis titles centred along their axis, as Word draws them. ECharts puts a
  // name at the END of the axis, where a long one is clipped.
  const named = (axis: Record<string, unknown> | undefined, extra: Record<string, unknown>) =>
    axis && typeof axis.name === "string" && axis.name !== "" && axis.nameLocation === undefined
      ? { ...axis, nameLocation: "middle", ...extra }
      : axis;

  // Values printed past the end of the bar or above the point (outEnd), as
  // Word prints them; ECharts' default puts a bar's value inside it.
  const series = Array.isArray(option.series)
    ? option.series.map((s) => {
        if (!isObj(s) || !isObj(s.label) || s.label.show !== true || s.label.position !== undefined) return s;
        if (s.type === "bar") return { ...s, label: { ...s.label, position: horizontal ? "right" : "top" } };
        if (s.type === "line") return { ...s, label: { ...s.label, position: "top" } };
        return s;
      })
    : option.series;

  return {
    backgroundColor: "transparent",
    // The palette last-word's writer uses when a chart names no colours, so an
    // unstyled chart is the colour it is in Word, not ECharts' own.
    color: OFFICE_PALETTE,
    ...option,
    ...(legend === undefined ? {} : { legend }),
    ...(series === undefined ? {} : { series }),
    // nameMoveOverlap (ECharts 6) measures the gap from the axis LABELS, so a
    // long category label never ends up under the title; outerBoundsContain
    // 'all' makes the plot area leave room for labels and titles alike.
    ...(xAxis ? { xAxis: named(xAxis, { nameGap: 10, nameMoveOverlap: true }) } : {}),
    ...(yAxis ? { yAxis: named(yAxis, { nameGap: 10, nameRotate: 90, nameMoveOverlap: true }) } : {}),
    ...(hasAxes
      ? {
          grid: option.grid ?? {
            top: option.title ? 36 : 16,
            right: 16,
            bottom: 8 + (legendShown ? 28 : 0),
            left: 8,
            outerBoundsMode: "same",
            outerBoundsContain: "all",
          },
        }
      : {}),
  };
}

/** last-word's default chart palette (Office's): 4472C4, ED7D31, A5A5A5, … */
const OFFICE_PALETTE = ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5", "#70AD47", "#264478", "#9E480E"];

/** Whether the block has anything to plot. ECharts draws an empty box for an option with no series. */
export function isPlottable(block: ChartBlockData): boolean {
  const option = block?.option;
  if (!option || typeof option !== "object") return false;
  const series = (option as { series?: unknown }).series;
  return Array.isArray(series) ? series.length > 0 : series !== undefined && series !== null;
}

/**
 * A chart block, sized as the writer sizes it: `widthPx` / `heightPx` when given,
 * a `width` percentage of the column, or the full column at 0.6 of its width tall.
 */
export function ChartBlock({ block }: { block: ChartBlockData }) {
  const widthPx = num(block.widthPx);
  const heightPx = num(block.heightPx);
  const percent = num(block.width);

  const style: CSSProperties = {
    width: widthPx !== undefined ? `${widthPx}px` : percent !== undefined ? `${percent}%` : "100%",
    maxWidth: "100%",
    margin: `0 0 ${DEFAULTS.spaceAfter}pt`,
  };
  if (heightPx !== undefined) style.height = `${heightPx}px`;
  else style.aspectRatio = "5 / 3";

  return (
    <div data-fancy-docs-block="chart" role="img" aria-label={typeof block.alt === "string" ? block.alt : undefined} style={style}>
      <Suspense fallback={null}>
        <ChartInner option={pageChartOption(block.option)} />
      </Suspense>
    </div>
  );
}
