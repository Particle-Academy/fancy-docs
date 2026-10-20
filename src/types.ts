/**
 * The last-word document model, as its readers (PHP and JS, one schema) return
 * it. Structural on purpose -- no dependency on last-word -- and loose, because
 * a read document is data from a file, not something this package wrote.
 */

export type Align = "left" | "center" | "right" | "justify";
export type VAlign = "top" | "center" | "bottom";
export type BorderStyle = "single" | "double" | "dashed" | "dotted" | "none";

export interface Border {
  style?: BorderStyle;
  /** Points. Default 0.5. */
  width?: number;
  /** #RRGGBB */
  color?: string;
}

export interface BoxBorders {
  top?: Border;
  right?: Border;
  bottom?: Border;
  left?: Border;
}

export interface TableBorders extends BoxBorders {
  insideH?: Border;
  insideV?: Border;
}

export interface BoxSides {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  smallCaps?: boolean;
  link?: string;
  color?: string;
  highlight?: string;
  size?: number;
  font?: string;
  letterSpacing?: number;
}

export interface ParagraphProps {
  align?: Align;
  spaceBefore?: number;
  spaceAfter?: number;
  lineHeight?: number;
  indentLeft?: number;
  indentRight?: number;
  shading?: string;
  borders?: BoxBorders;
}

export interface ListItem extends ParagraphProps {
  runs: Run[];
  children?: ListItem[];
}

export interface TableCell {
  blocks: Block[];
  shading?: string;
  borders?: BoxBorders;
  padding?: BoxSides;
  valign?: VAlign;
  colSpan?: number;
  rowSpan?: number;
}

export interface TableRow {
  header?: boolean;
  cells: TableCell[];
}

export type Block =
  | ({ type: "heading"; level: number; runs: Run[] } & ParagraphProps)
  | ({ type: "paragraph"; runs: Run[] } & ParagraphProps)
  | { type: "list"; ordered?: boolean; items: ListItem[] }
  | {
      type: "table";
      rows: TableRow[];
      widths?: number[];
      width?: number;
      align?: "left" | "center" | "right";
      borders?: TableBorders;
      cellPadding?: BoxSides;
    }
  | { type: "code"; language?: string; text: string }
  | { type: "quote"; blocks: Block[] }
  | { type: "image"; src: string; widthPx?: number; heightPx?: number; alt?: string }
  | { type: "pageBreak" }
  | { type: "hr" }
  | {
      type: "chart";
      /** An Apache ECharts option, as last-word 0.10 writes it (the same field dark-slide charts take). */
      option: Record<string, unknown>;
      widthPx?: number;
      heightPx?: number;
      /** Percentage of the text column. */
      width?: number;
      numberFormat?: string;
      alt?: string;
    };

/** A running header or footer: three slots; `{page}` and `{pages}` are filled in. */
export interface Band {
  left?: string;
  center?: string;
  right?: string;
  /** Points. Default 9. */
  size?: number;
  color?: string;
}

export interface Page {
  size?: "letter" | "legal" | "a4";
  orientation?: "portrait" | "landscape";
  margins?: BoxSides;
  header?: Band;
  footer?: Band;
}

export interface Doc {
  title?: string;
  blocks: Block[];
  page?: Page;
  defaultFont?: string;
  defaultSize?: number;
}
