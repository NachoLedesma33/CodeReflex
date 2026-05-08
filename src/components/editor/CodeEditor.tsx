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
  onComplete?: (success: boolean) => void;
  showGhostText?: boolean;
  highlightErrors?: boolean;
  className?: string;
}

const LANGUAGE_MAP: Record<ProgrammingLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
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
  onComplete,
  showGhostText = true,
  highlightErrors = true,
  className,
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const checkCompletion = useCallback((code: string) => {
    if (isCompleted) return;

    const normalizedExpected = expectedCode.replace(/\s+/g, ' ').trim();
    const normalizedCode = code.replace(/\s+/g, ' ').trim();

    if (normalizedCode === normalizedExpected) {
      setIsCompleted(true);
      onComplete?.(true);
    }
  }, [expectedCode, isCompleted, onComplete]);

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

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom themes
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
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
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

    // Set theme
    editor.updateOptions({
      theme: theme === 'dark' ? 'codereflex-dark' : 'codereflex-light',
    });

    // Listen for changes
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange?.(value);
      checkCompletion(value);
    });
  }, [theme, onChange]);

  // ============================================
  // UPDATE DECORATIONS
  // ============================================

  const updateDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const decorations: Parameters<typeof monaco.editor.IModelDeltaDecoration>[] = [];
    
    // Error highlighting
    if (mode === 'write' && highlightErrors && currentCode) {
      const normalizedExpected = expectedCode.replace(/\s+/g, ' ');
      const normalizedCurrent = currentCode.replace(/\s+/g, ' ');

      for (let i = 0; i < normalizedCurrent.length && i < normalizedExpected.length; i++) {
        if (normalizedCurrent[i] !== normalizedExpected[i]) {
          const position = model.getPositionAt(i);
          decorations.push({
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column + 1
            ),
            options: {
              inlineClassName: 'bg-red-500/30',
            },
          });
        }
      }
    }

    // Ghost text
    if (mode === 'write' && showGhostText && !isCompleted && currentCode !== expectedCode) {
      const normalizedCurrent = currentCode.replace(/\s+/g, ' ');
      const nextChar = expectedCode[normalizedCurrent.length];
      
      if (nextChar) {
        const position = model.getPositionAt(normalizedCurrent.length);
        decorations.push({
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            inlineClassName: 'text-gray-500 opacity-50',
            content: nextChar,
          },
        });
      }
    }

    const oldDecorations = decorationsRef.current;
    decorationsRef.current = editor.deltaDecorations(oldDecorations, decorations);
  }, [expectedCode, currentCode, mode, showGhostText, highlightErrors, isCompleted]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    updateDecorations();
  }, [currentCode, expectedCode, updateDecorations]);

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
    <div className={cn('relative overflow-hidden rounded-lg border border-zinc-700', className)}>
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
        }}
      />
    </div>
  );
}

export default CodeEditor;