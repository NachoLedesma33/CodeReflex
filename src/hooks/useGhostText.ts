import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { BlankPosition, TypingStyle } from '@/types';

interface GhostTextState {
  ghostText: string;
  nextChar: string;
  autocompleteSuggestions: string[];
  currentBlankIndex: number;
  isInBlank: boolean;
  blankRanges: BlankPosition[];
  filledBlanks: Map<number, string>;
  selectedSuggestionIndex: number;
}

interface UseGhostTextOptions {
  codeSnippet: string;
  typingStyle: TypingStyle;
  blanks?: BlankPosition[];
  enabled?: boolean;
  cursorPosition: number;
  ignoreSpaces?: boolean;
  onAcceptSuggestion?: (suggestion: string) => void;
}

interface UseGhostTextReturn {
  ghostTextState: GhostTextState;
  getGhostText: () => string;
  acceptGhost: (suggestion?: string) => string;
  clearGhost: () => void;
  updateCursorPosition: (position: number) => void;
  fillBlank: (blankIndex: number, value: string) => void;
  selectSuggestion: (index: number) => void;
  acceptSelectedSuggestion: () => string | null;
  reset: () => void;
  getProgress: () => number;
  getRemainingText: () => string;
  getNextBlank: () => BlankPosition | null;
}

export function useGhostText({
  codeSnippet,
  typingStyle,
  blanks = [],
  enabled = true,
  cursorPosition,
  ignoreSpaces = false,
  onAcceptSuggestion,
}: UseGhostTextOptions): UseGhostTextReturn {
  const [filledBlanks, setFilledBlanks] = useState<Map<number, string>>(new Map());
  const [currentCursorPos, setCurrentCursorPos] = useState(cursorPosition);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);

  useEffect(() => {
    setCurrentCursorPos(cursorPosition);
  }, [cursorPosition]);

  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [currentCursorPos]);

  const updateCursorPosition = useCallback((position: number) => {
    setCurrentCursorPos(position);
    setSelectedSuggestionIndex(-1);
    setActiveSuggestion(null);
  }, []);

  const blankRanges = useMemo(() => blanks, [blanks]);

  const currentBlankIndex = useMemo(() => {
    if (typingStyle !== 'fill-blanks' || blankRanges.length === 0) {
      return -1;
    }
    for (let i = 0; i < blankRanges.length; i++) {
      const blank = blankRanges[i];
      if (currentCursorPos >= blank.start && currentCursorPos <= blank.end) {
        return i;
      }
    }
    return -1;
  }, [currentCursorPos, blankRanges, typingStyle]);

  const isInBlank = useMemo(() => currentBlankIndex >= 0, [currentBlankIndex]);

  const currentBlank = useMemo(() => {
    if (currentBlankIndex >= 0 && currentBlankIndex < blankRanges.length) {
      return blankRanges[currentBlankIndex];
    }
    return null;
  }, [currentBlankIndex, blankRanges]);

  const getNextBlank = useCallback((): BlankPosition | null => {
    const nextBlanks = blankRanges.filter(b => b.start > currentCursorPos);
    return nextBlanks.length > 0 ? nextBlanks[0] : null;
  }, [blankRanges, currentCursorPos]);

  const calculateGhostText = useCallback((): string => {
    if (!enabled || !codeSnippet) return '';

    let remainingText = '';

    if (typingStyle === 'full') {
      remainingText = codeSnippet.slice(currentCursorPos);
    } else if (typingStyle === 'fill-blanks') {
      const nextBlank = getNextBlank();
      if (nextBlank) {
        remainingText = codeSnippet.slice(currentCursorPos, nextBlank.start);
      } else {
        remainingText = codeSnippet.slice(currentCursorPos);
      }
    } else if (typingStyle === 'complete-function') {
      const functionMatch = codeSnippet.match(/function\s+\w+\s*\([^)]*\)\s*\{/);
      if (functionMatch && currentCursorPos >= functionMatch.index! + functionMatch[0].length) {
        remainingText = codeSnippet.slice(currentCursorPos);
      }
    }

    if (ignoreSpaces) {
      remainingText = remainingText.replace(/\s+/g, '');
    }

    return remainingText;
  }, [enabled, codeSnippet, currentCursorPos, typingStyle, getNextBlank, ignoreSpaces]);

  const autocompleteSuggestions = useMemo(() => {
    if (!enabled || !codeSnippet) return [];
    return generateSuggestions(codeSnippet, currentCursorPos, typingStyle, filledBlanks);
  }, [enabled, codeSnippet, currentCursorPos, typingStyle, filledBlanks]);

  const ghostTextState = useMemo<GhostTextState>(() => {
    const ghostText = calculateGhostText();
    const nextChar = ghostText.charAt(0) || '';

    return {
      ghostText,
      nextChar,
      autocompleteSuggestions,
      currentBlankIndex,
      isInBlank,
      blankRanges,
      filledBlanks,
      selectedSuggestionIndex,
    };
  }, [calculateGhostText, autocompleteSuggestions, currentBlankIndex, isInBlank, blankRanges, filledBlanks, selectedSuggestionIndex]);

  const getGhostText = useCallback((): string => {
    return ghostTextState.ghostText;
  }, [ghostTextState.ghostText]);

  const acceptGhost = useCallback((suggestion?: string): string => {
    const textToAccept = suggestion || activeSuggestion || ghostTextState.ghostText.split('\n')[0];
    onAcceptSuggestion?.(textToAccept);
    return textToAccept;
  }, [activeSuggestion, ghostTextState.ghostText, onAcceptSuggestion]);

  const clearGhost = useCallback(() => {
    setActiveSuggestion(null);
    setSelectedSuggestionIndex(-1);
  }, []);

  const selectSuggestion = useCallback((index: number) => {
    if (index >= 0 && index < autocompleteSuggestions.length) {
      setSelectedSuggestionIndex(index);
      setActiveSuggestion(autocompleteSuggestions[index]);
    }
  }, [autocompleteSuggestions]);

  const acceptSelectedSuggestion = useCallback((): string | null => {
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < autocompleteSuggestions.length) {
      const suggestion = autocompleteSuggestions[selectedSuggestionIndex];
      onAcceptSuggestion?.(suggestion);
      return suggestion;
    }
    return null;
  }, [selectedSuggestionIndex, autocompleteSuggestions, onAcceptSuggestion]);

  const fillBlank = useCallback((blankIndex: number, value: string) => {
    if (blankIndex >= 0 && blankIndex < blankRanges.length) {
      setFilledBlanks(prev => {
        const next = new Map(prev);
        next.set(blankIndex, value);
        return next;
      });
    }
  }, [blankRanges]);

  const reset = useCallback(() => {
    setFilledBlanks(new Map());
    setCurrentCursorPos(0);
    setSelectedSuggestionIndex(-1);
    setActiveSuggestion(null);
  }, []);

  const getProgress = useCallback(() => {
    if (!codeSnippet) return 0;
    const totalChars = codeSnippet.length;
    const typedChars = currentCursorPos;
    return Math.round((typedChars / totalChars) * 100);
  }, [codeSnippet, currentCursorPos]);

  const getRemainingText = useCallback((): string => {
    if (!codeSnippet) return '';
    return codeSnippet.slice(currentCursorPos);
  }, [codeSnippet, currentCursorPos]);

  return {
    ghostTextState,
    getGhostText,
    acceptGhost,
    clearGhost,
    updateCursorPosition,
    fillBlank,
    selectSuggestion,
    acceptSelectedSuggestion,
    reset,
    getProgress,
    getRemainingText,
    getNextBlank,
  };
}

function generateSuggestions(
  code: string,
  cursorPosition: number,
  typingStyle: TypingStyle,
  filledBlanks: Map<number, string>
): string[] {
  const suggestions: string[] = [];
  const beforeCursor = code.slice(0, cursorPosition);
  const afterCursor = code.slice(cursorPosition);

  const keywords: Record<string, string[]> = {
    javascript: [
      'function', 'const', 'let', 'var', 'if', 'else', 'return', 'for', 'while',
      'class', 'async', 'await', 'import', 'export', 'default', 'try', 'catch',
      'console.log', 'map(', 'filter(', 'reduce(', 'Promise',
    ],
    typescript: [
      'function', 'const', 'let', 'var', 'if', 'else', 'return', 'for', 'while',
      'class', 'async', 'await', 'import', 'export', 'default', 'try', 'catch',
      'interface', 'type', 'enum', 'namespace', 'readonly', 'public', 'private',
      'console.log', 'map(', 'filter(', 'reduce(', 'Promise', ': string', ': number',
    ],
    python: [
      'def', 'class', 'if', 'elif', 'else', 'return', 'for', 'while', 'try',
      'except', 'finally', 'import', 'from', 'as', 'with', 'lambda', 'yield',
      'print(', 'len(', 'range(', 'enumerate(', 'zip(',
    ],
  };

  if (typingStyle === 'fill-blanks') {
    const blankMatch = afterCursor.match(/\{\{(\w*)\}\}/);
    if (blankMatch) {
      const partial = blankMatch[1];
      const possibleValues = ['value', 'item', 'index', 'result', 'data', 'key'];
      possibleValues.forEach(v => {
        if (v.startsWith(partial)) {
          suggestions.push(v);
        }
      });
    }
  }

  const lastWordMatch = beforeCursor.match(/(\w+)$/);
  if (lastWordMatch) {
    const lastWord = lastWordMatch[1].toLowerCase();
    const lang = detectLanguage(code);
    const langKeywords = keywords[lang] || keywords.javascript;

    langKeywords.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(lastWord)) {
        if (!suggestions.includes(keyword)) {
          suggestions.push(keyword);
        }
      }
    });
  }

  if (afterCursor.startsWith('{') && !suggestions.includes('{}')) {
    suggestions.unshift('{}');
  }
  if (afterCursor.startsWith('[') && !suggestions.includes('[]')) {
    suggestions.unshift('[]');
  }
  if (afterCursor.startsWith('(') && !suggestions.includes('()')) {
    suggestions.unshift('()');
  }

  return suggestions.slice(0, 5);
}

function detectLanguage(code: string): string {
  if (code.includes(': ') && (code.includes('interface ') || code.includes('type '))) {
    return 'typescript';
  }
  if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
    return 'python';
  }
  return 'javascript';
}

export type { GhostTextState, UseGhostTextOptions, UseGhostTextReturn };