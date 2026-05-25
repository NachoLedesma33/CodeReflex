'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useUIStore } from '@/stores/uiStore';
import { useProgressStore } from '@/stores/progressStore';
import { BlankPosition, TypingStyle, ProgrammingLanguage } from '@/types';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  expectedCode: string;
  currentCode: string;
  language: ProgrammingLanguage;
  typingStyle?: TypingStyle;
  blanks?: BlankPosition[];
  mode?: 'read' | 'write';
  onChange?: (code: string) => void;
  showGhostText?: boolean;
  highlightErrors?: boolean;
  correctPositions?: number[];
  errorPositions?: number[];
  className?: string;
}

const LANGUAGE_MAP: Record<ProgrammingLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
};

const FONT_FAMILY_MAP: Record<string, string> = {
  monaco: 'Menlo, Monaco, "Courier New", monospace',
  'fira-code': '"Fira Code", "Fira Code Mono", monospace',
  'jetbrains-mono': '"JetBrains Mono", "JetBrains Mono Medium", monospace',
};

export function CodeEditor({
  expectedCode,
  currentCode,
  language,
  typingStyle = 'full',
  blanks,
  mode = 'write',
  onChange,
  showGhostText = true,
  highlightErrors = true,
  correctPositions = [],
  errorPositions = [],
  className,
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);



  // Store integrations
  const { 
    theme, 
    editorFontFamily, 
    editorFontSize, 
    showLineNumbers, 
    wordWrap,
    highlightActiveLine,
    bracketPairColorization,
  } = useUIStore();

  // ============================================
  // EDITOR MOUNT
  // ============================================

  const normalizedExpectedRef = useRef('');

  useEffect(() => {
    normalizedExpectedRef.current = expectedCode.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
  }, [expectedCode]);

  const updateDecorations = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    
    const model = editor.getModel();
    if (!model) return;

    if (modeRef.current !== 'write') return;

    const decorations: import('monaco-editor').editor.IModelDeltaDecoration[] = [];

    for (const idx of correctPositions) {
      const startPos = model.getPositionAt(idx);
      const endPos = model.getPositionAt(idx + 1);
      if (!startPos || !endPos) continue;
      decorations.push({
        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: {
          inlineClassName: 'correct-char',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        },
      });
    }

    if (highlightErrors) {
      for (const idx of errorPositions) {
        const startPos = model.getPositionAt(idx);
        const endPos = model.getPositionAt(idx + 1);
        if (!startPos || !endPos) continue;
        decorations.push({
          range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
          options: {
            inlineClassName: 'error-char',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          },
        });
      }
    }

    const oldDecorations = decorationsRef.current;
    decorationsRef.current = editor.deltaDecorations(oldDecorations, decorations);
  }, [correctPositions, errorPositions, highlightErrors]);

  // ============================================
  // EDITOR MOUNT
  // ============================================

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // ... (themes)
    monaco.editor.defineTheme('codereflex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'function', foreground: 'd2a8ff' },
      ],
      colors: {
        'editor.background': '#00000000',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b2233',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#58a6ff',
        'editorLineNumber.foreground': '#8b949e',
      },
    });

    monaco.editor.defineTheme('codereflex-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d' },
        { token: 'keyword', foreground: 'd73a49' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' },
        { token: 'function', foreground: '6f42c1' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editorCursor.foreground': '#0366d6',
      },
    });

    // Force LF line endings for consistent indexing
    const model = editor.getModel();
    if (model) {
      model.setEOL(monaco.editor.EndOfLineSequence.LF);
    }

    editor.updateOptions({
      theme: theme === 'dark' ? 'codereflex-dark' : 'codereflex-light',
    });

    // Listen for changes
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange?.(value);
      requestAnimationFrame(() => {
        updateDecorations();
      });
    });

    // Prevent paste in write mode (Keyboard - most robust)
    editor.onKeyDown((e) => {
      if (modeRef.current === 'write' && (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Handle any paste that gets through (e.g. right click)
    editor.onDidPaste(() => {
      if (modeRef.current === 'write') {
        editor.trigger('keyboard', 'undo', null);
      }
    });

    // Prevent paste in write mode (DOM/Context Menu)
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      const handlePaste = (e: ClipboardEvent) => {
        if (modeRef.current === 'write') {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      editorDomNode.addEventListener('paste', handlePaste as any, true);
    }
  }, [theme, onChange, updateDecorations]);

  // Handle content - read mode shows expected, write mode shows current + ghost
  useEffect(() => {
    if (!editorRef.current) return;
    
    if (mode === 'read') {
      editorRef.current.setValue(expectedCode);
      editorRef.current.updateOptions({ readOnly: true });
    } else if (mode === 'write') {
      editorRef.current.updateOptions({ readOnly: false });
      // Only update if value actually changed to preserve cursor position
      const currentValue = editorRef.current.getValue();
      if (currentValue !== currentCode) {
        editorRef.current.setValue(currentCode || '');
        updateDecorations();
      }
    }
  }, [expectedCode, mode, currentCode, updateDecorations]);

  useEffect(() => {
    updateDecorations();
  }, [updateDecorations]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: theme === 'dark' ? 'codereflex-dark' : 'codereflex-light',
      });
    }
  }, [theme]);

  // ============================================
  // RENDER
  // ============================================

  const getMonacoLanguage = () => LANGUAGE_MAP[language] || 'javascript';
  const getFontFamily = () => FONT_FAMILY_MAP[editorFontFamily] || FONT_FAMILY_MAP.monaco;

  return (
    <div 
      className={cn('relative flex flex-col rounded-lg border border-zinc-700 bg-transparent overflow-hidden', className)}
      style={{ direction: 'ltr' }}
    >
      {/* Editor with reference always on the right */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={mode === 'write' && showGhostText ? 'flex-[1_1_60%] min-w-0' : 'w-full'}>
          <Editor
          height="100%"
          language={getMonacoLanguage()}
          value={currentCode}
          onMount={handleEditorMount}
          theme={theme === 'dark' ? 'codereflex-dark' : 'codereflex-light'}
          options={{
            readOnly: mode === 'read',
            fontFamily: getFontFamily(),
            fontSize: editorFontSize,
            lineHeight: 1.6,
            lineNumbers: showLineNumbers ? 'on' : 'off',
            wordWrap: wordWrap ? 'on' : 'off',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderLineHighlight: highlightActiveLine ? 'line' : 'none',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            padding: { top: 16, bottom: 16 },
            folding: false,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 3,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off',
            parameterHints: { enabled: false },
            suggest: { showWords: false },
            autoClosingBrackets: 'never',
            autoClosingQuotes: 'never',
            autoSurround: 'never',
            formatOnPaste: false,
            formatOnType: false,
            autoIndent: 'none',
            bracketPairColorization: { enabled: false },
            guides: { bracketPairs: false },
          }}
        />
        </div>
        {mode === 'write' && showGhostText && (
          <div className="flex-[0_0_40%] border-l border-zinc-700 bg-zinc-900/80 flex flex-col">
            <div className="text-xs text-zinc-500 px-3 py-2 border-b border-zinc-700">Reference</div>
            <div className="flex-1 overflow-auto p-3">
              <pre 
                className="text-xs font-mono whitespace-pre"
                style={{ fontFamily: getFontFamily() }}
              >
                {expectedCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;