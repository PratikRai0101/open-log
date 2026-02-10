"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import "./editor-theme.css";

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
  const autosaveTimerRef = useRef<number | null>(null);
  const [lastSavedAtLocal, setLastSavedAtLocal] = useState<number | null>(null);
  const domRetryRef = useRef<{ timer: number | null; attempts: number }>({ timer: null, attempts: 0 });
  const enforceIntervalRef = useRef<number | null>(null);

  const selectors = [
    '.bn-editor__content',
    '.bn-view__content',
    '.bn-container',
    '.bn-root',
    '.blocknote-root',
    '.blocknote-editor'
  ];

  // Remove stray bullet/glyph characters that can appear inside markdown list
  // items (e.g. "- • Fix bug" or "• Some item") while preserving
  // the markdown list markers ("- ", "* ", "1. "). This prevents
  // double visible bullets when BlockNote renders its own marker.
  const sanitizeMarkdownLeadingBullets = (md: string) => {
    if (!md) return md;
    const bullets = "\u2022\u25E6\u2219\u00B7\u2023\u00B0\u25CF\u2024\u00B7•·◦○∙";
    // Build a character class for the regex from the bullets string (escape if needed)
    const bulletClass = `[${bullets.replace(/[-\\\]\\^]/g, "\\$&")}]+`;
    const lines = md.split('\n');
    return lines.map((line) => {
      // If there's a markdown list marker (unordered or ordered), remove any
      // bullet glyphs that follow it (e.g. "- • item" -> "- item").
      let out = line.replace(new RegExp(`^(\\s*([-*+]\\s+))(?:${bulletClass}\\s*)+`), '$1');
      // Ordered lists like "1. • item"
      out = out.replace(new RegExp(`^(\\s*\\d+\\.\\s+)(?:${bulletClass}\\s*)+`), '$1');
      // If the line starts with a bullet glyph and no markdown marker, strip it.
      out = out.replace(new RegExp(`^\\s*(?:${bulletClass}\\s*)+`), '');
      return out;
    }).join('\n');
  };

  // Helper to set contentEditable on matching elements within root or document
  const setContentEditableAll = (editableFlag: boolean) => {
    try {
      const root = containerRef.current || document.body;
      if (!root) return false;
      let found = false;
      selectors.forEach((sel) => {
        const els = Array.from(root.querySelectorAll<HTMLElement>(sel));
        els.forEach((el) => {
          if (editableFlag) {
            // Prefer not to force contentEditable=true — let BlockNote manage
            // its own editable state. Remove any forced attributes we may have set.
            el.removeAttribute('contenteditable');
            el.removeAttribute('aria-readonly');
          } else {
            el.contentEditable = 'false';
            el.setAttribute('aria-readonly', 'true');
          }
          found = true;
        });
      });
      return found;
    } catch (e) {
      return false;
    }
  };

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
        // If the editor is currently focused and editable, avoid programmatic
        // replacements — this prevents cursor jumps while the user types.
        // We only apply incoming updates when the editor is not focused.
        if (editable && containerRef.current && document.activeElement && containerRef.current.contains(document.activeElement)) {
          return;
        }
        // If the parent already pushed this exact markdown, skip.
        if (initialMarkdown === lastPushedRef.current) return;
        if (initialMarkdown && typeof (editor as any).tryParseMarkdownToBlocks === "function") {
          // Suppress emitting onChange while we programmatically replace blocks to avoid
          // creating an update loop between parent -> prop -> replace -> parent
          suppressOnChangeRef.current = true;
          // Sanitize incoming markdown to strip stray bullet glyphs that may be
          // embedded in lines (these can produce duplicate visual markers).
          const sanitized = sanitizeMarkdownLeadingBullets(initialMarkdown);
          const blocks = await (editor as any).tryParseMarkdownToBlocks(sanitized);
          await (editor as any).replaceBlocks((editor as any).document, blocks);
          lastPushedRef.current = sanitized;
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
    ,
    // Expose a small helper so parent can detect if the editor currently has
    // keyboard focus. This helps avoid parent updates overwriting the user's
    // live typing/caret position during streaming updates.
    hasFocus: () => {
      try {
        return !!(containerRef.current && document.activeElement && containerRef.current.contains(document.activeElement));
      } catch (e) {
        return false;
      }
    }
  }), [editor, initialMarkdown]);

  // Auto-save draft to localStorage whenever content changes (debounced). We save
  // the markdown representation to keep it simple and portable across versions.
  useEffect(() => {
    if (!editor) return;
    // clear previous timer
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        const md = await (editor as any).blocksToMarkdownLossy(editor.document);
        const key = `openlog_draft_${window.location.pathname.split('/').pop() || 'default'}`;
        localStorage.setItem(key, md);
        setLastSavedAtLocal(Date.now());
      } catch (e) {
        // noop
      }
    }, 900) as unknown as number;

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [editor]);

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

    // Fallback: set contentEditable on the actual DOM content container inside this component.
    // BlockNote may render its internal DOM asynchronously, so retry a few times if the
    // content element isn't present yet.
    const selectors = [
      '.bn-editor__content',
      '.bn-view__content',
      '.bn-container',
      '.bn-root',
      '.blocknote-root',
      '.blocknote-editor'
    ];

    const trySetContentEditable = () => {
      try {
        const root = containerRef.current || document.body;
        if (!root) return false;

        let found = false;
        // set or clear contentEditable on any matching elements within root
        selectors.forEach((sel) => {
          const els = Array.from(root.querySelectorAll<HTMLElement>(sel));
          els.forEach((el) => {
            if (editable) {
              el.removeAttribute('contenteditable');
              el.removeAttribute('aria-readonly');
            } else {
              el.contentEditable = 'false';
              el.setAttribute('aria-readonly', 'true');
            }
            found = true;
          });
        });

        return found;
      } catch (e) {
        // ignore
      }
      return false;
    };

    // clear any previous retry
    if (domRetryRef.current.timer) {
      window.clearTimeout(domRetryRef.current.timer as number);
      domRetryRef.current.timer = null;
      domRetryRef.current.attempts = 0;
    }

    // Try once immediately, then schedule some repeated enforcement because BlockNote
    // may mount or rehydrate after our initial attempt when the page loads.
    trySetContentEditable();

    // Clear any previous interval
    if (enforceIntervalRef.current) {
      window.clearInterval(enforceIntervalRef.current as number);
      enforceIntervalRef.current = null;
    }

    // Run an enforcement interval for a short duration to catch late mountings.
    let runs = 0;
    enforceIntervalRef.current = window.setInterval(() => {
      runs += 1;
      setContentEditableAll(!!editable);
      if (runs > 12) {
        if (enforceIntervalRef.current) window.clearInterval(enforceIntervalRef.current as number);
        enforceIntervalRef.current = null;
      }
    }, 150) as unknown as number;
  }, [editor, editable]);

  // cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (domRetryRef.current.timer) window.clearTimeout(domRetryRef.current.timer as number);
      if (enforceIntervalRef.current) window.clearInterval(enforceIntervalRef.current as number);
    };
  }, []);

  // Stronger guard: intercept input events inside the editor container to block typing
  // in preview/read-only mode. Only attach these listeners when NOT editable so we
  // never interfere with the live editor's native key handling (Enter/newline,
  // IME input, etc.).
  useEffect(() => {
    if (editable) return; // attach only in preview/read-only
    const rootEl = containerRef.current;
    if (!rootEl) return;

    function onBeforeInput(e: InputEvent) {
      if (!editable) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onKeyDown(ev: KeyboardEvent) {
      if (editable) return;
      const allowed = [
        'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
        'Home','End','PageUp','PageDown','Shift','Control','Meta','Alt','Tab','Escape'
      ];
      // allow navigation and modifier keys
      if (allowed.includes(ev.key)) return;
      // prevent printable characters and editing keys except Enter (allow Enter for newline navigation in previews)
      const preventKeys = ['Backspace','Delete'];
      if (preventKeys.includes(ev.key) || ev.key.length === 1) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }

    function onPaste(e: ClipboardEvent) {
      if (!editable) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onDrop(e: DragEvent) {
      if (!editable) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    // Use capture so we can intercept before BlockNote handles them
    rootEl.addEventListener('beforeinput', onBeforeInput as EventListener, { capture: true });
    rootEl.addEventListener('keydown', onKeyDown as EventListener, { capture: true });
    rootEl.addEventListener('paste', onPaste as EventListener, { capture: true });
    rootEl.addEventListener('drop', onDrop as EventListener, { capture: true });

    return () => {
      rootEl.removeEventListener('beforeinput', onBeforeInput as EventListener, { capture: true } as any);
      rootEl.removeEventListener('keydown', onKeyDown as EventListener, { capture: true } as any);
      rootEl.removeEventListener('paste', onPaste as EventListener, { capture: true } as any);
      rootEl.removeEventListener('drop', onDrop as EventListener, { capture: true } as any);
    };
  }, [editable]);

  // Editor keyboard shortcuts (undo/redo/copy/paste). Attach a global handler
  // but only act when the editor element currently has focus. This avoids
  // fragile references to internals and fixes TypeScript "root is possibly
  // null" issues by using explicit null checks and window-level listeners.
  useEffect(() => {
    function handleShortcuts(ev: KeyboardEvent) {
      try {
        if (!editable) return;
        const root = containerRef.current;
        if (!root) return;

        // Only intercept when the editor/container currently contains focus
        if (!(document.activeElement && root.contains(document.activeElement))) return;

        const mod = ev.ctrlKey || ev.metaKey;
        if (!mod) return; // only handle modifier-key combos

        const key = String(ev.key || '').toLowerCase();

        // Let native paste (and other non-modifier keys like Enter) flow through.
        // We avoid intercepting plain paste here to ensure BlockNote's paste
        // handling and IME/newline behaviour remain intact.

        // Undo / Redo via BlockNote's API when available
        if (key === 'z' || key === 'y') {
          const be = editor as any;
          // Shift+Cmd/Ctrl+Z -> redo
          if (key === 'z' && ev.shiftKey) {
            if (be && typeof be.redo === 'function') {
              be.redo();
              ev.preventDefault();
              ev.stopPropagation();
              return;
            }
            // fallback
            document.execCommand('redo');
            ev.preventDefault();
            ev.stopPropagation();
            return;
          }
          if (key === 'z') {
            if (be && typeof be.undo === 'function') {
              be.undo();
              ev.preventDefault();
              ev.stopPropagation();
              return;
            }
            document.execCommand('undo');
            ev.preventDefault();
            ev.stopPropagation();
            return;
          }
          if (key === 'y') {
            if (be && typeof be.redo === 'function') {
              be.redo();
              ev.preventDefault();
              ev.stopPropagation();
              return;
            }
            document.execCommand('redo');
            ev.preventDefault();
            ev.stopPropagation();
            return;
          }
        }
      } catch (e) {
        // ignore and allow native behavior
      }
    }

    // Attach in bubble phase so the editor's internal listeners (which may use
    // capture) run first. This prevents us from accidentally blocking Enter/newline
    // which the editor handles natively.
    window.addEventListener('keydown', handleShortcuts, false);
    return () => window.removeEventListener('keydown', handleShortcuts, false);
  }, [editable, editor]);

  // We intentionally avoid intercepting paste events to preserve BlockNote's
  // native handling of rich content, IME input and Enter/newline behavior.

  // Global capture: some BlockNote builds render outside our container (portal).
  // Register window-level capture handlers to prevent input for any BlockNote root
  // on the page when this editor is in read-only mode.
  useEffect(() => {
    if (editable) return; // only attach global blockers when preview/read-only
    const globalSelectors = ['.blocknote-root', '.bn-container', '.bn-root', '.blocknote-editor'];

    function blockIfBlocknoteTarget(e: Event) {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      try {
        for (const sel of globalSelectors) {
          if (t.closest && t.closest(sel)) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('beforeinput', blockIfBlocknoteTarget as EventListener, true);
    window.addEventListener('keydown', blockIfBlocknoteTarget as EventListener, true);
    window.addEventListener('paste', blockIfBlocknoteTarget as EventListener, true);
    window.addEventListener('drop', blockIfBlocknoteTarget as EventListener, true);
    window.addEventListener('pointerdown', blockIfBlocknoteTarget as EventListener, true);
    window.addEventListener('click', blockIfBlocknoteTarget as EventListener, true);

    return () => {
      window.removeEventListener('beforeinput', blockIfBlocknoteTarget as EventListener, true);
      window.removeEventListener('keydown', blockIfBlocknoteTarget as EventListener, true);
      window.removeEventListener('paste', blockIfBlocknoteTarget as EventListener, true);
      window.removeEventListener('drop', blockIfBlocknoteTarget as EventListener, true);
      window.removeEventListener('pointerdown', blockIfBlocknoteTarget as EventListener, true);
      window.removeEventListener('click', blockIfBlocknoteTarget as EventListener, true);
    };
  }, [editable]);

  // Change handler: try to use BlockNote's onChange via BlockNoteView; fallback to polling
  useEffect(() => {
    if (!editor) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        if (suppressOnChangeRef.current) return;
        // If the editor has keyboard focus, avoid emitting onChange to the
        // parent while typing — this can trigger parent state updates that
        // re-render and cause caret jumps in the editor. Defer emitting until
        // the editor loses focus.
        try {
          if (editable && containerRef.current && document.activeElement && containerRef.current.contains(document.activeElement)) {
            return;
          }
        } catch (e) {
          // ignore
        }
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
    <div
      ref={containerRef}
      className={`h-full bg-[#0A0A0B] rounded-xl overflow-hidden border border-white/10 relative ${!editable ? 'opacity-90 bn-readonly' : ''}`}>
      {/* Scrollable inner region for editor content to show custom scrollbar when overflowing */}
      <div className="custom-scrollbar h-full overflow-y-auto">
        <BlockNoteView
          editor={editor}
          theme="dark"
          className="min-h-full py-4 pl-4 pr-2"
        />
      </div>

      {/* Capture interactions in preview mode with an overlay so BlockNote's
          floating UI (toolbars, block handles) can't be used. The overlay is
          transparent to preserve visuals but intercepts pointer events. */}
      {!editable && (
        <div
          aria-hidden
          className="absolute inset-0 z-20 pointer-events-auto"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        />
      )}
    </div>
  );
});

export default Editor;
