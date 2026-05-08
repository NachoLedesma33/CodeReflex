import { BlankPosition, TypingStyle } from '@/types';

export interface DiffResult {
  position: number;
  expected: string;
  actual: string;
  errorType: 'missing' | 'extra' | 'mismatch' | 'whitespace' | 'case';
}

export interface ComparisonResult {
  isCorrect: boolean;
  diffs: DiffResult[];
  accuracy: number;
  totalCharacters: number;
  correctCharacters: number;
  missingCount: number;
  extraCount: number;
  mismatchCount: number;
}

export interface WPMResult {
  wpm: number;
  totalCharacters: number;
  timeInSeconds: number;
  timeInMinutes: number;
  words: number;
}

export interface AccuracyResult {
  accuracy: number;
  totalTyped: number;
  errors: number;
  errorRate: number;
}

// ============================================
// CONFIGURATION
// ============================================

interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignorePunctuation: boolean;
  normalizeQuotes: boolean;
}

const defaultOptions: DiffOptions = {
  ignoreWhitespace: true,
  ignoreCase: false,
  ignorePunctuation: false,
  normalizeQuotes: true,
};

// ============================================
// NORMALIZATION
// ============================================

const normalizeString = (str: string, options: DiffOptions): string => {
  let result = str;
  
  if (options.ignoreWhitespace) {
    result = result.replace(/[\t ]+/g, ' ');
    result = result.replace(/\n+/g, '\n');
    result = result.trim();
  }
  
  if (options.normalizeQuotes) {
    result = result.replace(/[""„]/g, '"');
    result = result.replace(/['']/g, "'");
  }
  
  if (options.ignoreCase) {
    result = result.toLowerCase();
  }
  
  return result;
};

// ============================================
// BASIC STRING COMPARISON
// ============================================

export const compareStrings = (
  expected: string,
  actual: string,
  options: DiffOptions = defaultOptions
): ComparisonResult => {
  const normalizedExpected = normalizeString(expected, options);
  const normalizedActual = normalizeString(actual, options);

  const diffs: DiffResult[] = [];
  const maxLength = Math.max(normalizedExpected.length, normalizedActual.length);
  
  let correctCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  let mismatchCount = 0;

  for (let i = 0; i < maxLength; i++) {
    const expectedChar = normalizedExpected[i] || '';
    const actualChar = normalizedActual[i] || '';

    if (expectedChar === actualChar) {
      correctCount++;
    } else {
      let errorType: DiffResult['errorType'] = 'mismatch';
      
      if (!expectedChar && actualChar) {
        errorType = 'extra';
        extraCount++;
      } else if (expectedChar && !actualChar) {
        errorType = 'missing';
        missingCount++;
      } else if (expectedChar === ' ' || actualChar === ' ' || expectedChar === '\n' || actualChar === '\n') {
        errorType = 'whitespace';
      } else if (options.ignoreCase && expectedChar.toLowerCase() === actualChar.toLowerCase()) {
        errorType = 'case';
      } else {
        mismatchCount++;
      }

      diffs.push({
        position: i,
        expected: expectedChar,
        actual: actualChar,
        errorType,
      });
    }
  }

  const accuracy = maxLength > 0 
    ? Math.round((correctCount / maxLength) * 10000) / 100 
    : 100;

  return {
    isCorrect: diffs.length === 0,
    diffs,
    accuracy,
    totalCharacters: maxLength,
    correctCharacters: correctCount,
    missingCount,
    extraCount,
    mismatchCount,
  };
};

// ============================================
// FILL BLANKS MODE
// ============================================

export const compareWithBlanks = (
  codeSnippet: string,
  blanks: BlankPosition[],
  userInput: string,
  options: DiffOptions = defaultOptions
): ComparisonResult => {
  const normalizedSnippet = normalizeString(codeSnippet, options);
  const normalizedInput = normalizeString(userInput, options);

  const diffs: DiffResult[] = [];
  const sortedBlanks = [...blanks].sort((a, b) => a.start - b.start);

  let correctCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  let mismatchCount = 0;

  let userInputIndex = 0;

  for (let i = 0; i < normalizedSnippet.length; i++) {
    const isInBlank = sortedBlanks.some(b => i >= b.start && i < b.end);
    
    if (isInBlank) {
      // Inside a blank - user should fill this
      if (userInputIndex < normalizedInput.length) {
        const expectedChar = normalizedSnippet[i];
        const actualChar = normalizedInput[userInputIndex];
        
        if (expectedChar === actualChar) {
          correctCount++;
        } else {
          mismatchCount++;
          diffs.push({
            position: i,
            expected: expectedChar,
            actual: actualChar,
            errorType: 'mismatch',
          });
        }
        userInputIndex++;
      } else {
        missingCount++;
        diffs.push({
          position: i,
          expected: normalizedSnippet[i],
          actual: '',
          errorType: 'missing',
        });
      }
    } else {
      // Outside blank - should match exactly
      const expectedChar = normalizedSnippet[i];
      const actualChar = normalizedInput[userInputIndex];
      
      if (expectedChar === actualChar) {
        correctCount++;
        if (userInputIndex < normalizedInput.length) {
          userInputIndex++;
        }
      } else if (actualChar && actualChar !== ' ' && actualChar !== '\n') {
        extraCount++;
        diffs.push({
          position: i,
          expected: '',
          actual: actualChar,
          errorType: 'extra',
        });
      }
    }
  }

  // Check for extra characters at the end
  if (userInputIndex < normalizedInput.length) {
    for (let j = userInputIndex; j < normalizedInput.length; j++) {
      if (normalizedInput[j] !== ' ' && normalizedInput[j] !== '\n') {
        extraCount++;
        diffs.push({
          position: normalizedSnippet.length + j,
          expected: '',
          actual: normalizedInput[j],
          errorType: 'extra',
        });
      }
    }
  }

  const totalChars = normalizedSnippet.length;
  const accuracy = totalChars > 0 
    ? Math.round((correctCount / totalChars) * 10000) / 100 
    : 100;

  return {
    isCorrect: diffs.length === 0,
    diffs,
    accuracy,
    totalCharacters: totalChars,
    correctCharacters: correctCount,
    missingCount,
    extraCount,
    mismatchCount,
  };
};

// ============================================
// COMPLETE FUNCTION MODE
// ============================================

export const compareCompleteFunction = (
  starterCode: string,
  solution: string,
  userCode: string,
  options: DiffOptions = defaultOptions
): ComparisonResult => {
  const normalizedStarter = normalizeString(starterCode, options);
  const normalizedSolution = normalizeString(solution, options);
  const normalizedUser = normalizeString(userCode, options);

  const startIndex = normalizedStarter.length;
  const solutionRemaining = normalizedSolution.slice(startIndex);
  const userRemaining = normalizedUser.slice(startIndex);

  const diffs: DiffResult[] = [];
  let correctCount = normalizedStarter.length;
  let mismatchCount = 0;
  let extraCount = 0;

  const maxLength = Math.max(solutionRemaining.length, userRemaining.length);

  for (let i = 0; i < maxLength; i++) {
    const expectedChar = solutionRemaining[i] || '';
    const actualChar = userRemaining[i] || '';

    if (expectedChar !== actualChar) {
      if (!actualChar) {
        diffs.push({
          position: startIndex + i,
          expected: expectedChar,
          actual: '',
          errorType: 'missing',
        });
        mismatchCount++;
      } else if (!expectedChar) {
        diffs.push({
          position: startIndex + i,
          expected: '',
          actual: actualChar,
          errorType: 'extra',
        });
        extraCount++;
      } else {
        diffs.push({
          position: startIndex + i,
          expected: expectedChar,
          actual: actualChar,
          errorType: 'mismatch',
        });
        mismatchCount++;
      }
    } else {
      correctCount++;
    }
  }

  const totalChars = normalizedSolution.length;
  const accuracy = totalChars > 0 
    ? Math.round((correctCount / totalChars) * 10000) / 100 
    : 100;

  return {
    isCorrect: diffs.length === 0,
    diffs,
    accuracy,
    totalCharacters: totalChars,
    correctCharacters: correctCount,
    missingCount: mismatchCount,
    extraCount,
    mismatchCount,
  };
};

// ============================================
// MAIN COMPARISON FUNCTION
// ============================================

export const compareCode = (
  userCode: string,
  referenceCode: string,
  style: TypingStyle,
  blanks?: BlankPosition[],
  starterCode?: string,
  options: DiffOptions = defaultOptions
): ComparisonResult => {
  switch (style) {
    case 'fill-blanks':
      if (!blanks || !referenceCode) {
        return compareStrings(referenceCode, userCode, options);
      }
      return compareWithBlanks(referenceCode, blanks, userCode, options);
    
    case 'complete-function':
      if (!starterCode) {
        return compareStrings(referenceCode, userCode, options);
      }
      return compareCompleteFunction(starterCode, referenceCode, userCode, options);
    
    case 'full':
    default:
      return compareStrings(referenceCode, userCode, options);
  }
};

// ============================================
// WPM CALCULATOR
// ============================================

export const calculateWPM = (
  startTime: number,
  endTime: number,
  typedCharacters: number
): WPMResult => {
  const timeInMs = endTime - startTime;
  const timeInSeconds = timeInMs / 1000;
  const timeInMinutes = timeInSeconds / 60;

  // Standard: 5 characters = 1 word
  const words = typedCharacters / 5;
  const wpm = timeInMinutes > 0 ? Math.round(words / timeInMinutes) : 0;

  return {
    wpm: Math.max(0, wpm),
    totalCharacters: typedCharacters,
    timeInSeconds: Math.round(timeInSeconds * 100) / 100,
    timeInMinutes: Math.round(timeInMinutes * 1000) / 1000,
    words: Math.round(words * 10) / 10,
  };
};

// ============================================
// ACCURACY CALCULATOR
// ============================================

export const calculateAccuracy = (
  errors: number,
  totalCharacters: number
): AccuracyResult => {
  if (totalCharacters === 0) {
    return {
      accuracy: 100,
      totalTyped: 0,
      errors: 0,
      errorRate: 0,
    };
  }

  const correct = totalCharacters - errors;
  const accuracy = Math.round((correct / totalCharacters) * 10000) / 100;
  const errorRate = Math.round((errors / totalCharacters) * 10000) / 100;

  return {
    accuracy: Math.max(0, accuracy),
    totalTyped: totalCharacters,
    errors,
    errorRate,
  };
};

// ============================================
// ERROR ANALYSIS
// ============================================

export const analyzeErrors = (diffs: DiffResult[]): {
  total: number;
  byType: Record<DiffResult['errorType'], number>;
  firstErrorPosition: number;
  errorPositions: number[];
} => {
  const byType: Record<DiffResult['errorType'], number> = {
    missing: 0,
    extra: 0,
    mismatch: 0,
    whitespace: 0,
    case: 0,
  };

  const errorPositions: number[] = [];

  for (const diff of diffs) {
    byType[diff.errorType]++;
    errorPositions.push(diff.position);
  }

  return {
    total: diffs.length,
    byType,
    firstErrorPosition: errorPositions[0] || -1,
    errorPositions,
  };
};

// ============================================
// PROGRESS CALCULATION
// ============================================

export const calculateProgress = (
  userCode: string,
  referenceCode: string
): {
  progress: number;
  isComplete: boolean;
  remaining: number;
} => {
  const normalizedUser = normalizeString(userCode, defaultOptions);
  const normalizedRef = normalizeString(referenceCode, defaultOptions);
  
  const maxLength = normalizedRef.length;
  const currentLength = normalizedUser.length;
  
  const progress = maxLength > 0 
    ? Math.round((currentLength / maxLength) * 100) 
    : 0;
  
  const isComplete = currentLength >= maxLength && normalizedUser === normalizedRef;
  const remaining = Math.max(0, maxLength - currentLength);

  return {
    progress: Math.min(100, progress),
    isComplete,
    remaining,
  };
};

// ============================================
// VALIDATION SUMMARY
// ============================================

export interface ValidationSummary {
  isCorrect: boolean;
  accuracy: number;
  wpm: number;
  timeInSeconds: number;
  totalCharacters: number;
  correctCharacters: number;
  errors: number;
  progress: number;
  errorBreakdown: {
    missing: number;
    extra: number;
    mismatch: number;
  };
}

export const getValidationSummary = (
  userCode: string,
  referenceCode: string,
  startTime: number,
  endTime: number,
  style: TypingStyle = 'full',
  blanks?: BlankPosition[]
): ValidationSummary => {
  const comparison = compareCode(userCode, referenceCode, style, blanks);
  const wpmResult = calculateWPM(startTime, endTime, userCode.length);
  const progress = calculateProgress(userCode, referenceCode);

  const errorBreakdown = {
    missing: comparison.diffs.filter(d => d.errorType === 'missing').length,
    extra: comparison.diffs.filter(d => d.errorType === 'extra').length,
    mismatch: comparison.diffs.filter(d => d.errorType === 'mismatch').length,
  };

  return {
    isCorrect: comparison.isCorrect,
    accuracy: comparison.accuracy,
    wpm: wpmResult.wpm,
    timeInSeconds: wpmResult.timeInSeconds,
    totalCharacters: comparison.totalCharacters,
    correctCharacters: comparison.correctCharacters,
    errors: comparison.diffs.length,
    progress: progress.progress,
    errorBreakdown,
  };
};