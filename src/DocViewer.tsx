import { Fragment, type CSSProperties, type ReactNode } from "react";
import { FauxClient, sanitizeHref, type FauxClientProps } from "@particle-academy/react-fancy";
import type { Band, Block, Doc, ListItem, Run, TableBorders, TableCell } from "./types";
import { borderCss, boxBorders, DEFAULTS, fontStack, hex, num, padding, PAGE_SIZES, paragraphCss, runCss } from "./style";

export interface DocViewerProps {
  /** A last-word document, as its readers return it. */
  doc: Doc;
  /**
   * Show the document in react-fancy's `FauxClient` frame: zoom and full screen,
   * revealed on hover, like every file viewer. Default `true`.
   */
  frame?: boolean;
  /** Passed to the frame: `variant`, a controlled `zoom`, `onFullscreenChange`, … */
  frameProps?: Partial<FauxClientProps>;
  className?: string;
}

/**
 * A last-word document rendered the way Word renders it: page size, margins and
 * running header / footer per page; runs, paragraphs, lists, tables (fills,
 * borders, spans, alignment), code, quotes and images.
 *
 * Measurements stay in points, the model's own unit, so a 0.5pt rule is a 0.5pt
 * rule and the page is the page's size; the frame scales the whole sheet to fit
 * and zooms it.
 *
 * Everything shown came out of a file, so links go through react-fancy's
 * `sanitizeHref`, images are `data:` rasters only (a remote URL in a document
 * is a tracking pixel waiting to fire), and colours must be `#RRGGBB`.
 */
export function DocViewer({ doc, frame = true, frameProps, className }: DocViewerProps) {
  const pages = splitPages(Array.isArray(doc?.blocks) ? doc.blocks : []);
  const total = pages.length;

  const sheets = (
    <div
      data-fancy-docs-viewer=""
      className={className}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 16, background: "#E5E7EB" }}
    >
      {pages.map((blocks, i) => (
        <PageSheet key={i} doc={doc} blocks={blocks} number={i + 1} total={total} />
      ))}
    </div>
  );

  if (!frame) return sheets;

  // The frame lays the sheets out at their real width and scales them to fit,
  // as a word processor opens at "fit page width"; zoom works on top of that.
  return (
    <FauxClient
      variant="device"
      controls
      fill
      width={logicalWidth(doc)}
      scale="fit"
      bodyClassName="overflow-auto"
      {...frameProps}
    >
      {sheets}
    </FauxClient>
  );
}

/** The sheets' width in CSS pixels, gutter included: the frame's logical width. */
function logicalWidth(doc: Doc): number {
  const page = doc?.page ?? {};
  const [w, h] = PAGE_SIZES[page.size ?? "letter"] ?? PAGE_SIZES.letter;
  const width = page.orientation === "landscape" ? h : w;
  return Math.ceil((width * 4) / 3) + 32;
}

/** Page breaks split the flow into sheets; an empty document is one blank sheet. */
function splitPages(blocks: Block[]): Block[][] {
  const pages: Block[][] = [[]];
  for (const block of blocks) {
    if (block?.type === "pageBreak") pages.push([]);
    else pages[pages.length - 1].push(block);
  }
  return pages;
}

function PageSheet({ doc, blocks, number, total }: { doc: Doc; blocks: Block[]; number: number; total: number }) {
  const page = doc.page ?? {};
  const [w, h] = PAGE_SIZES[page.size ?? "letter"] ?? PAGE_SIZES.letter;
  const [width, height] = page.orientation === "landscape" ? [h, w] : [w, h];
  const m = page.margins ?? {};
  const margin = (side: "top" | "right" | "bottom" | "left") => num(m[side]) ?? DEFAULTS.margin;

  const style: CSSProperties = {
    position: "relative",
    width: `${width}pt`,
    minHeight: `${height}pt`,
    background: "#FFFFFF",
    color: "#000000",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
    fontFamily: fontStack(doc.defaultFont ?? DEFAULTS.font),
    fontSize: `${num(doc.defaultSize) ?? DEFAULTS.size}pt`,
    flexShrink: 0,
  };

  return (
    <section data-fancy-docs-page={number} style={style}>
      {page.header && <BandLine band={page.header} kind="header" number={number} total={total} left={margin("left")} right={margin("right")} />}
      <div
        data-fancy-docs-body=""
        style={{ paddingTop: `${margin("top")}pt`, paddingRight: `${margin("right")}pt`, paddingBottom: `${margin("bottom")}pt`, paddingLeft: `${margin("left")}pt` }}
      >
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
      {page.footer && <BandLine band={page.footer} kind="footer" number={number} total={total} left={margin("left")} right={margin("right")} />}
    </section>
  );
}

/** A running header or footer: left / center / right, with `{page}` and `{pages}` filled in. */
function BandLine({ band, kind, number, total, left, right }: { band: Band; kind: "header" | "footer"; number: number; total: number; left: number; right: number }) {
  const fill = (s: unknown) => (typeof s === "string" ? s.split("{page}").join(String(number)).split("{pages}").join(String(total)) : "");
  const style: CSSProperties = {
    position: "absolute",
    left: `${left}pt`,
    right: `${right}pt`,
    [kind === "header" ? "top" : "bottom"]: `${DEFAULTS.bandDistance}pt`,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    fontSize: `${num(band.size) ?? DEFAULTS.bandSize}pt`,
    color: hex(band.color) ?? "#595959",
  };
  return (
    <div data-fancy-docs-band={kind} style={style}>
      <span style={{ textAlign: "left" }}>{fill(band.left)}</span>
      <span style={{ textAlign: "center" }}>{fill(band.center)}</span>
      <span style={{ textAlign: "right" }}>{fill(band.right)}</span>
    </div>
  );
}

function Runs({ runs }: { runs: Run[] | undefined }) {
  return (
    <>
      {(Array.isArray(runs) ? runs : []).map((run, i) => (
        <RunView key={i} run={run} />
      ))}
    </>
  );
}

function RunView({ run }: { run: Run }) {
  const text = typeof run?.text === "string" ? run.text : "";
  const style = runCss(run);
  const href = typeof run.link === "string" ? sanitizeHref(run.link) : undefined;

  if (run.code) {
    style.fontFamily = style.fontFamily ?? fontStack(DEFAULTS.codeFont, "monospace");
    style.backgroundColor = style.backgroundColor ?? DEFAULTS.codeFill;
  }
  if (href) {
    style.color = style.color ?? DEFAULTS.linkColor;
    style.textDecorationLine = style.textDecorationLine ?? "underline";
  }

  // Line breaks inside a run are real breaks, as Word shows them.
  const parts = text.split("\n");
  const content = parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {part}
    </Fragment>
  ));
  const span = run.code ? (
    <code data-fancy-docs-run="" style={style}>{content}</code>
  ) : (
    <span data-fancy-docs-run="" style={style}>{content}</span>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {span}
    </a>
  ) : (
    span
  );
}

function BlockView({ block }: { block: Block }): ReactNode {
  switch (block?.type) {
    case "heading": {
      const level = Math.min(6, Math.max(1, Math.round(num(block.level) ?? 1)));
      const Tag = `h${level}` as "h1";
      const style: CSSProperties = {
        ...paragraphCss(block, { before: DEFAULTS.headingSpaceBefore, after: DEFAULTS.headingSpaceAfter }),
        fontSize: `${DEFAULTS.headingSizes[level - 1]}pt`,
        fontWeight: 700,
      };
      return (
        <Tag data-fancy-docs-block="heading" style={style}>
          <Runs runs={block.runs} />
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p data-fancy-docs-block="paragraph" style={paragraphCss(block)}>
          <Runs runs={block.runs} />
        </p>
      );
    case "list":
      return <ListView items={block.items} ordered={!!block.ordered} />;
    case "table":
      return <TableView block={block} />;
    case "code":
      return (
        <pre
          data-fancy-docs-block="code"
          style={{
            margin: `0 0 ${DEFAULTS.spaceAfter}pt`,
            padding: "4pt 6pt",
            background: DEFAULTS.codeFill,
            fontFamily: fontStack(DEFAULTS.codeFont, "monospace"),
            fontSize: `${DEFAULTS.codeSize}pt`,
            lineHeight: 1,
            whiteSpace: "pre-wrap",
          }}
        >
          <code>{typeof block.text === "string" ? block.text : ""}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote
          data-fancy-docs-block="quote"
          style={{ margin: `0 0 0 ${DEFAULTS.quoteIndent}pt`, fontStyle: "italic", color: DEFAULTS.quoteColor }}
        >
          {(Array.isArray(block.blocks) ? block.blocks : []).map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </blockquote>
      );
    case "image": {
      // Rasters embedded in the file only: a remote URL would fetch as soon as
      // the document opened -- a tracking pixel in a file someone sent you.
      const src = typeof block.src === "string" && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(block.src) ? block.src : null;
      if (!src) return null;
      return (
        <img
          data-fancy-docs-block="image"
          src={src}
          alt={typeof block.alt === "string" ? block.alt : ""}
          style={{ display: "block", maxWidth: "100%", width: num(block.widthPx), height: num(block.heightPx) ? undefined : "auto", margin: `0 0 ${DEFAULTS.spaceAfter}pt` }}
        />
      );
    }
    case "hr":
      return <hr data-fancy-docs-block="hr" style={{ border: 0, borderTop: "0.5pt solid #000000", margin: `0 0 ${DEFAULTS.spaceAfter}pt` }} />;
    default:
      return null;
  }
}

function ListView({ items, ordered }: { items: ListItem[] | undefined; ordered: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag data-fancy-docs-block="list" style={{ margin: `0 0 ${DEFAULTS.spaceAfter}pt`, paddingLeft: "18pt", listStyleType: ordered ? "decimal" : "disc" }}>
      {(Array.isArray(items) ? items : []).map((item, i) => (
        <li key={i} style={{ ...paragraphCss(item, { after: 0 }) }}>
          <Runs runs={item.runs} />
          {Array.isArray(item.children) && item.children.length > 0 && <ListView items={item.children} ordered={ordered} />}
        </li>
      ))}
    </Tag>
  );
}

type TableBlock = Extract<Block, { type: "table" }>;

function TableView({ block }: { block: TableBlock }) {
  const rows = Array.isArray(block.rows) ? block.rows : [];
  const widths = Array.isArray(block.widths) ? block.widths.filter((w) => num(w) !== undefined && w > 0) : [];
  const sum = widths.reduce((a, b) => a + b, 0);
  const width = num(block.width);
  const borders: TableBorders = block.borders ?? {};

  const style: CSSProperties = {
    borderCollapse: "collapse",
    width: width !== undefined ? `${width}%` : "100%",
    tableLayout: widths.length > 0 ? "fixed" : "auto",
    marginBottom: `${DEFAULTS.spaceAfter}pt`,
    ...(block.align === "center" ? { marginLeft: "auto", marginRight: "auto" } : block.align === "right" ? { marginLeft: "auto" } : {}),
  };

  // Every edge defaults to the writer's 0.5pt single line; `{ style: "none" }` removes one.
  const edge = (b: TableBorders[keyof TableBorders]) => borderCss(b) ?? `${DEFAULTS.borderWidth}pt solid #000000`;

  return (
    <table data-fancy-docs-block="table" style={style}>
      {widths.length > 0 && (
        <colgroup>
          {widths.map((w, i) => (
            <col key={i} style={{ width: `${Math.round((w / sum) * 1000) / 10}%` }} />
          ))}
        </colgroup>
      )}
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {(Array.isArray(row.cells) ? row.cells : []).map((cell, c, cells) => {
              const header = !!row.header;
              const Tag = header ? "th" : "td";
              const first = c === 0;
              const last = c === cells.length - 1;
              const cellStyle: CSSProperties = {
                // Outer edges from the table's box; inner ones from insideH / insideV.
                borderTop: r === 0 ? edge(borders.top) : edge(borders.insideH),
                borderBottom: r === rows.length - 1 ? edge(borders.bottom) : edge(borders.insideH),
                borderLeft: first ? edge(borders.left) : edge(borders.insideV),
                borderRight: last ? edge(borders.right) : edge(borders.insideV),
                ...padding(cell.padding, { ...DEFAULTS.cellPadding, ...(block.cellPadding ?? {}) }),
                ...boxBorders(cell.borders),
                verticalAlign: cell.valign === "center" ? "middle" : cell.valign ?? "top",
                textAlign: "left",
                fontWeight: header ? 700 : undefined,
                backgroundColor: hex(cell.shading) ?? (header ? DEFAULTS.headerFill : undefined),
              };
              return (
                <Tag
                  key={c}
                  style={cellStyle}
                  colSpan={num(cell.colSpan) && cell.colSpan! > 1 ? cell.colSpan : undefined}
                  rowSpan={num(cell.rowSpan) && cell.rowSpan! > 1 ? cell.rowSpan : undefined}
                >
                  <CellBlocks cell={cell} />
                </Tag>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A cell's blocks, with the last paragraph's trailing space dropped as Word does inside a cell. */
function CellBlocks({ cell }: { cell: TableCell }) {
  const blocks = Array.isArray(cell.blocks) ? cell.blocks : [];
  return (
    <>
      {blocks.map((b, i) =>
        b?.type === "paragraph" ? (
          <p key={i} data-fancy-docs-block="paragraph" style={{ ...paragraphCss(b), ...(i === blocks.length - 1 && num(b.spaceAfter) === undefined ? { marginBottom: 0 } : {}) }}>
            <Runs runs={b.runs} />
          </p>
        ) : (
          <BlockView key={i} block={b} />
        ),
      )}
    </>
  );
}
