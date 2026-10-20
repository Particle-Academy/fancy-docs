// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { DocViewer, DocFileView } from "../src";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * A last-word Doc rendered as Word renders it.
 *
 * Asked for in last-word-js#2: the consumer's preview went through a third-party
 * docx converter that flattened everything the last-word guide makes required --
 * header-row fills, right-aligned numbers, callout shading and borders,
 * borderless header tables, heading colours, the page footer -- so reviewers
 * thought the agent had written a plain document when the file was right.
 * These pin each of those, in the schema the reader returns.
 */

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
});

const page = (host: HTMLElement) => host.querySelectorAll<HTMLElement>("[data-fancy-docs-page]");

describe("runs", () => {
  it("keeps every character style", () => {
    const host = mount(
      <DocViewer
        frame={false}
        doc={{
          blocks: [
            {
              type: "paragraph",
              runs: [
                { text: "B", bold: true },
                { text: "I", italic: true },
                { text: "U", underline: true, strike: true },
                { text: "C", color: "#1F3A5F", highlight: "#FFF59D", size: 14, font: "Georgia" },
                { text: "K", code: true },
                { text: "S", smallCaps: true, letterSpacing: 1.5 },
              ],
            },
          ],
        }}
      />,
    );
    const spans = Array.from(host.querySelectorAll<HTMLElement>("[data-fancy-docs-run]"));
    expect(spans.map((s) => s.textContent)).toEqual(["B", "I", "U", "C", "K", "S"]);
    expect(spans[0].style.fontWeight).toBe("700");
    expect(spans[1].style.fontStyle).toBe("italic");
    expect(spans[2].style.textDecorationLine).toBe("underline line-through");
    expect(spans[3].style.color).toBe("rgb(31, 58, 95)");
    expect(spans[3].style.backgroundColor).toBe("rgb(255, 245, 157)");
    expect(spans[3].style.fontSize).toBe("14pt");
    expect(spans[3].style.fontFamily).toContain("Georgia");
    expect(spans[4].tagName).toBe("CODE");
    expect(spans[5].style.fontVariant).toBe("small-caps");
    expect(spans[5].style.letterSpacing).toBe("1.5pt");
  });

  it("links only to safe URLs, and ignores a colour that is not #RRGGBB", () => {
    const host = mount(
      <DocViewer
        frame={false}
        doc={{
          blocks: [
            {
              type: "paragraph",
              runs: [
                { text: "ok", link: "https://example.com/report" },
                { text: "bad", link: "javascript:alert(1)" },
                { text: "colour", color: "red; background: url(https://example.com/x)" },
              ],
            },
          ],
        }}
      />,
    );
    const links = Array.from(host.querySelectorAll("a"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://example.com/report"]);
    expect(links[0].getAttribute("rel")).toContain("noopener");
    expect(host.textContent).toContain("bad");
    const colour = Array.from(host.querySelectorAll<HTMLElement>("[data-fancy-docs-run]")).find((s) => s.textContent === "colour")!;
    expect(colour.getAttribute("style") ?? "").not.toContain("url(");
  });
});

describe("paragraphs and headings", () => {
  it("keeps alignment, spacing, indent, and a callout's shading and border", () => {
    const host = mount(
      <DocViewer
        frame={false}
        doc={{
          blocks: [
            {
              type: "paragraph",
              runs: [{ text: "Note" }],
              align: "right",
              spaceBefore: 6,
              spaceAfter: 12,
              lineHeight: 1.5,
              indentLeft: 18,
              shading: "#EEF4FF",
              borders: { left: { style: "single", width: 3, color: "#2F5BEA" } },
            },
          ],
        }}
      />,
    );
    const p = host.querySelector<HTMLElement>("[data-fancy-docs-block=paragraph]")!;
    expect(p.style.textAlign).toBe("right");
    expect(p.style.marginTop).toBe("6pt");
    expect(p.style.marginBottom).toBe("12pt");
    // 1.5 lines of Word "single" spacing, which is the font's own line height
    // (about 1.2 em), not CSS's 1.0: 1.5 x 1.2.
    expect(p.style.lineHeight).toBe("1.8");
    expect(p.style.marginLeft).toBe("18pt");
    expect(p.style.backgroundColor).toBe("rgb(238, 244, 255)");
    expect(p.style.borderLeft).toBe("3pt solid rgb(47, 91, 234)");
  });

  it("renders a heading at its level, in its colour", () => {
    const host = mount(
      <DocViewer frame={false} doc={{ blocks: [{ type: "heading", level: 2, runs: [{ text: "Results", color: "#1F3A5F" }] }] }} />,
    );
    const h2 = host.querySelector("h2")!;
    expect(h2.textContent).toBe("Results");
    expect(h2.querySelector<HTMLElement>("[data-fancy-docs-run]")!.style.color).toBe("rgb(31, 58, 95)");
  });
});

describe("tables", () => {
  const table = {
    type: "table" as const,
    widths: [30, 70],
    width: 80,
    align: "center" as const,
    borders: { insideV: { style: "none" as const } },
    cellPadding: { left: 4, right: 4 },
    rows: [
      { header: true, cells: [{ blocks: [{ type: "paragraph", runs: [{ text: "Item" }] }] }, { shading: "#1F3A5F", blocks: [{ type: "paragraph", runs: [{ text: "Amount", color: "#FFFFFF" }] }] }] },
      {
        cells: [
          { rowSpan: 2, valign: "center", blocks: [{ type: "paragraph", runs: [{ text: "Q3" }] }] },
          { blocks: [{ type: "paragraph", align: "right", runs: [{ text: "$1,250,000" }] }] },
        ],
      },
      { cells: [{ blocks: [{ type: "paragraph", align: "right", runs: [{ text: "$980,400" }] }] }] },
      { cells: [{ colSpan: 2, blocks: [{ type: "paragraph", runs: [{ text: "Total" }] }] }] },
    ],
  };

  it("keeps header fills, the default header grey, spans and alignment", () => {
    const host = mount(<DocViewer frame={false} doc={{ blocks: [table] }} />);
    const ths = host.querySelectorAll<HTMLElement>("th");
    expect(ths.length).toBe(2);
    // A header cell with no fill of its own gets the grey the writer gives it.
    expect(ths[0].style.backgroundColor).toBe("rgb(231, 231, 231)");
    expect(ths[1].style.backgroundColor).toBe("rgb(31, 58, 95)");
    const tds = host.querySelectorAll<HTMLElement>("td");
    expect(tds[0].getAttribute("rowspan")).toBe("2");
    expect(tds[0].style.verticalAlign).toBe("middle");
    expect(tds[1].querySelector<HTMLElement>("[data-fancy-docs-block=paragraph]")!.style.textAlign).toBe("right");
    expect(host.querySelector("td[colspan='2']")?.textContent).toBe("Total");
  });

  it("keeps column widths, table width and alignment, and removed borders", () => {
    const host = mount(<DocViewer frame={false} doc={{ blocks: [table] }} />);
    const t = host.querySelector<HTMLElement>("table")!;
    expect(t.style.width).toBe("80%");
    expect(t.style.marginLeft).toBe("auto");
    expect(t.style.marginRight).toBe("auto");
    expect(Array.from(host.querySelectorAll<HTMLElement>("col")).map((c) => c.style.width)).toEqual(["30%", "70%"]);
    // insideV: none -> no vertical rule between the cells of a row.
    const first = host.querySelector<HTMLElement>("th")!;
    // (jsdom reports the `none` shorthand as "medium"; the style longhand is exact.)
    expect(first.style.borderRightStyle).toBe("none");
    expect(first.style.paddingLeft).toBe("4pt");
  });
});

describe("other blocks", () => {
  it("renders nested lists, code, quote, rule and a data: image, and drops a remote image", () => {
    const host = mount(
      <DocViewer
        frame={false}
        doc={{
          blocks: [
            { type: "list", ordered: true, items: [{ runs: [{ text: "One" }], children: [{ runs: [{ text: "One.a" }] }] }, { runs: [{ text: "Two" }] }] },
            { type: "code", language: "ts", text: "const x = 1;" },
            { type: "quote", blocks: [{ type: "paragraph", runs: [{ text: "Quoted" }] }] },
            { type: "hr" },
            { type: "image", src: "data:image/png;base64,iVBORw0KGgo=", alt: "chart", widthPx: 200 },
            { type: "image", src: "https://example.com/tracker.png", alt: "remote" },
          ],
        }}
      />,
    );
    expect(host.querySelector("ol > li > ul, ol > li > ol")).not.toBeNull();
    expect(host.querySelector("pre code")?.textContent).toBe("const x = 1;");
    expect(host.querySelector("blockquote")?.textContent).toBe("Quoted");
    expect(host.querySelector("hr")).not.toBeNull();
    const imgs = Array.from(host.querySelectorAll("img"));
    expect(imgs.map((i) => i.getAttribute("alt"))).toEqual(["chart"]);
  });
});

describe("pages, header and footer", () => {
  const doc = {
    defaultFont: "Calibri",
    defaultSize: 11,
    page: {
      size: "a4" as const,
      orientation: "landscape" as const,
      margins: { top: 36, right: 54, bottom: 36, left: 54 },
      header: { left: "Ledger Sync", right: "Internal" },
      footer: { center: "Page {page} of {pages}" },
    },
    blocks: [
      { type: "paragraph" as const, runs: [{ text: "First page" }] },
      { type: "pageBreak" as const },
      { type: "paragraph" as const, runs: [{ text: "Second page" }] },
    ],
  };

  it("splits at page breaks, sized and margined as the page says", () => {
    const host = mount(<DocViewer frame={false} doc={doc} />);
    const pages = page(host);
    expect(pages.length).toBe(2);
    // A4 landscape is 842 x 595 points.
    expect(pages[0].style.width).toBe("842pt");
    expect(pages[0].style.minHeight).toBe("595pt");
    const body = pages[0].querySelector<HTMLElement>("[data-fancy-docs-body]")!;
    expect(body.style.paddingLeft).toBe("54pt");
    expect(pages[0].style.fontFamily).toContain("Calibri");
    expect(pages[0].style.fontSize).toBe("11pt");
  });

  it("draws the header and footer on every page, with page numbers", () => {
    const host = mount(<DocViewer frame={false} doc={doc} />);
    const pages = page(host);
    expect(pages[0].querySelector("[data-fancy-docs-band=header]")?.textContent).toContain("Ledger Sync");
    expect(pages[0].querySelector("[data-fancy-docs-band=header]")?.textContent).toContain("Internal");
    expect(pages[0].querySelector("[data-fancy-docs-band=footer]")?.textContent).toBe("Page 1 of 2");
    expect(pages[1].querySelector("[data-fancy-docs-band=footer]")?.textContent).toBe("Page 2 of 2");
  });
});

describe("frame", () => {
  it("sits in the FauxClient frame with zoom and full screen, unless told not to", () => {
    const framed = mount(<DocViewer doc={{ blocks: [] }} />);
    expect(framed.querySelector("[data-react-fancy-faux-client]")).not.toBeNull();
    expect(framed.querySelector("[data-react-fancy-faux-client-zoom-in]")).not.toBeNull();
    expect(framed.querySelector("[data-react-fancy-faux-client-fullscreen]")).not.toBeNull();
    const bare = mount(<DocViewer doc={{ blocks: [] }} frame={false} />);
    expect(bare.querySelector("[data-react-fancy-faux-client]")).toBeNull();
  });
});

describe("DocFileView", () => {
  it("shows a read doc, and says so when the document is not one", () => {
    const ok = mount(<DocFileView document={{ blocks: [{ type: "paragraph", runs: [{ text: "Hello" }] }] }} filename="r.docx" />);
    expect(ok.textContent).toContain("Hello");
    const bad = mount(<DocFileView document={{ nope: true }} filename="r.docx" />);
    expect(bad.querySelector("[data-fancy-docs-page]")).toBeNull();
    expect(bad.textContent).toContain("r.docx");
  });
});
