import type { CSSProperties } from "react";
import type { Border, BoxBorders, BoxSides, ParagraphProps, Run } from "./types";

/**
 * What last-word's writer gives a document that asks for nothing, so an
 * unstyled document looks here as it does in Word. Read off the writer's
 * styles part (docDefaults, Heading1-6, Quote, CodeBlock, Hyperlink) rather
 * than guessed.
 */
export const DEFAULTS = {
  font: "Calibri",
  /** Points. */
  size: 11,
  /** w:spacing after="160": 8pt after every paragraph. */
  spaceAfter: 8,
  /** w:line="259" of 240: 1.08. */
  lineHeight: 1.08,
  /** Heading 1-6, points. */
  headingSizes: [20, 16, 14, 13, 12, 11],
  headingSpaceBefore: 12,
  headingSpaceAfter: 6,
  quoteIndent: 36,
  quoteColor: "#595959",
  codeFont: "Consolas",
  codeSize: 10,
  codeFill: "#F2F2F2",
  linkColor: "#0563C1",
  /** Cell margins 60 / 108 twips. */
  cellPadding: { top: 3, right: 5.4, bottom: 3, left: 5.4 },
  /** The header-cell grey the writer and all three engines share. */
  headerFill: "#E7E7E7",
  /** A border edge that names no width. */
  borderWidth: 0.5,
  /** Page margins when none are given: 1440 twips. */
  margin: 72,
  /** Header / footer distance from the page edge: 720 twips. */
  bandDistance: 36,
  bandSize: 9,
};

/** Page sizes in points, portrait. */
export const PAGE_SIZES: Record<string, [number, number]> = {
  letter: [612, 792],
  legal: [612, 1008],
  a4: [595, 842],
};

/**
 * `#RRGGBB` (or `RRGGBB`), or nothing. A colour comes out of a file, so anything
 * else -- a CSS expression smuggled into a colour field -- is dropped rather
 * than handed to a style.
 */
export function hex(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toUpperCase()}`;
  return undefined;
}

/** A finite number, or nothing. */
export function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** A font name as a CSS family list: quoted, with a generic fallback. */
export function fontStack(font: unknown, generic = "sans-serif"): string | undefined {
  if (typeof font !== "string" || font.trim() === "") return undefined;
  const name = font.replace(/["\\;{}<>]/g, "").trim();
  return `"${name}", ${generic}`;
}

const CSS_STYLE: Record<string, string> = { single: "solid", double: "double", dashed: "dashed", dotted: "dotted" };

/** One border edge as CSS. `style: "none"` removes the edge. */
export function borderCss(border: Border | undefined): string | undefined {
  if (!border) return undefined;
  if (border.style === "none") return "none";
  const width = num(border.width) ?? DEFAULTS.borderWidth;
  const style = CSS_STYLE[border.style ?? "single"] ?? "solid";
  return `${width}pt ${style} ${hex(border.color) ?? "#000000"}`;
}

export function boxBorders(borders: BoxBorders | undefined): CSSProperties {
  if (!borders) return {};
  const out: CSSProperties = {};
  const top = borderCss(borders.top);
  const right = borderCss(borders.right);
  const bottom = borderCss(borders.bottom);
  const left = borderCss(borders.left);
  if (top) out.borderTop = top;
  if (right) out.borderRight = right;
  if (bottom) out.borderBottom = bottom;
  if (left) out.borderLeft = left;
  return out;
}

export function padding(sides: BoxSides | undefined, fallback?: BoxSides): CSSProperties {
  const pick = (k: keyof BoxSides) => num(sides?.[k]) ?? num(fallback?.[k]);
  const out: CSSProperties = {};
  const t = pick("top");
  const r = pick("right");
  const b = pick("bottom");
  const l = pick("left");
  if (t !== undefined) out.paddingTop = `${t}pt`;
  if (r !== undefined) out.paddingRight = `${r}pt`;
  if (b !== undefined) out.paddingBottom = `${b}pt`;
  if (l !== undefined) out.paddingLeft = `${l}pt`;
  return out;
}

/**
 * Word's "single" line is the font's own line height -- ascent + descent + gap,
 * about 1.2 em for Calibri and most text faces -- where CSS's 1.0 is the bare
 * em. So a document's 1.08 lines is 1.08 x 1.2 here; set as 1.08 it drew every
 * paragraph visibly tighter than LibreOffice's render of the same file.
 */
export const SINGLE_LINE = 1.2;

export function lineHeightCss(lines: number): number {
  return Math.round(lines * SINGLE_LINE * 1000) / 1000;
}

/** A paragraph-shaped block's box: alignment, spacing, indents, shading, borders. */
export function paragraphCss(p: ParagraphProps, defaults: { before?: number; after?: number } = {}): CSSProperties {
  const out: CSSProperties = {
    marginTop: `${num(p.spaceBefore) ?? defaults.before ?? 0}pt`,
    marginBottom: `${num(p.spaceAfter) ?? defaults.after ?? DEFAULTS.spaceAfter}pt`,
    lineHeight: String(lineHeightCss(num(p.lineHeight) ?? DEFAULTS.lineHeight)),
    ...boxBorders(p.borders),
  };
  if (p.align) out.textAlign = p.align;
  const left = num(p.indentLeft);
  const right = num(p.indentRight);
  if (left !== undefined) out.marginLeft = `${left}pt`;
  if (right !== undefined) out.marginRight = `${right}pt`;
  const fill = hex(p.shading);
  if (fill) {
    out.backgroundColor = fill;
    // Word draws the shading behind the text with a little room; without it
    // the fill hugs the glyphs and a callout reads as a highlight.
    out.padding = "2pt 4pt";
  }
  return out;
}

/** A run's character style. */
export function runCss(run: Run): CSSProperties {
  const out: CSSProperties = {};
  if (run.bold) out.fontWeight = 700;
  if (run.italic) out.fontStyle = "italic";
  const lines = [run.underline ? "underline" : "", run.strike ? "line-through" : ""].filter(Boolean);
  if (lines.length) out.textDecorationLine = lines.join(" ");
  const color = hex(run.color);
  if (color) out.color = color;
  const highlight = hex(run.highlight);
  if (highlight) out.backgroundColor = highlight;
  const size = num(run.size);
  if (size !== undefined && size > 0) out.fontSize = `${size}pt`;
  const font = fontStack(run.font);
  if (font) out.fontFamily = font;
  if (run.smallCaps) out.fontVariant = "small-caps";
  const spacing = num(run.letterSpacing);
  if (spacing) out.letterSpacing = `${spacing}pt`;
  return out;
}
