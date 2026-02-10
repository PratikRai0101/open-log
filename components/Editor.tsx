"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";

interface EditorProps {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
}

const Editor = forwardRef(function Editor({ initialMarkdown, onChange, editable = true }: EditorProps, ref) {
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const newEditor: any = useCreateBlockNote();

  // Initialize editor and set initial content
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (initialMarkdown && typeof newEditor.tryParseMarkdownToBlocks === "function") {
          const blocks = await newEditor.tryParseMarkdownToBlocks(initialMarkdown);
          await newEditor.replaceBlocks(newEditor.document, blocks);
        }
        if (mounted) setEditor(newEditor);
      } catch (e) {
        console.error("Editor init error:", e);
        if (mounted) setEditor(newEditor);
      }
    }
    load();
    return () => { mounted = false; };
  }, [newEditor, initialMarkdown]);

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

  // Toggle editable/read-only mode
  useEffect(() => {
    if (!editor) return;
    try {
      // BlockNote editor exposes isEditable in some builds
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      editor.isEditable = !!editable;
    } catch (e) {
      // ignore
    }
  }, [editor, editable]);

  // Change handler: try to use BlockNote's onChange via BlockNoteView; fallback to polling
  useEffect(() => {
    if (!editor) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
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
        if (!cancelled) onChange(markdown);
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
    <div className={`h-full bg-[#0A0A0B] rounded-xl overflow-hidden border border-white/10 ${!editable ? 'opacity-90' : ''}`}>
      <BlockNoteView
        editor={editor}
        theme="dark"
        className="min-h-full py-4 pl-4 pr-2"
      />
    </div>
  );
});

export default Editor;
