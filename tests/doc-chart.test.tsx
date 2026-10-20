// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { DocViewer } from "../src";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * last-word 0.10 writes a native `chart` block whose `option` is an ECharts
 * option -- the same field a dark-slide chart takes -- so the viewer draws it
 * with fancy-echarts. Without this a report's chart was simply missing from the
 * page, which reads as "the agent made no chart".
 */

const received: { option?: Record<string, unknown>; style?: Record<string, unknown> }[] = [];
vi.mock("@particle-academy/fancy-echarts", () => ({
  EChart: (props: { option?: Record<string, unknown>; style?: Record<string, unknown> }) => {
    received.push(props);
    return <div data-testid="echart" />;
  },
  registerAll: () => {},
}));

const mounted: Array<() => void> = [];
function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}
afterEach(() => {
  while (mounted.length) mounted.pop()!();
  received.length = 0;
});

const option = {
  title: { text: "Revenue by quarter" },
  xAxis: { type: "category", data: ["Q1", "Q2", "Q3"] },
  yAxis: { type: "value" },
  series: [{ type: "bar", name: "Revenue", data: [120, 135, 150] }],
};

async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

describe("chart blocks", () => {
  it("draws the chart's ECharts option with fancy-echarts", async () => {
    const host = mount(<DocViewer frame={false} doc={{ blocks: [{ type: "chart", option, alt: "Revenue chart" }] as never }} />);
    await settle();
    expect(host.querySelector("[data-testid=echart]")).not.toBeNull();
    const last = received.at(-1)!;
    expect((last.option!.series as unknown[]).length).toBe(1);
    expect((last.option!.title as { text: string }).text).toBe("Revenue by quarter");
    const block = host.querySelector<HTMLElement>("[data-fancy-docs-block=chart]")!;
    expect(block.getAttribute("aria-label")).toBe("Revenue chart");
  });

  it("sizes the chart as the block says, and spans the column by default", async () => {
    const sized = mount(<DocViewer frame={false} doc={{ blocks: [{ type: "chart", option, widthPx: 600, heightPx: 320 }] as never }} />);
    await settle();
    const box = sized.querySelector<HTMLElement>("[data-fancy-docs-block=chart]")!;
    expect(box.style.width).toBe("600px");
    expect(box.style.height).toBe("320px");

    const percent = mount(<DocViewer frame={false} doc={{ blocks: [{ type: "chart", option, width: 60 }] as never }} />);
    await settle();
    expect(percent.querySelector<HTMLElement>("[data-fancy-docs-block=chart]")!.style.width).toBe("60%");

    const fallback = mount(<DocViewer frame={false} doc={{ blocks: [{ type: "chart", option }] as never }} />);
    await settle();
    const f = fallback.querySelector<HTMLElement>("[data-fancy-docs-block=chart]")!;
    expect(f.style.width).toBe("100%");
    // The writer's default height: 0.6 of the width.
    expect(f.style.aspectRatio).toBe("5 / 3");
  });

  it("lays a chart out for the page: transparent behind it, labels kept inside", async () => {
    mount(<DocViewer frame={false} doc={{ blocks: [{ type: "chart", option }] as never }} />);
    await settle();
    const o = received.at(-1)!.option!;
    expect(o.backgroundColor).toBe("transparent");
    // ECharts 6: the plot area reserves room for axis labels AND axis titles.
    expect(o.grid).toMatchObject({ outerBoundsMode: "same", outerBoundsContain: "all" });
  });

  it("draws as Word draws the file, by default: Office palette, legend below, labels above, centred axis titles", async () => {
    // Found beside LibreOffice's render of a real last-word chart document:
    // ECharts' own palette (a lime green stacked series), a legend on top of
    // the category labels, values inside the bars, and axis titles at the end
    // of the axis where one was clipped.
    const { pageChartOption } = await import("../src/ChartBlock");
    const o = pageChartOption({
      legend: { show: true },
      xAxis: { type: "category", name: "Quarter", data: ["Q1", "Q2"] },
      yAxis: { type: "value", name: "USD (thousands)" },
      series: [
        { type: "bar", name: "2025", label: { show: true }, data: [1, 2] },
        { type: "line", name: "2026", label: { show: true }, data: [1, 2] },
      ],
    }) as Record<string, any>;
    expect(o.color.slice(0, 3)).toEqual(["#4472C4", "#ED7D31", "#A5A5A5"]);
    expect(o.legend).toMatchObject({ show: true, bottom: 0 });
    expect(o.series[0].label.position).toBe("top");
    expect(o.series[1].label.position).toBe("top");
    // Centred, and moved clear of the axis labels however long they are: a
    // fixed gap put "Region" on top of "Americas" in the horizontal bar chart.
    expect(o.xAxis).toMatchObject({ nameLocation: "middle", nameMoveOverlap: true });
    expect(o.yAxis).toMatchObject({ nameLocation: "middle", nameRotate: 90, nameMoveOverlap: true });
    expect(o.grid).toMatchObject({ outerBoundsContain: "all" });
    // Room for the legend under the plot.
    expect(o.grid.bottom).toBeGreaterThanOrEqual(28);

    // Horizontal bars put their values at the end of the bar.
    const h = pageChartOption({
      xAxis: { type: "value" },
      yAxis: { type: "category", data: ["A"] },
      series: [{ type: "bar", label: { show: true }, data: [1] }],
    }) as Record<string, any>;
    expect(h.series[0].label.position).toBe("right");

    // An option that says otherwise keeps it.
    const own = pageChartOption({
      color: ["#111111"],
      legend: { show: true, top: 0 },
      xAxis: { type: "category", name: "X", nameLocation: "end", data: ["A"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", label: { show: true, position: "inside" }, data: [1] }],
    }) as Record<string, any>;
    expect(own.color).toEqual(["#111111"]);
    expect(own.legend.top).toBe(0);
    expect(own.legend.bottom).toBeUndefined();
    expect(own.xAxis.nameLocation).toBe("end");
    expect(own.series[0].label.position).toBe("inside");
  });

  it("skips a chart with no series rather than drawing an empty box", async () => {
    const host = mount(<DocViewer frame={false} doc={{ blocks: [{ type: "chart", option: { title: { text: "x" } } }] as never }} />);
    await settle();
    expect(host.querySelector("[data-fancy-docs-block=chart]")).toBeNull();
  });
});
