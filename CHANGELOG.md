# Changelog

All notable changes to `@particle-academy/fancy-docs` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **Pre-1.0:** breaking changes land in MINOR releases. Until 1.0 the minor
> number is not a compatibility promise — read the entry, not the version.

## [Unreleased]

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
