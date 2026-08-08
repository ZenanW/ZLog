"use client";

import { createContext, useContext, useEffect, useState, type SyntheticEvent } from "react";
import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { getSignedNoteImageUrl } from "@/lib/noteImageClient";
import {
  MAX_NOTE_IMAGE_DISPLAY_WIDTH,
  normalizeNoteImageWrapMode,
} from "@/lib/noteImages";

export const NoteImageTokenContext = createContext<string | null>(null);

function NoteImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const idToken = useContext(NoteImageTokenContext);
  const storagePath = node.attrs.storagePath as string | null;
  const wrapMode = normalizeNoteImageWrapMode(node.attrs.wrapMode);
  const width = typeof node.attrs.width === "number" ? node.attrs.width : null;
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!storagePath || !idToken) return;
    let cancelled = false;
    getSignedNoteImageUrl(storagePath, idToken)
      .then((signed) => {
        if (!cancelled) {
          setUrl(signed);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storagePath, idToken]);

  if (!storagePath) return null;

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (width) return;
    const naturalWidth = event.currentTarget.naturalWidth;
    if (!naturalWidth) return;
    const displayWidth = Math.min(naturalWidth, MAX_NOTE_IMAGE_DISPLAY_WIDTH);
    updateAttributes({ width: displayWidth });
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`note-image-wrapper note-image-wrap-${wrapMode}`}
      contentEditable={false}
    >
      <div
        className={`note-image-frame${selected ? " note-image-selected" : ""}`}
        data-drag-handle=""
      >
        {error ? (
          <div className="note-image-error">Image unavailable</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url ?? undefined}
            alt={(node.attrs.alt as string) || ""}
            className="note-editor-image"
            draggable={false}
            onLoad={handleLoad}
            style={width ? { width: `${width}px` } : undefined}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const NoteImage = Image.extend({
  addAttributes() {
    return {
      storagePath: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-storage-path"),
        renderHTML: (attributes) => {
          if (!attributes.storagePath) return {};
          return { "data-storage-path": attributes.storagePath };
        },
      },
      wrapMode: {
        default: "block",
        parseHTML: (element) =>
          normalizeNoteImageWrapMode(element.getAttribute("data-wrap-mode")),
        renderHTML: (attributes) => ({
          "data-wrap-mode": normalizeNoteImageWrapMode(attributes.wrapMode),
        }),
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-width");
          if (!raw) return null;
          const parsed = Number.parseInt(raw, 10);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { "data-width": attributes.width };
        },
      },
      alt: {
        default: null,
      },
      src: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-storage-path]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { class: "note-editor-image" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteImageView, {
      attrs: ({ node }) => ({
        "data-wrap-mode": normalizeNoteImageWrapMode(node.attrs.wrapMode),
      }),
      update: ({ updateProps }) => {
        updateProps();
        return true;
      },
    });
  },
}).configure({ inline: false, allowBase64: false });
