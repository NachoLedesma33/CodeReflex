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
  onComplete,
  showGhostText = true,
  highlightErrors = true,
  correctPositions = [],
  errorPositions = [],
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
      }
    }
  }, [expectedCode, mode, currentCode]);

  // ============================================
  // UPDATE DECORATIONS - for typing feedback
  // ============================================

  const updateDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const decorations: Parameters<typeof monaco.editor.IModelDeltaDecoration>[] = [];
    
    if (mode !== 'write') return;

    const normalizedExpected = expectedCode.replace(/\s+/g, ' ').trim();
    const normalizedCurrent = currentCode.replace(/\s+/g, ' ').trim();

    // Use passed positions or calculate internally
    const errorSet = new Set(errorPositions);
    const correctSet = new Set(correctPositions);

    // Highlight correct characters in green
    for (let i = 0; i < normalizedCurrent.length; i++) {
      const isCorrect = correctPositions.length > 0 
        ? correctSet.has(i) 
        : (i < normalizedExpected.length && normalizedCurrent[i] === normalizedExpected[i]);
      
      if (isCorrect) {
        const position = model.getPositionAt(i);
        decorations.push({
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column + 1
          ),
          options: {
            inlineClassName: 'correct-char',
          },
        });
      }
    }

    // Highlight errors in red
    if (highlightErrors) {
      for (let i = 0; i < normalizedCurrent.length && i < normalizedExpected.length; i++) {
        const isError = errorPositions.length > 0 
          ? errorSet.has(i) 
          : (normalizedCurrent[i] !== normalizedExpected[i]);
        
        if (isError) {
          const position = model.getPositionAt(i);
          decorations.push({
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column + 1
            ),
            options: {
              inlineClassName: 'error-char',
            },
          });
        }
      }
    }

    // Ghost text for remaining characters - show as inline text after cursor
    if (showGhostText && !isCompleted && normalizedCurrent.length < normalizedExpected.length) {
      const remaining = normalizedExpected.slice(normalizedCurrent.length);
      
      // Show ghost text character by character after current position
      let charIndex = 0;
      let pos = normalizedCurrent.length;
      
      while (charIndex < remaining.length && charIndex < 50) {
        const position = model.getPositionAt(pos);
        if (!position) break;
        
        decorations.push({
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column + 1
          ),
          options: {
            inlineClassName: 'ghost-char',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
        
        pos++;
        charIndex++;
      }
    }

    const oldDecorations = decorationsRef.current;
    decorationsRef.current = editor.deltaDecorations(oldDecorations, decorations);
  }, [expectedCode, currentCode, mode, showGhostText, highlightErrors, isCompleted, correctPositions, errorPositions]);

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

  // Generate ghost text HTML - characters already typed are transparent, remaining are gray
  return (
    <div 
      className={cn('relative flex flex-col rounded-lg border border-zinc-700 bg-transparent', className)}
      style={{ direction: 'ltr' }}
    >
      {/* Ghost text reference - shown above editor */}
      {mode === 'write' && showGhostText && (
        <div 
          className="flex-shrink-0 px-4 py-3 bg-zinc-800/50 border-b border-zinc-700 overflow-x-auto"
        >
          <div 
            className="whitespace-nowrap text-sm"
            style={{
              fontFamily: getFontFamily(),
              fontSize: `${editorFontSize}px`,
              lineHeight: 1.6,
              direction: 'ltr',
              unicodeBidi: 'plaintext',
            }}
          >
            {(() => {
              const normalizedCurrent = currentCode.replace(/\s+/g, ' ').trim();
              const normalizedExpected = expectedCode.replace(/\s+/g, ' ').trim();
              
              const typed = normalizedExpected.slice(0, normalizedCurrent.length);
              const remaining = normalizedExpected.slice(normalizedCurrent.length);
              
              return (
                <>
                  <span className="text-transparent">{typed}</span>
                  <span className="text-zinc-500 opacity-60">{remaining}</span>
                </>
              );
            })()}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
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
    </div>
  );
}

export default CodeEditor;