import { Callout, type FauxClientProps } from "@particle-academy/react-fancy";
import { DocViewer } from "./DocViewer";
import type { Doc } from "./types";

export interface DocFileViewProps {
  /** A document as last-word's reader returns it. */
  document: unknown;
  filename?: string;
  /** Passed to the FauxClient frame. */
  frameProps?: Partial<FauxClientProps>;
}

/**
 * A .docx in fancy-code's `FileViewer`: register it once at app start.
 *
 * ```ts
 * registerOfficeViewer("docx", DocFileView, { read: (b) => new DocxReader().read(b) });
 * ```
 *
 * The props match fancy-code's `OfficeViewerProps` without importing them, so
 * this package does not depend on fancy-code.
 */
export function DocFileView({ document, filename, frameProps }: DocFileViewProps) {
  const doc = document as Partial<Doc> | null;

  // A reader that returned something else would otherwise draw a blank page.
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.blocks)) {
    return <Callout color="red">{filename ?? "This file"} did not read as a document.</Callout>;
  }

  return <DocViewer doc={doc as Doc} frameProps={frameProps} />;
}
