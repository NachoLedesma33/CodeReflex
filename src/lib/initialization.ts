import { useState, useEffect, useCallback, useRef } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import { useUIStore } from '@/stores/uiStore';
import { ProgrammingLanguage, DifficultyLevel } from '@/types';
import { checkAchievements } from './achievements';

interface InitializationOptions {
  autoPreload?: boolean;
  defaultLanguage?: ProgrammingLanguage;
  defaultLevel?: DifficultyLevel;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

interface InitializationState {
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  hydrated: boolean;
}

const DEFAULT_LANGUAGE: ProgrammingLanguage = 'javascript';
const DEFAULT_LEVEL: DifficultyLevel = 'fundamentals';

export function useInitialization(options: InitializationOptions = {}) {
  const {
    autoPreload = true,
    defaultLanguage = DEFAULT_LANGUAGE,
    defaultLevel = DEFAULT_LEVEL,
    onReady,
    onError,
  } = options;

  const initializedRef = useRef(false);
  const [state, setState] = useState<InitializationState>({
    isReady: false,
    isLoading: true,
    error: null,
    hydrated: false,
  });

  const loadExercises = useExerciseStore(state => state.loadExercises);
  const preloadNextDifficulty = useExerciseStore(state => state.preloadNextDifficulty);
  const setLanguageFilter = useExerciseStore(state => state.setLanguageFilter);
  const setLevelFilter = useExerciseStore(state => state.setLevelFilter);
  const setCurrentLanguage = useUIStore(state => state.setCurrentLanguage);
  const setCurrentLevel = useUIStore(state => state.setCurrentLevel);

  const { 
    totalExercises, 
    currentStreak, 
    longestStreak, 
    bestWpmByLanguage, 
    bestAccuracyByLanguage,
    totalXP,
    addXP,
  } = useProgressStore();

  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      setLanguageFilter(defaultLanguage);
      setLevelFilter(defaultLevel);
      setCurrentLanguage(defaultLanguage);
      setCurrentLevel(defaultLevel);

      await loadExercises(defaultLanguage, defaultLevel);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: true,
        hydrated: true,
      }));

      if (autoPreload) {
        setTimeout(() => {
          preloadNextDifficulty();
        }, 2000);
      }

      onReady?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Initialization failed');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error,
      }));
      onError?.(error);
    }
  }, [
    defaultLanguage,
    defaultLevel,
    loadExercises,
    preloadNextDifficulty,
    setLanguageFilter,
    setLevelFilter,
    setCurrentLanguage,
    setCurrentLevel,
    autoPreload,
    onReady,
    onError,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initialize();
  }, [initialize]);

  return state;
}

export function useProgressSync() {
  const previousXP = useRef(0);
  const previousExercises = useRef(0);
  const previousStreak = useRef(0);
  const previousBestWpm = useRef(0);

  const { totalXP, currentStreak, longestStreak, totalExercises, addXP, bestWpmByLanguage, bestAccuracyByLanguage } = useProgressStore();
  const loadExercises = useExerciseStore(state => state.loadExercises);
  const languageFilter = useExerciseStore(state => state.languageFilter);
  const levelFilter = useExerciseStore(state => state.levelFilter);

  useEffect(() => {
    previousXP.current = totalXP;
    previousExercises.current = totalExercises;
    previousStreak.current = currentStreak;
    previousBestWpm.current = bestWpmByLanguage.javascript || 0;
  }, []);

  useEffect(() => {
    if (previousXP.current === 0) return;

    const xpGained = totalXP - previousXP.current;
    if (xpGained > 0) {
      console.log(`[Progress] XP gained: +${xpGained} (Total: ${totalXP})`);
    }

    const exercisesCompleted = totalExercises - previousExercises.current;
    if (exercisesCompleted > 0) {
      console.log(`[Progress] Exercises completed: +${exercisesCompleted} (Total: ${totalExercises})`);
    }

    previousXP.current = totalXP;
    previousExercises.current = totalExercises;
  }, [totalXP, totalExercises]);

  const checkAndUnlockAchievements = useCallback(() => {
    const completedByLanguage: Record<ProgrammingLanguage, number> = {
      javascript: 0,
      typescript: 0,
      python: 0,
      java: 0,
    };

    const stats = useProgressStore.getState();
    Object.entries(stats.exerciseStats).forEach(([_, exStats]) => {
      if (exStats.bestWpm > 0) {
        const lang = extractLanguageFromExerciseId(exStats.exerciseId);
        if (lang) completedByLanguage[lang]++;
      }
    });

    const result = checkAchievements({
      totalExercises: stats.totalExercises,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      bestWpm: Math.max(...Object.values(bestWpmByLanguage)),
      bestAccuracy: Math.max(...Object.values(bestAccuracyByLanguage)),
      completedByLanguage,
      totalTimeSpent: stats.totalTypingTime,
      previousXP: previousXP.current,
      unlockedAchievementIds: stats.unlockedAchievements,
    });

    if (result.unlocked.length > 0) {
      console.log('[Achievements] Unlocked:', result.unlocked.map(a => a.name));

      result.unlocked.forEach(achievement => {
        addXP(achievement.xpReward);
      });

      if (result.milestone) {
        console.log('[Milestone]', result.milestone);
      }
    }

    return result;
  }, [bestWpmByLanguage, bestAccuracyByLanguage, addXP]);

  return {
    checkAndUnlockAchievements,
  };
}

function extractLanguageFromExerciseId(exerciseId: string): ProgrammingLanguage | null {
  const langMap: Record<string, ProgrammingLanguage> = {
    'js-': 'javascript',
    'ts-': 'typescript',
    'py-': 'python',
  };

  for (const prefix of Object.keys(langMap)) {
    if (exerciseId.startsWith(prefix)) {
      return langMap[prefix];
    }
  }
  return null;
}

export function useIntelligentPreload() {
  const preloadNextDifficulty = useExerciseStore(state => state.preloadNextDifficulty);
  const levelFilter = useExerciseStore(state => state.levelFilter);
  const languageFilter = useExerciseStore(state => state.languageFilter);
  const loadedCombinations = useExerciseStore(state => state.loadedCombinations);

  const canPreload = levelFilter && levelFilter !== 'advanced';

  useEffect(() => {
    if (!canPreload) return;

    const timer = setTimeout(() => {
      preloadNextDifficulty();
    }, 3000);

    return () => clearTimeout(timer);
  }, [levelFilter, languageFilter, canPreload, preloadNextDifficulty]);

  return { canPreload };
}

export function useErrorRecovery() {
  const [error, setError] = useState<Error | null>(null);
  const loadExercises = useExerciseStore(state => state.loadExercises);
  const clearCache = useExerciseStore(state => state.clearCache);

  const recover = useCallback(async () => {
    setError(null);
    clearCache();
    try {
      await loadExercises();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Recovery failed'));
    }
  }, [loadExercises, clearCache]);

  const retry = useCallback(async () => {
    await recover();
  }, [recover]);

  return {
    error,
    recover,
    retry,
  };
}

export function getInitialState() {
  if (typeof window === 'undefined') {
    return {
      language: DEFAULT_LANGUAGE,
      level: DEFAULT_LEVEL,
    };
  }

  try {
    const uiState = localStorage.getItem('codereflex-ui');
    const progressState = localStorage.getItem('codereflex-progress');

    if (uiState) {
      const parsed = JSON.parse(uiState);
      return {
        language: parsed.currentLanguage || DEFAULT_LANGUAGE,
        level: parsed.currentLevel || DEFAULT_LEVEL,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
    language: DEFAULT_LANGUAGE,
    level: DEFAULT_LEVEL,
  };
}

export function clearAllData() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('codereflex-ui');
  localStorage.removeItem('codereflex-progress');
  localStorage.removeItem('codereflex-cache');
}

export default {
  useInitialization,
  useProgressSync,
  useIntelligentPreload,
  useErrorRecovery,
  getInitialState,
  clearAllData,
};