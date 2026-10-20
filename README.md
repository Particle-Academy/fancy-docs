# @particle-academy/fancy-docs

[![Fancified](https://raw.githubusercontent.com/Particle-Academy/react-fancy/main/art/fancified.svg)](https://particle.academy)

Render a **last-word document** (`.docx`) the way Word renders it, in React.

`last-word` writes and reads `.docx` in PHP and Node. This is the view: the
document its reader returns, drawn page by page with the styling a reviewer
expects to see — header-row fills, right-aligned numbers, callout shading and
borders, heading colours, borderless tables, and the running header and footer
with page numbers. It is the docx member of the Fancy file viewers, next to
`fancy-slides` (pptx) and `fancy-sheets` (xlsx), and sits in react-fancy's
`FauxClient` frame like them: zoom and full screen, revealed on hover.

## Install

```bash
npm install @particle-academy/fancy-docs @particle-academy/react-fancy
```

Peers: `react` and `react-dom` 19, `@particle-academy/react-fancy` `>=5.49.1 <6`.

## Show a document

Read the file on your server with PHP `particle-academy/last-word` (the
preferred path) and hand the result to the page:

```tsx
import { DocViewer } from "@particle-academy/fancy-docs";

<div className="h-[40rem]">
  <DocViewer doc={doc} />
</div>
```

`frame={false}` gives the bare pages; `frameProps` reaches the frame.

## In fancy-code's FileViewer

Register it once at app start and `FileViewer` opens `.docx` files with it —
from a server-read `document` when you have one, or by reading the file in the
browser with last-word's JS reader when you only have a URL:

```ts
import { registerOfficeViewer } from "@particle-academy/fancy-code";
import { DocFileView } from "@particle-academy/fancy-docs";
import { DocxReader } from "@particle-academy/last-word";

registerOfficeViewer("docx", DocFileView, { read: (bytes) => new DocxReader().read(bytes) });
```

## What it renders

| | |
|---|---|
| Page | size (letter / legal / A4), orientation, margins; a sheet per page break |
| Header / footer | left / center / right on every page, `{page}` and `{pages}` filled in |
| Runs | bold, italic, underline, strike, colour, highlight, size, font, small caps, letter spacing, inline code, links |
| Paragraphs | alignment, spacing, line height, indents, shading, borders |
| Headings | levels 1–6 at the writer's sizes |
| Lists | ordered and bulleted, nested |
| Tables | column widths, table width and alignment, borders (including removed ones), header rows and their default fill, cell fills, padding, vertical alignment, row and column spans |
| Also | code blocks, quotes, rules, embedded images |

An unstyled document gets the writer's own defaults (Calibri 11pt, 8pt after
each paragraph, Word's single-line height), so it looks as it does in Word.

## Safety

Everything shown came out of a file:

- links go through react-fancy's `sanitizeHref` (`javascript:` and `data:` are dropped)
- images are `data:` rasters only — a remote URL in a document would fetch the
  moment it opened, a tracking pixel in a file someone sent you
- colours must be `#RRGGBB`; anything else is ignored rather than handed to a style

## License

MIT
