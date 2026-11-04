import type { Doc } from "./types";

/**
 * What the viewer says when a document asks for more than one page setup. It draws
 * one until per-page geometry lands; drawing nothing, or drawing it wrong in
 * silence, are the two worse answers. The same words as last-word-ui.
 */
export const LAYOUT_NOTICE =
  "Mixed page orientation isn't shown yet. This document asks for different page settings partway through; every page here uses the document's one page setup.";

/** The page object's own keys, written straight on a break when `page` was meant. */
const NEAR_MISS_KEYS = ["size", "orientation", "margins", "header", "footer", "firstHeader", "firstFooter", "evenHeader", "evenFooter", "background", "border"];

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null;

/**
 * Whether the document asks for page layout this viewer ignores: `pageBreak.page`,
 * the near-miss keys on a break or a top-level `sections`, at any depth. The Doc came
 * out of a file, so nothing here trusts its shape. A walk, not a recursion: the
 * nesting is the file's.
 */
export function asksForMixedLayout(doc: Doc): boolean {
  if (!isObject(doc)) return false;
  if ((doc as Loose).sections !== undefined) return true;

  const stack: unknown[] = [doc.blocks];
  while (stack.length > 0) {
    const blocks = stack.pop();
    if (!Array.isArray(blocks)) continue;
    for (const block of blocks as unknown[]) {
      if (!isObject(block)) continue;
      if (block.type === "pageBreak") {
        if (["page", ...NEAR_MISS_KEYS].some((key) => block[key] !== undefined)) return true;
      } else if (block.type === "quote") {
        stack.push(block.blocks);
      } else if (block.type === "table" && Array.isArray(block.rows)) {
        for (const row of block.rows as unknown[]) {
          if (!isObject(row) || !Array.isArray(row.cells)) continue;
          for (const cell of row.cells as unknown[]) {
            if (isObject(cell)) stack.push(cell.blocks);
          }
        }
      }
    }
  }
  return false;
}
