# fancy-docs — agent guide

Renders a **last-word `Doc`** (the JSON its PHP and JS readers return) the way
Word renders it. Process rules (publishing, versions, backports) live in the
envelope's `RULES.md`; this file is about this repo's code.

## What lives where

- `src/types.ts` — the Doc model, **structural**: no dependency on last-word.
  Mirror its `schema/types.ts` when the model grows; do not import it.
- `src/style.ts` — the writer's defaults (`DEFAULTS`, read off last-word's
  `docx-writer.ts` styles part, not guessed) and the CSS helpers.
- `src/DocViewer.tsx` — pages, bands, blocks, tables.
- `src/DocFileView.tsx` — the `registerOfficeViewer` adapter for fancy-code.
  Its props match fancy-code's `OfficeViewerProps` WITHOUT importing them.

## Invariants

- **Points stay points.** The model's unit is the point; CSS has `pt`. Do not
  convert to px except for the frame's logical width.
- **Word's single line is ~1.2 em** (`SINGLE_LINE`). A document's `lineHeight`
  is a multiple of THAT, not of CSS's 1.0. Drop the factor and every paragraph
  draws tighter than LibreOffice's render of the same file.
- **Everything shown came out of a file.** Links through `sanitizeHref`; images
  `data:` rasters only (a remote URL is a tracking pixel); colours `#RRGGBB`
  only via `hex()`. A new style field that takes a string from the doc goes
  through the same kind of gate.
- **A header row with no fill of its own is `#E7E7E7`**, the grey the writer
  and all three engines share.

## Checking a change

`npm test` (vitest, jsdom). jsdom does not lay out, so for anything visual put a
real `.docx` beside its LibreOffice render in a browser — the lab keeps both
under `fancy-labs/storage/app/lab-artifacts/*/document-*.docx` and
`.../rendered/document-*.pdf`.
