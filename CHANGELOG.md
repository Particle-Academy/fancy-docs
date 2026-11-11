# Changelog

All notable changes to `@particle-academy/fancy-docs` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **Pre-1.0:** breaking changes land in MINOR releases. Until 1.0 the minor
> number is not a compatibility promise — read the entry, not the version.

## [Unreleased]

### Changed

- **Releases need a lab-run certificate.** `publish.yml` gains a read-only
  `lab-certificate` job that every publishing job needs: a tag is published only
  when the fancy-labs lab has certified that exact version and commit. Consumers
  do nothing; this changes how releases are cut, not what the package does.

## [0.4.0] - 2026-11-04

### Added

- **Mixed page orientation.** A `pageBreak` carrying `page` changes the page from there on: each sheet is drawn at the page in force there. `margins` merge side by side and every other key is replaced whole. `{"type": "pageBreak", "page": {}}` is a new sheet with nothing changed.

### Changed

- The notice no longer fires for a `page` on a top-level break. It still fires for what the writers refuse (a nested `page`, a background on a break, page keys straight on a break, a top-level `sections`), in new words. **Consumer action:** none, unless you compared `LAYOUT_NOTICE`'s text.

## [0.3.0] - 2026-11-03

**What you must do: nothing.** A document with one page setup draws exactly as
before, with no new element.

### Added

- **A visible notice when a document asks for mixed page layout** (mixed page
  orientation, stage 1). `pageBreak.page`, page keys written straight on a break
  (`pageBreak.orientation`, `.margins`, ...) and a top-level `sections` were silently
  ignored, so a landscape section drew as portrait with nothing said. The document
  still draws, one page setup as before, under a react-fancy `Callout`
  (`data-fancy-docs-layout-notice`) in light and dark. New export: `LAYOUT_NOTICE`.
  Per-page geometry comes in a later release; **consumer action:** none. Those
  near-miss keys and `sections` do not exist: `pageBreak.page` is the form, and
  `last-word` refuses all of them on write until it can honour the first.

## [0.2.1] - 2026-11-01

### Changed

- **The `@particle-academy/react-fancy` peer range now also accepts 6.x** (`>=5.49.1 <6.0.0` to `>=5.49.1 <7.0.0`). react-fancy 6.0.0 makes `Button` default to `type="button"` instead of submitting an enclosing form (Change Council CC-fancy-0003). Audited for that: it renders no react-fancy `Button` and no form. No `Button` needed `type="submit"` and no `PromptInput` is used, so the package behaves the same on 5 and 6. The devDependency moved to `^6.0.0`, so this package's own suite, typecheck and build now run against 6. Widening only adds candidates, so the react-fancy you already have still resolves. **Consumer action:** none on react-fancy 5; on react-fancy 6 it works as-is.

## [0.2.0] - 2026-10-20

### Added

- **Charts.** last-word 0.10 writes a native `chart` block whose `option` is an
  ECharts option (the same field dark-slide charts take); `DocViewer` draws it
  with fancy-echarts, sized as the writer sizes it (`widthPx` / `heightPx`, a
  `width` percentage of the column, or the full column at 0.6 of its width).
  Drawn as Word draws the file by default: last-word's (Office's) palette,
  legend under the plot, values above a bar or point (past the end of a
  horizontal bar), axis titles centred and kept clear of the axis labels. An
  option that sets any of these keeps its own. A chart with no series is
  skipped rather than drawn as an empty box. Checked beside LibreOffice's
  render of a seven-chart last-word document.
- **`@particle-academy/fancy-echarts` is an OPTIONAL peer** (`>=6.1.0 <7.0.0`),
  loaded only when a document has a chart. Without it a chart shows a labelled
  placeholder instead of failing. **What to do:** install it if your documents
  have charts.

### Known

- A chart's `numberFormat` (an Excel format) is not applied to its labels yet:
  a value Word shows as `172` shows as `171.5`.

## [0.1.0] - 2026-10-19

### Added

- **`DocViewer`**: a last-word document rendered the way Word renders it —
  page size, orientation and margins, a sheet per page break, the running
  header and footer with `{page}` / `{pages}`, run and paragraph styling,
  headings, nested lists, tables (widths, borders including removed ones,
  header rows and their default fill, cell fills, padding, vertical alignment,
  spans), code, quotes, rules and embedded images. In react-fancy's
  `FauxClient` frame, scaled to fit the page width, with zoom and full screen
  revealed on hover.
- **`DocFileView`**: the same, for fancy-code's `FileViewer` —
  `registerOfficeViewer("docx", DocFileView, { read })`.
- Asked for in last-word-js#2, where a consumer's preview went through a
  third-party converter that flattened every style the last-word guide makes
  required.
