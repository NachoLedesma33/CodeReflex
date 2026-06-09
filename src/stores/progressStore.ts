import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProgrammingLanguage, ExerciseStats, CommonMistake } from '@/types';
import { checkAchievements } from '@/lib/achievements';

interface ProgressState {
  // Stats generales
  totalExercises: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalTypingTime: number;
  totalXP: number;
  
  // Progreso por lenguaje
  bestWpmByLanguage: Record<ProgrammingLanguage, number>;
  bestAccuracyByLanguage: Record<ProgrammingLanguage, number>;
  
  // Ejercicios
  completedExercises: Set<string>;
  favoriteExercises: Set<string>;
  exerciseStats: Record<string, ExerciseStats>;
  
  // Errores comunes
  commonMistakes: CommonMistake[];
  
  // Logros desbloqueados
  unlockedAchievements: Set<string>;
  
  // Acciones
  completeExercise: (
    exerciseId: string,
    language: ProgrammingLanguage,
    wpm: number,
    accuracy: number,
    timeSpent: number
  ) => void;
  
  updateStreak: () => void;
  toggleFavorite: (exerciseId: string) => void;
  isFavorite: (exerciseId: string) => boolean;
  isCompleted: (exerciseId: string) => boolean;
  getExerciseStats: (exerciseId: string) => ExerciseStats | null;
  recordMistake: (pattern: string, description: string) => void;
  addXP: (amount: number) => void;
  resetProgress: () => void;
  getStats: () => {
    totalExercises: number;
    totalAttempts: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    totalTime: number;
  };
}

const calculateStreak = (lastDate: string): number => {
  if (!lastDate) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const lastActive = new Date(lastDate);
  const todayDate = new Date(today);
  
  const diffDays = Math.floor((todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 0;
  if (diffDays === 1) return 1;
  return -1;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      totalExercises: 0,
      totalAttempts: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalTypingTime: 0,
      totalXP: 0,
      bestWpmByLanguage: { javascript: 0, typescript: 0, python: 0, java: 0 },
      bestAccuracyByLanguage: { javascript: 0, typescript: 0, python: 0, java: 0 },
      completedExercises: new Set(),
      favoriteExercises: new Set(),
      exerciseStats: {},
      commonMistakes: [],
      unlockedAchievements: new Set(),

      completeExercise: (exerciseId, language, wpm, accuracy, timeSpent) => {
        const { 
          completedExercises, 
          exerciseStats, 
          bestWpmByLanguage, 
          bestAccuracyByLanguage,
          totalExercises,
          totalAttempts,
          totalTypingTime,
          currentStreak 
        } = get();
        
        const isNewCompletion = !completedExercises.has(exerciseId);
        
        const existingStats = exerciseStats[exerciseId];
        const newAttempts = (existingStats?.attempts || 0) + 1;
        const bestWpm = existingStats ? Math.max(existingStats.bestWpm, wpm) : wpm;
        const bestAcc = existingStats ? Math.max(existingStats.bestAccuracy, accuracy) : accuracy;
        
        const updatedStats: ExerciseStats = {
          exerciseId,
          attempts: newAttempts,
          bestWpm,
          bestAccuracy: bestAcc,
          averageTime: existingStats 
            ? (existingStats.averageTime * existingStats.attempts + timeSpent) / newAttempts 
            : timeSpent,
          completedAt: isNewCompletion ? new Date().toISOString() : existingStats?.completedAt,
          lastAttemptAt: new Date().toISOString(),
        };

        const streak = calculateStreak(get().lastActiveDate);
        const newStreak = streak >= 0 ? currentStreak + (streak === 0 ? 0 : 1) : 1;

        const newBestWpm = { ...bestWpmByLanguage };
        if (wpm > newBestWpm[language]) {
          newBestWpm[language] = wpm;
        }

        const newBestAcc = { ...bestAccuracyByLanguage };
        if (accuracy > newBestAcc[language]) {
          newBestAcc[language] = accuracy;
        }

        set({
          completedExercises: new Set([...completedExercises, exerciseId]),
          exerciseStats: { ...exerciseStats, [exerciseId]: updatedStats },
          totalExercises: isNewCompletion ? totalExercises + 1 : totalExercises,
          totalAttempts: totalAttempts + 1,
          totalTypingTime: totalTypingTime + timeSpent,
          bestWpmByLanguage: newBestWpm,
          bestAccuracyByLanguage: newBestAcc,
          currentStreak: newStreak,
          longestStreak: Math.max(get().longestStreak, newStreak),
          lastActiveDate: new Date().toISOString().split('T')[0],
        });

        const completedByLanguage: Record<ProgrammingLanguage, number> = {
          javascript: 0, typescript: 0, python: 0, java: 0,
        };

        const langMap: Record<string, ProgrammingLanguage> = {
          'js-': 'javascript',
          'ts-': 'typescript',
          'py-': 'python',
          'jv-': 'java',
        };

        const currentStats = get();
        Object.entries(currentStats.exerciseStats).forEach(([, exStats]) => {
          if (exStats.bestWpm > 0) {
            for (const prefix of Object.keys(langMap)) {
              if (exStats.exerciseId.startsWith(prefix)) {
                completedByLanguage[langMap[prefix]]++;
                break;
              }
            }
          }
        });

        const previousXP = currentStats.totalXP;
        const achievementResult = checkAchievements({
          totalExercises: currentStats.totalExercises,
          currentStreak: currentStats.currentStreak,
          longestStreak: currentStats.longestStreak,
          bestWpm: Math.max(...Object.values(currentStats.bestWpmByLanguage)),
          bestAccuracy: Math.max(...Object.values(currentStats.bestAccuracyByLanguage)),
          completedByLanguage,
          totalTimeSpent: currentStats.totalTypingTime,
          previousXP,
          unlockedAchievementIds: currentStats.unlockedAchievements,
        });

        if (achievementResult.unlocked.length > 0) {
          const newUnlocked = new Set(currentStats.unlockedAchievements);
          achievementResult.unlocked.forEach(a => newUnlocked.add(a.id));
          set({ unlockedAchievements: newUnlocked });
          achievementResult.unlocked.forEach(a => get().addXP(a.xpReward));
        }

        if (achievementResult.milestone) {
          console.log('[Milestone]', achievementResult.milestone);
        }
      },

      updateStreak: () => {
        const { lastActiveDate } = get();
        const today = new Date().toISOString().split('T')[0];
        
        if (lastActiveDate === today) return;
        
        const lastDate = new Date(lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          set({ currentStreak: 0 });
        }
      },

      toggleFavorite: (exerciseId) => {
        const { favoriteExercises } = get();
        const newFavorites = new Set(favoriteExercises);
        
        if (newFavorites.has(exerciseId)) {
          newFavorites.delete(exerciseId);
        } else {
          newFavorites.add(exerciseId);
        }
        
        set({ favoriteExercises: newFavorites });
      },

      isFavorite: (exerciseId) => get().favoriteExercises.has(exerciseId),
      
      isCompleted: (exerciseId) => get().completedExercises.has(exerciseId),

      getExerciseStats: (exerciseId) => get().exerciseStats[exerciseId] || null,

      recordMistake: (pattern, description) => {
        const { commonMistakes } = get();
        const existing = commonMistakes.find(m => m.pattern === pattern);
        
        if (existing) {
          set({
            commonMistakes: commonMistakes.map(m =>
              m.pattern === pattern ? { ...m, count: m.count + 1 } : m
            ),
          });
        } else {
          set({
            commonMistakes: [...commonMistakes, { pattern, count: 1, description }],
          });
        }
      },

      addXP: (amount) => {
        set((state) => ({ totalXP: state.totalXP + amount }));
      },

      resetProgress: () => {
        set({
          totalExercises: 0,
          totalAttempts: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: '',
          totalTypingTime: 0,
          totalXP: 0,
          bestWpmByLanguage: { javascript: 0, typescript: 0, python: 0, java: 0 },
          bestAccuracyByLanguage: { javascript: 0, typescript: 0, python: 0, java: 0 },
          completedExercises: new Set(),
          exerciseStats: {},
          commonMistakes: [],
          unlockedAchievements: new Set(),
        });
      },

      getStats: () => {
        const state = get();
        return {
          totalExercises: state.totalExercises,
          totalAttempts: state.totalAttempts,
          currentStreak: state.currentStreak,
          longestStreak: state.longestStreak,
          totalXP: state.totalXP,
          totalTime: state.totalTypingTime,
        };
      },
    }),
    {
      name: 'codereflex-progress',
      partialize: (state) => ({
        totalExercises: state.totalExercises,
        totalAttempts: state.totalAttempts,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate,
        totalTypingTime: state.totalTypingTime,
        totalXP: state.totalXP,
        bestWpmByLanguage: state.bestWpmByLanguage,
        bestAccuracyByLanguage: state.bestAccuracyByLanguage,
        completedExercises: Array.from(state.completedExercises),
        favoriteExercises: Array.from(state.favoriteExercises),
        exerciseStats: state.exerciseStats,
        commonMistakes: state.commonMistakes,
        unlockedAchievements: Array.from(state.unlockedAchievements),
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Record<string, unknown>;
        return {
          ...current,
          ...p,
          completedExercises: new Set(p.completedExercises as string[]),
          favoriteExercises: new Set(p.favoriteExercises as string[]),
          unlockedAchievements: new Set(p.unlockedAchievements as string[]),
        };
      },
    }
  )
);