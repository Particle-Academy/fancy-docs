# Changelog

All notable changes to `@particle-academy/fancy-docs` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **Pre-1.0:** breaking changes land in MINOR releases. Until 1.0 the minor
> number is not a compatibility promise — read the entry, not the version.

## [Unreleased]

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
