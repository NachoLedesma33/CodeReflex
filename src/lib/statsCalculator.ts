import { ProgrammingLanguage, DifficultyLevel, Exercise } from '@/types';

export interface TypingSession {
  id: string;
  exerciseId: string;
  language: ProgrammingLanguage;
  level: DifficultyLevel;
  startTime: number;
  endTime: number;
  wpm: number;
  accuracy: number;
  errors: number;
  totalCharacters: number;
  completed: boolean;
}

export interface MistakePattern {
  pattern: string;
  count: number;
  percentage: number;
  description: string;
  examples: string[];
}

export interface ErrorHeatmap {
  character: string;
  count: number;
  frequency: number;
  positions: number[];
  context: string[];
}

export interface ConsistencyResult {
  score: number;
  variance: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  isConsistent: boolean;
}

export interface PerformanceTrend {
  period: 'daily' | 'weekly' | 'monthly';
  data: Array<{ date: string; wpm: number; accuracy: number; sessions: number }>;
  wpmTrend: 'improving' | 'declining' | 'stable';
  accuracyTrend: 'improving' | 'declining' | 'stable';
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
}

export interface LanguagePerformance {
  language: ProgrammingLanguage;
  totalSessions: number;
  completedExercises: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  bestAccuracy: number;
  totalTimeSpent: number;
  consistency: ConsistencyResult;
}

export interface ExerciseRecommendation {
  exercise: Exercise;
  reason: string;
  priority: number;
  basedOn: 'weakness' | 'streak' | 'difficulty' | 'variety';
}

export interface StatsSummary {
  totalSessions: number;
  totalTimeSpent: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

// ============================================
// ACCURACY
// ============================================

export const computeAccuracy = (correct: number, total: number): number => {
  if (total === 0) return 100;
  return Math.round((correct / total) * 10000) / 100;
};

export const computeErrorRate = (errors: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((errors / total) * 10000) / 100;
};

// ============================================
// CONSISTENCY
// ============================================

export const computeConsistency = (values: number[]): ConsistencyResult => {
  if (values.length < 2) {
    return {
      score: 100,
      variance: 0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
      isConsistent: true,
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 0;

  // Score: 100 - CV (coefficient of variation)
  // Lower CV = more consistent = higher score
  const score = Math.max(0, Math.round(100 - coefficientOfVariation));
  const isConsistent = coefficientOfVariation < 15;

  return {
    score,
    variance: Math.round(variance * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
    isConsistent,
  };
};

// ============================================
// ERROR HEATMAP
// ============================================

export const computeHeatmap = (
  typedText: string,
  expectedText: string
): ErrorHeatmap[] => {
  const errorMap: Map<string, { count: number; positions: number[]; contexts: string[] }> = new Map();

  for (let i = 0; i < Math.max(typedText.length, expectedText.length); i++) {
    const expected = expectedText[i];
    const actual = typedText[i];

    if (expected !== actual && expected && actual) {
      if (!errorMap.has(actual)) {
        errorMap.set(actual, { count: 0, positions: [], contexts: [] });
      }

      const errorData = errorMap.get(actual)!;
      errorData.count++;
      errorData.positions.push(i);

      // Get context (surrounding characters)
      const contextStart = Math.max(0, i - 2);
      const contextEnd = Math.min(expectedText.length, i + 3);
      const context = expectedText.slice(contextStart, contextEnd);
      if (!errorData.contexts.includes(context)) {
        errorData.contexts.push(context);
      }
    }
  }

  const totalErrors = Array.from(errorMap.values()).reduce((sum, e) => sum + e.count, 0);

  return Array.from(errorMap.entries()).map(([char, data]) => ({
    character: char,
    count: data.count,
    frequency: totalErrors > 0 ? Math.round((data.count / totalErrors) * 100) : 0,
    positions: data.positions,
    context: data.contexts.slice(0, 5),
  })).sort((a, b) => b.count - a.count);
};

// Common keyboard confusions
const KEYBOARD_CONFUSIONS: Record<string, string[]> = {
  'i': ['o', 'u', 'j', 'k'],
  'o': ['i', 'p', 'l', 'k'],
  'e': ['r', 'w', 's', 'd'],
  'a': ['q', 'w', 's', 'z'],
  'n': ['m', 'b', 'h', 'j'],
  'r': ['t', 'e', 'd', 'f'],
  't': ['r', 'y', 'f', 'g'],
  's': ['a', 'd', 'w', 'x'],
  'd': ['s', 'f', 'e', 'c'],
  '(': [')', '}', ']'],
  ')': ['(', '{', '['],
  '{': ['}', '(', '['],
  '}': ['{', ')', ']'],
};

export const detectKeyboardConfusions = (heatmap: ErrorHeatmap[]): string[] => {
  const confusions: string[] = [];

  for (const error of heatmap) {
    const confusing = KEYBOARD_CONFUSIONS[error.character.toLowerCase()];
    if (confusing) {
      confusions.push(`Confusion with: ${confusing.join(', ')}`);
    }
  }

  return confusions;
};

// ============================================
// MOST COMMON MISTAKES
// ============================================

export const getMostCommonMistakes = (
  sessions: TypingSession[],
  limit: number = 10
): MistakePattern[] => {
  const patterns: Map<string, { count: number; descriptions: Set<string> }> = new Map();

  for (const session of sessions) {
    if (!session.completed || session.errors === 0) continue;

    const errorType = session.accuracy < 70 
      ? 'Low accuracy' 
      : session.accuracy < 85 
        ? 'Medium accuracy' 
        : 'Minor errors';

    if (!patterns.has(errorType)) {
      patterns.set(errorType, { count: 0, descriptions: new Set() });
    }

    const pattern = patterns.get(errorType)!;
    pattern.count += session.errors;
    pattern.descriptions.add(errorType);
  }

  const totalErrors = Array.from(patterns.values()).reduce((sum, p) => sum + p.count, 0);

  return Array.from(patterns.entries())
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      percentage: totalErrors > 0 ? Math.round((data.count / totalErrors) * 100) : 0,
      description: pattern,
      examples: Array.from(data.descriptions).slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// ============================================
// PERFORMANCE TREND
// ============================================

export const computeTypingTrend = (
  sessions: TypingSession[],
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): PerformanceTrend => {
  if (sessions.length === 0) {
    return {
      period,
      data: [],
      wpmTrend: 'stable',
      accuracyTrend: 'stable',
      averageWpm: 0,
      averageAccuracy: 0,
      totalSessions: 0,
    };
  }

  // Group sessions by period
  const grouped = new Map<string, { wpmSum: number; accSum: number; count: number }>();

  for (const session of sessions) {
    const date = new Date(session.startTime);
    let key: string;

    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, { wpmSum: 0, accSum: 0, count: 0 });
    }

    const group = grouped.get(key)!;
    group.wpmSum += session.wpm;
    group.accSum += session.accuracy;
    group.count++;
  }

  const data = Array.from(grouped.entries())
    .map(([date, stats]) => ({
      date,
      wpm: Math.round(stats.wpmSum / stats.count),
      accuracy: Math.round(stats.accSum / stats.count),
      sessions: stats.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate trends
  const recentData = data.slice(-4);
  const olderData = data.slice(-8, -4);

  const recentAvgWpm = recentData.length > 0 
    ? recentData.reduce((sum, d) => sum + d.wpm, 0) / recentData.length 
    : 0;
  const olderAvgWpm = olderData.length > 0 
    ? olderData.reduce((sum, d) => sum + d.wpm, 0) / olderData.length 
    : recentAvgWpm;

  const recentAvgAcc = recentData.length > 0 
    ? recentData.reduce((sum, d) => sum + d.accuracy, 0) / recentData.length 
    : 0;
  const olderAvgAcc = olderData.length > 0 
    ? olderData.reduce((sum, d) => sum + d.accuracy, 0) / olderData.length 
    : recentAvgAcc;

  const wpmTrend = recentAvgWpm > olderAvgWpm + 2 
    ? 'improving' 
    : recentAvgWpm < olderAvgWpm - 2 
      ? 'declining' 
      : 'stable';

  const accuracyTrend = recentAvgAcc > olderAvgAcc + 2 
    ? 'improving' 
    : recentAvgAcc < olderAvgAcc - 2 
      ? 'declining' 
      : 'stable';

  const totalWpm = sessions.reduce((sum, s) => sum + s.wpm, 0);
  const totalAcc = sessions.reduce((sum, s) => sum + s.accuracy, 0);

  return {
    period,
    data,
    wpmTrend,
    accuracyTrend,
    averageWpm: Math.round(totalWpm / sessions.length),
    averageAccuracy: Math.round(totalAcc / sessions.length),
    totalSessions: sessions.length,
  };
};

// ============================================
// LANGUAGE PERFORMANCE
// ============================================

export const computeLanguagePerformance = (
  sessions: TypingSession[],
  language: ProgrammingLanguage
): LanguagePerformance => {
  const langSessions = sessions.filter(s => s.language === language);

  if (langSessions.length === 0) {
    return {
      language,
      totalSessions: 0,
      completedExercises: 0,
      averageWpm: 0,
      bestWpm: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
      totalTimeSpent: 0,
      consistency: {
        score: 100,
        variance: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
        isConsistent: true,
      },
    };
  }

  const wpms = langSessions.map(s => s.wpm);
  const accuracies = langSessions.map(s => s.accuracy);
  const completed = langSessions.filter(s => s.completed).length;
  const totalTime = langSessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);

  const consistency = computeConsistency(wpms);

  return {
    language,
    totalSessions: langSessions.length,
    completedExercises: completed,
    averageWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
    bestWpm: Math.max(...wpms),
    averageAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
    bestAccuracy: Math.max(...accuracies),
    totalTimeSpent: totalTime,
    consistency,
  };
};

export const computeAllLanguagesPerformance = (
  sessions: TypingSession[]
): Record<ProgrammingLanguage, LanguagePerformance> => {
  const languages: ProgrammingLanguage[] = ['javascript', 'typescript', 'python'];
  
  return languages.reduce((acc, lang) => {
    acc[lang] = computeLanguagePerformance(sessions, lang);
    return acc;
  }, {} as Record<ProgrammingLanguage, LanguagePerformance>);
};

// ============================================
// RECOMMENDED EXERCISES
// ============================================

export const getRecommendedExercises = (
  sessions: TypingSession[],
  availableExercises: Exercise[],
  limit: number = 5
): ExerciseRecommendation[] => {
  if (sessions.length === 0 || availableExercises.length === 0) {
    return availableExercises.slice(0, limit).map(ex => ({
      exercise: ex,
      reason: 'Start practicing!',
      priority: 100,
      basedOn: 'variety' as const,
    }));
  }

  // Analyze weak areas
  const languages = computeAllLanguagesPerformance(sessions);
  const weakLanguages = Object.entries(languages)
    .filter(([_, perf]) => perf.averageAccuracy < 80 || perf.consistency.score < 70)
    .map(([lang]) => lang as ProgrammingLanguage);

  // Get completed exercise IDs
  const completedIds = new Set(sessions.filter(s => s.completed).map(s => s.exerciseId));

  // Filter available exercises
  const recommendations: ExerciseRecommendation[] = [];

  // Priority 1: Weak languages
  for (const lang of weakLanguages) {
    const langExercises = availableExercises
      .filter(e => e.language === lang && !completedIds.has(e.id))
      .slice(0, 3);

    for (const ex of langExercises) {
      recommendations.push({
        exercise: ex,
        reason: `Improve your ${lang} skills (low accuracy)`,
        priority: 80,
        basedOn: 'weakness',
      });
    }
  }

  // Priority 2: Not completed exercises
  const notCompleted = availableExercises
    .filter(e => !completedIds.has(e.id))
    .slice(0, 5);

  for (const ex of notCompleted) {
    if (!recommendations.some(r => r.exercise.id === ex.id)) {
      recommendations.push({
        exercise: ex,
        reason: 'Not yet completed',
        priority: 60,
        basedOn: 'variety',
      });
    }
  }

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
};

// ============================================
// STATS SUMMARY
// ============================================

export const computeStatsSummary = (sessions: TypingSession[]): StatsSummary => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalTimeSpent: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
    };
  }

  const totalTime = sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const totalWpm = sessions.reduce((sum, s) => sum + s.wpm, 0);
  const totalAcc = sessions.reduce((sum, s) => sum + s.accuracy, 0);
  const completed = sessions.filter(s => s.completed).length;
  
  const bestWpm = Math.max(...sessions.map(s => s.wpm));
  const bestAcc = Math.max(...sessions.map(s => s.accuracy));

  // Calculate streak (simplified)
  const sortedByDate = [...sessions].sort((a, b) => a.startTime - b.startTime);
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate = '';

  for (const session of sortedByDate) {
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    if (sessionDate === lastDate) {
      tempStreak++;
    } else {
      currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
      lastDate = sessionDate;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    totalSessions: sessions.length,
    totalTimeSpent: totalTime,
    averageWpm: Math.round(totalWpm / sessions.length),
    averageAccuracy: Math.round(totalAcc / sessions.length),
    bestWpm,
    bestAccuracy: bestAcc,
    currentStreak,
    longestStreak,
    completionRate: Math.round((completed / sessions.length) * 100),
  };
};

// ============================================
// FORMAT HELPERS
// ============================================

export const formatTimeSpent = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

export const formatWPMTrend = (trend: PerformanceTrend): string => {
  const icon = trend.wpmTrend === 'improving' ? '↑' : trend.wpmTrend === 'declining' ? '↓' : '→';
  const color = trend.wpmTrend === 'improving' ? 'green' : trend.wpmTrend === 'declining' ? 'red' : 'gray';
  return `${icon} ${trend.averageWpm} WPM (${color})`;
};