# Using @particle-academy/fancy-docs — guide for agents

How an agent installs and uses this package in a consumer app. What the package
is, is in [README.md](./README.md). Notes for working ON this repo's code are in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Install

```bash
npm install @particle-academy/fancy-docs @particle-academy/react-fancy
```

- **Peers:** `react` and `react-dom` 19, `@particle-academy/react-fancy`
  `>=5.49.1 <7.0.0`. `@particle-academy/fancy-echarts` (`>=6.1.0 <7.0.0`) is
  needed only when documents contain charts.
- The document itself comes from `last-word`: read the `.docx` on the server with
  PHP `particle-academy/last-word` (the preferred path), or in the browser with
  `@particle-academy/last-word`'s `DocxReader`.

## Find it on the Fancy MCP server

The catalog server is `https://ui.particle.academy/mcp` (streamable HTTP, no API
key; MCP id `fancy-ui`). Registry entries for this package:

| Slug | What |
|---|---|
| `fancy-docs-doc-viewer` | A last-word Doc as Word renders it, framed (`DocViewer`). |
| `doc-file-view` | The docx viewer for fancy-code's `FileViewer` (`registerOfficeViewer`). |

Use `search-components` to find them by concept, `install-instructions` for the
exact commands, `get-component` for the source. Vendored source instead of npm:
`npx fancy-cli@latest add <slug>`.

## API essentials

```tsx
import { DocViewer } from "@particle-academy/fancy-docs";

<div className="h-[40rem]">
  <DocViewer doc={doc} />
</div>
```

- `doc` is the JSON last-word's readers return.
- `frame={false}` gives the bare pages; `frameProps` reaches react-fancy's
  `FauxClient` frame (zoom, full screen).
- `DocFileView` plugs into fancy-code's `FileViewer`:

  ```ts
  import { registerOfficeViewer } from "@particle-academy/fancy-code";
  import { DocFileView } from "@particle-academy/fancy-docs";
  import { DocxReader } from "@particle-academy/last-word";

  registerOfficeViewer("docx", DocFileView, { read: (bytes) => new DocxReader().read(bytes) });
  ```

- `LAYOUT_NOTICE` is exported: the viewer shows a notice when a Doc sets page
  settings where they do not apply (a nested `page`, near-miss keys, `sections`).

## Traps

- **Charts need `@particle-academy/fancy-echarts`.** It is an optional peer;
  install it if your documents have charts.
- **Only safe content renders.** Images must be `data:` rasters (remote URLs are
  dropped), links go through `sanitizeHref` (`javascript:` and `data:` dropped),
  and colours must be `#RRGGBB`; anything else is ignored.
- An unstyled document gets the writer's defaults (Calibri 11pt, 8pt after each
  paragraph, Word's single-line height).
