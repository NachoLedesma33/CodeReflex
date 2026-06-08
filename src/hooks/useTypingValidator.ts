import { useState, useCallback, useMemo, useEffect, useRef, useTransition } from 'react';
import { BlankPosition } from '@/types';

interface ValidationResult {
  isValid: boolean;
  errors: Map<number, string>;
  errorCount: number;
}

interface TypingMetrics {
  wpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  corrections: number;
  elapsedTime: number;
  charactersTyped: number;
  charactersRemaining: number;
}

interface TypingEvent {
  type: 'correct' | 'error' | 'correction' | 'complete';
  position: number;
  expected?: string;
  actual?: string;
  timestamp: number;
}

interface UseTypingValidatorOptions {
  expectedCode: string;
  blanks?: BlankPosition[];
  enabled?: boolean;
  debounceMs?: number;
  throttleMs?: number;
  onError?: (position: number, expected: string, actual: string) => void;
  onCorrect?: (position: number, character: string) => void;
  onCorrection?: (position: number) => void;
  onComplete?: (metrics: TypingMetrics) => void;
  onProgress?: (progress: number, metrics: TypingMetrics) => void;
  syncWithStore?: boolean;
  exerciseId?: string;
}

interface UseTypingValidatorReturn {
  typedText: string;
  validationResult: ValidationResult;
  metrics: TypingMetrics;
  isComplete: boolean;
  currentPosition: number;
  handleKeyPress: (key: string, currentText: string, position: number) => void;
  handlePaste: (text: string) => boolean;
  reset: () => void;
  syncText: (text: string) => void;
  getErrorPositions: () => number[];
  getCorrectPositions: () => number[];
  forceValidation: () => void;
  setTypedText: (text: string) => void;
}

const createOptimizedValidator = (
  expectedCode: string,
  blanks: BlankPosition[]
): { validate: (typed: string) => ValidationResult } => {
  const expectedChars = expectedCode.split('');
  const blankMap = new Map<number, BlankPosition>();
  
  blanks.forEach(blank => {
    for (let i = blank.start; i < blank.end; i++) {
      blankMap.set(i, blank);
    }
  });

  const validate = (typed: string): ValidationResult => {
    const errorMap = new Map<number, string>();
    const len = Math.min(typed.length, expectedChars.length);

    for (let i = 0; i < len; i++) {
      const expected = expectedChars[i];
      const actual = typed[i];
      
      if (actual !== expected) {
        const blank = blankMap.get(i);
        if (blank) {
          const blankValue = typed.slice(blank.start, Math.min(blank.end, typed.length));
          if (blankValue !== blank.expectedValue) {
            errorMap.set(i, `Expected: "${blank.expectedValue}", got: "${blankValue}"`);
          }
        } else {
          errorMap.set(i, `Expected: "${expected}", got: "${actual}"`);
        }
      }
    }

    return {
      isValid: errorMap.size === 0 && typed.length >= expectedChars.length,
      errors: errorMap,
      errorCount: errorMap.size,
    };
  };

  return { validate };
};

export function useTypingValidator({
  expectedCode,
  blanks = [],
  enabled = true,
  debounceMs = 150,
  throttleMs = 50,
  onError,
  onCorrect,
  onCorrection,
  onComplete,
  onProgress,
}: UseTypingValidatorOptions): UseTypingValidatorReturn {
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [corrections, setCorrections] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);

  const isCompleteRef = useRef(false);
  const lastEventTimeRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const normalizedExpectedCode = useMemo(() => {
    return expectedCode.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
  }, [expectedCode]);

  const validatorRef = useRef(createOptimizedValidator(normalizedExpectedCode, blanks));

  useEffect(() => {
    validatorRef.current = createOptimizedValidator(normalizedExpectedCode, blanks);
  }, [normalizedExpectedCode, blanks]);

  const [isPending, startTransition] = useTransition();

  const [liveElapsedTime, setLiveElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (enabled && startTime && !isCompleteRef.current) {
      timerRef.current = setInterval(() => {
        setLiveElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, startTime]);

  const validationResult = useMemo<ValidationResult>(() => {
    const v = createOptimizedValidator(normalizedExpectedCode, blanks);
    return v.validate(typedText);
  }, [typedText, normalizedExpectedCode, blanks]);

  const metrics = useMemo<TypingMetrics>(() => {
    const elapsedTime = liveElapsedTime;
    const elapsedMinutes = elapsedTime / 60000;
    const words = typedText.length / 5;
    const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
    
    // Accuracy based on total keystrokes and total errors
    // If totalErrors > totalKeystrokes (rare but possible with backspaces), clamp it
    const accuracy = totalKeystrokes > 0 
      ? Math.max(0, Math.round(((totalKeystrokes - totalErrors) / totalKeystrokes) * 100)) 
      : 100;

    return {
      wpm,
      accuracy: Math.min(100, accuracy),
      totalKeystrokes,
      correctKeystrokes,
      errors: totalErrors, // Persistent error count
      corrections,
      elapsedTime,
      charactersTyped: typedText.length,
      charactersRemaining: Math.max(0, normalizedExpectedCode.length - typedText.length),
    };
  }, [typedText, liveElapsedTime, totalKeystrokes, correctKeystrokes, totalErrors, corrections, normalizedExpectedCode.length]);

  const isComplete = useMemo(() => {
    return typedText.length >= normalizedExpectedCode.length && validationResult.isValid;
  }, [typedText, normalizedExpectedCode.length, validationResult.isValid]);

  useEffect(() => {
    if (isComplete && !isCompleteRef.current) {
      isCompleteRef.current = true;
      onComplete?.(metrics);
    }
  }, [isComplete, metrics, onComplete]);

  useEffect(() => {
    if (onProgress && !isPending) {
      const progress = Math.round((typedText.length / expectedCode.length) * 100);
      onProgress(progress, metrics);
    }
  }, [typedText, expectedCode.length, metrics, onProgress, isPending]);

  const emitEvent = useCallback((
    type: TypingEvent['type'],
    position: number,
    expected?: string,
    actual?: string
  ) => {
    const now = Date.now();
    if (now - lastEventTimeRef.current < throttleMs) {
      return;
    }
    lastEventTimeRef.current = now;

    if (type === 'error' && onError) {
      onError(position, expected || '', actual || '');
    } else if (type === 'correct' && onCorrect) {
      onCorrect(position, expected || '');
    } else if (type === 'correction' && onCorrection) {
      onCorrection(position);
    }
  }, [throttleMs, onError, onCorrect, onCorrection]);

  const debouncedValidation = useCallback((text: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const result = validatorRef.current.validate(text);
      startTransition(() => {
        setErrors(result.errors);
      });
    }, debounceMs);
  }, [debounceMs]);

  const handleKeyPress = useCallback((key: string, currentText: string, position: number) => {
    if (!enabled) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    setCurrentPosition(position);

    if (key === 'Backspace') {
      setCorrections(prev => prev + 1);
      emitEvent('correction', position);
      const newText = currentText.slice(0, -1);
      setTypedText(newText);
      debouncedValidation(newText);
      setCurrentPosition(newText.length);
      return;
    }

    if (key.length !== 1) return;

    setTotalKeystrokes(prev => prev + 1);

    const expectedChar = expectedCode.charAt(position);
    if (key === expectedChar) {
      setCorrectKeystrokes(prev => prev + 1);
      const newText = currentText + key;
      setTypedText(newText);
      emitEvent('correct', position, expectedChar);
      debouncedValidation(newText);
      setCurrentPosition(newText.length);
    } else {
      const newErrors = new Map(errors);
      newErrors.set(position, `Expected "${expectedChar}"`);
      setErrors(newErrors);
      emitEvent('error', position, expectedChar, key);
    }
  }, [enabled, startTime, expectedCode, errors, emitEvent, debouncedValidation]);

  const handlePaste = useCallback((text: string): boolean => {
    if (!enabled) return false;

    if (!startTime) {
      setStartTime(Date.now());
    }

    let errorCount = 0;
    const newErrors = new Map(errors);

    for (let i = 0; i < text.length; i++) {
      const expectedChar = expectedCode.charAt(typedText.length + i);
      if (text.charAt(i) !== expectedChar) {
        errorCount++;
        newErrors.set(typedText.length + i, `Paste error: expected "${expectedChar}"`);
      }
    }

    if (errorCount === 0) {
      setTypedText(prev => prev + text);
      setTotalKeystrokes(prev => prev + text.length);
      setCorrectKeystrokes(prev => prev + text.length);
      emitEvent('correct', typedText.length, text);
    } else {
      setErrors(newErrors);
      setTotalKeystrokes(prev => prev + text.length);
      emitEvent('error', typedText.length, '', text);
    }

    debouncedValidation(typedText + text);
    return errorCount === 0;
  }, [enabled, startTime, expectedCode, typedText, errors, emitEvent, debouncedValidation]);

  const syncText = useCallback((newText: string) => {
    const normalizedNewText = newText.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
    
    setStartTime(prev => {
      if (!prev && normalizedNewText.length > 0) return Date.now();
      return prev;
    });

    setTypedText(prev => {
      if (normalizedNewText === prev) return prev;

      // Calculate keystrokes and corrections based on the difference
      if (normalizedNewText.length > prev.length) {
        const diff = normalizedNewText.length - prev.length;
        setTotalKeystrokes(k => k + diff);
        
        // Check if the added characters are correct
        let addedCorrect = 0;
        let addedErrors = 0;
        for (let i = prev.length; i < normalizedNewText.length; i++) {
          if (normalizedNewText[i] === normalizedExpectedCode[i]) {
            addedCorrect++;
          } else {
            addedErrors++;
          }
        }
        setCorrectKeystrokes(k => k + addedCorrect);
        if (addedErrors > 0) {
          setTotalErrors(e => e + addedErrors);
        }
      } else if (normalizedNewText.length < prev.length) {
        setCorrections(c => c + (prev.length - normalizedNewText.length));
      }

      return normalizedNewText;
    });

    setCurrentPosition(normalizedNewText.length);
    debouncedValidation(normalizedNewText);
  }, [normalizedExpectedCode, debouncedValidation]);

  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setTypedText('');
    setErrors(new Map());
    setStartTime(null);
    setLiveElapsedTime(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setCorrections(0);
    setTotalErrors(0);
    setCurrentPosition(0);
    isCompleteRef.current = false;
  }, []);

  const forceValidation = useCallback(() => {
    const result = validatorRef.current.validate(typedText);
    setErrors(result.errors);
  }, [typedText]);

  const getErrorPositions = useCallback((): number[] => {
    const errorPos: number[] = [];
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] !== normalizedExpectedCode[i]) {
        errorPos.push(i);
      }
    }
    return errorPos;
  }, [typedText, normalizedExpectedCode]);

  const getCorrectPositions = useCallback((): number[] => {
    const correct: number[] = [];
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === normalizedExpectedCode[i]) {
        correct.push(i);
      }
    }
    return correct;
  }, [typedText, normalizedExpectedCode]);

  return {
    typedText,
    validationResult,
    metrics,
    isComplete,
    currentPosition,
    handleKeyPress,
    handlePaste,
    syncText,
    reset,
    getErrorPositions,
    getCorrectPositions,
    forceValidation,
    setTypedText,
  };
}

export type { ValidationResult, TypingMetrics, TypingEvent, UseTypingValidatorOptions, UseTypingValidatorReturn };