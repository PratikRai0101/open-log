"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";

interface EditorProps {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
}

const Editor = forwardRef(function Editor({ initialMarkdown, onChange, editable = true }: EditorProps, ref) {
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const newEditor: any = useCreateBlockNote();
  const createdRef = /*#__PURE__*/ { current: null } as any;
  const lastPushedRef = /*#__PURE__*/ { current: null } as any;
  const suppressOnChangeRef = /*#__PURE__*/ { current: false } as any;

  // Create editor instance once and set into state
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!createdRef.current) createdRef.current = newEditor;
        if (mounted) setEditor(createdRef.current);
      } catch (e) {
        console.error("Editor init error:", e);
        if (mounted) setEditor(newEditor);
      }
    }
    load();
    return () => { mounted = false; };
    // Intentionally only run once when component mounts. newEditor is stable from the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When initialMarkdown changes, update editor content.
  // We avoid reading the editor's current markdown here to keep this fast during streaming.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    (async () => {
      try {
        // If the parent already pushed this exact markdown, skip.
        if (initialMarkdown === lastPushedRef.current) return;
        if (initialMarkdown && typeof (editor as any).tryParseMarkdownToBlocks === "function") {
          // Suppress emitting onChange while we programmatically replace blocks to avoid
          // creating an update loop between parent -> prop -> replace -> parent
          suppressOnChangeRef.current = true;
          const blocks = await (editor as any).tryParseMarkdownToBlocks(initialMarkdown);
          await (editor as any).replaceBlocks((editor as any).document, blocks);
          lastPushedRef.current = initialMarkdown;
          suppressOnChangeRef.current = false;
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [editor, initialMarkdown]);

  // Expose getMarkdown for publish flush
  useImperativeHandle(ref, () => ({
    getMarkdown: async () => {
      if (!editor) return initialMarkdown || "";
      try {
        return await (editor as any).blocksToMarkdownLossy(editor.document);
      } catch (e) {
        return initialMarkdown || "";
      }
    }
  }), [editor, initialMarkdown]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Toggle editable/read-only mode. Some BlockNote builds expose an API; as a fallback
  // we set the contentEditable attribute on the rendered editor/view content so typing
  // is disabled in preview mode while still allowing selection and scrolling.
  useEffect(() => {
    if (!editor) return;
    try {
      // Try the editor-level API first
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof editor.isEditable !== "undefined") {
        // @ts-ignore
        editor.isEditable = !!editable;
      }
    } catch (e) {
      // ignore
    }

    // Fallback: set contentEditable on the actual DOM content container inside this component
    try {
      const root = containerRef.current;
      if (root) {
        const contentEl = root.querySelector('.bn-editor__content, .bn-view__content') as HTMLElement | null;
        if (contentEl) {
          contentEl.contentEditable = editable ? 'true' : 'false';
          // also set aria-readonly for accessibility
          if (!editable) contentEl.setAttribute('aria-readonly', 'true');
          else contentEl.removeAttribute('aria-readonly');
        }
      }
    } catch (e) {
      // ignore DOM fallback failures
    }
  }, [editor, editable]);

  // Change handler: try to use BlockNote's onChange via BlockNoteView; fallback to polling
  useEffect(() => {
    if (!editor) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        if (suppressOnChangeRef.current) return;
        const markdown = await (editor as any).blocksToMarkdownLossy(editor.document);
        if (!cancelled) onChange(markdown);
      } catch (e) {
        // ignore
      }
    }, 800);

    // initial push
    (async () => {
      try {
        const markdown = await (editor as any).blocksToMarkdownLossy(editor.document);
        if (!cancelled && !suppressOnChangeRef.current) onChange(markdown);
      } catch (e) {
        // noop
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [editor, onChange]);

  if (!editor) return <div className="text-zinc-500 p-4">Loading Editor...</div>;

  return (
    <div ref={containerRef} className={`h-full bg-[#0A0A0B] rounded-xl overflow-hidden border border-white/10 ${!editable ? 'opacity-90' : ''}`}>
      <BlockNoteView
        editor={editor}
        theme="dark"
        className="min-h-full py-4 pl-4 pr-2"
      />
    </div>
  );
});

export default Editor;
