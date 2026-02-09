"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";

interface EditorProps {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
}

export default function Editor({ initialMarkdown, onChange }: EditorProps) {
  const [editor, setEditor] = useState<any>(null);
  const newEditor: any = useCreateBlockNote();

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

  useEffect(() => {
    if (!editor) return;

    // Poll for changes periodically and push markdown back to parent.
    // This avoids relying on internal event APIs which can differ between versions.
    const interval = setInterval(async () => {
      try {
        const markdown = await editor.blocksToMarkdownLossy(editor.document);
        onChange(markdown);
      } catch (e) {
        // ignore transient errors
      }
    }, 800);

    // Initial push
    (async () => {
      try {
        const markdown = await editor.blocksToMarkdownLossy(editor.document);
        onChange(markdown);
      } catch (e) {
        /* noop */
      }
    })();

    return () => clearInterval(interval);
  }, [editor, onChange]);

  if (!editor) return <div>Loading Editor...</div>;

  return (
    <div className="h-full">
      <BlockNoteView editor={editor} />
    </div>
  );
}
