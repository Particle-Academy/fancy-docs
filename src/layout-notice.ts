import type { Doc } from "./types";

/**
 * What the viewer says when a document asks for page settings in a form it does not
 * honour. A `page` on a top-level break is drawn; what is left here is what the writers
 * refuse too. Drawing nothing, or drawing it wrong in silence, are the two worse answers.
 * The same words as last-word-ui.
 */
export const LAYOUT_NOTICE =
  "Some page settings in this document aren't shown. It sets them somewhere they don't apply: on a page break directly, in a quote or a table cell, or under a sections key.";

/** The page object's own keys, written straight on a break when `page` was meant. */
const NEAR_MISS_KEYS = ["size", "orientation", "margins", "header", "footer", "firstHeader", "firstFooter", "evenHeader", "evenFooter", "background", "border"];

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null;

/** Whether a break's `page` is a page object. `{}` that came through PHP's JSON arrives as `[]`. */
export const isPageObject = (page: unknown): boolean => (isObject(page) && !Array.isArray(page)) || (Array.isArray(page) && page.length === 0);

/**
 * Whether the document asks for page layout this viewer ignores: `page` on a nested
 * break or one that is not an object, a background on a break, the near-miss keys on a
 * break or a top-level `sections`, at any depth. The Doc came out of a file, so nothing
 * here trusts its shape. A walk, not a recursion: the nesting is the file's.
 */
export function asksForMixedLayout(doc: Doc): boolean {
  if (!isObject(doc)) return false;
  if ((doc as Loose).sections !== undefined) return true;

  const stack: unknown[] = [doc.blocks];
  while (stack.length > 0) {
    const blocks = stack.pop();
    if (!Array.isArray(blocks)) continue;
    const topLevel = blocks === doc.blocks;
    for (const block of blocks as unknown[]) {
      if (!isObject(block)) continue;
      if (block.type === "pageBreak") {
        if (NEAR_MISS_KEYS.some((key) => block[key] !== undefined)) return true;
        if (block.page !== undefined) {
          if (!topLevel || !isPageObject(block.page)) return true;
          if (isObject(block.page) && !Array.isArray(block.page) && (block.page as Loose).background !== undefined) return true;
        }
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
