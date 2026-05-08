'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import { useUIStore } from '@/stores/uiStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsPanel } from '@/components/layout/StatsPanel';
import { Exercise, ExerciseType } from '@/types';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Keyboard,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

const ReflexTyping = lazy(() => import('@/components/exercises/ReflexTyping').then(m => ({ default: m.ReflexTyping })));
const GuidedProblem = lazy(() => import('@/components/exercises/GuidedProblem').then(m => ({ default: m.GuidedProblem })));
const ExerciseInfo = lazy(() => import('@/components/exercises/ExerciseInfo').then(m => ({ default: m.ExerciseInfo })));
const TypingStats = lazy(() => import('@/components/exercises/TypingStats').then(m => ({ default: m.TypingStats })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      <span className="text-sm text-zinc-500">Loading exercise...</span>
    </div>
  </div>
);

export default function Home() {
  const {
    currentExercise,
    filteredExercises,
    isLoading,
    error,
    setCurrentExercise,
    currentType,
  } = useExerciseStore();

  const { isCompleted } = useProgressStore();

  const {
    zenModeEnabled,
    statsPanelCollapsed,
    toggleStatsPanel,
    sidebarCollapsed,
    toggleSidebar,
  } = useUIStore();

  const [showStats, setShowStats] = useState(false);
  const [activePanel, setActivePanel] = useState<'info' | 'stats' | null>(null);

  useEffect(() => {
    if (filteredExercises.length > 0 && !currentExercise) {
      setCurrentExercise(filteredExercises[0]);
    }
  }, [filteredExercises, currentExercise, setCurrentExercise]);

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    setCurrentExercise(exercise);
  }, [setCurrentExercise]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          toggleStatsPanel();
          break;
        case 'b':
          e.preventDefault();
          toggleSidebar();
          break;
        case '1':
          e.preventDefault();
          setActivePanel(activePanel === 'info' ? null : 'info');
          break;
        case '2':
          e.preventDefault();
          setActivePanel(activePanel === 'stats' ? null : 'stats');
          break;
      }
    }
  }, [toggleStatsPanel, toggleSidebar, activePanel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-zinc-900 rounded-lg border border-red-500/30 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-lg font-semibold text-zinc-100">Failed to load exercises</h2>
          <p className="text-sm text-zinc-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm text-zinc-500">Loading CodeReflex...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!zenModeEnabled && <Header />}

      <div className="flex flex-1 overflow-hidden">
        {!zenModeEnabled && !sidebarCollapsed && (
          <Sidebar onSelectExercise={handleSelectExercise} />
        )}

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            {currentExercise ? (
              <Suspense fallback={<LoadingFallback />}>
                {currentType === 'reflex-typing' ? (
                  <ReflexTyping
                    exercise={currentExercise}
                    className="flex-1"
                  />
                ) : (
                  <GuidedProblem
                    exercise={currentExercise}
                    className="flex-1"
                  />
                )}
              </Suspense>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                    {currentType === 'reflex-typing' ? (
                      <Keyboard className="w-8 h-8 text-zinc-500" />
                    ) : (
                      <BookOpen className="w-8 h-8 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-zinc-300">No exercises available</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      Select a language and difficulty from the sidebar
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!zenModeEnabled && activePanel && (
            <div className="w-80 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
              {activePanel === 'info' && currentExercise && (
                <Suspense fallback={<LoadingFallback />}>
                  <ExerciseInfo
                    exercise={currentExercise}
                    showHints={currentType === 'guided-problem'}
                    className="p-4"
                  />
                </Suspense>
              )}
              {activePanel === 'stats' && currentExercise && (
                <Suspense fallback={<LoadingFallback />}>
                  <TypingStats
                    metrics={{
                      wpm: 0,
                      accuracy: 100,
                      totalKeystrokes: 0,
                      correctKeystrokes: 0,
                      errors: 0,
                      corrections: 0,
                      elapsedTime: 0,
                      charactersTyped: 0,
                      charactersRemaining: currentExercise.codeSnippet?.length || 0,
                    }}
                    className="p-4"
                  />
                </Suspense>
              )}
            </div>
          )}

          {!zenModeEnabled && !statsPanelCollapsed && (
            <div className="w-80 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
              <StatsPanel className="p-4" />
            </div>
          )}
        </main>
      </div>

      {!zenModeEnabled && (
        <div className="h-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-600">
          <div className="flex items-center gap-4">
            <span>
              {currentExercise?.id || 'No exercise selected'}
            </span>
            <span>
              {filteredExercises.length} exercises available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">Ctrl+B</kbd>
            <span className="text-zinc-600">Sidebar</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">Ctrl+S</kbd>
            <span className="text-zinc-600">Stats</span>
          </div>
        </div>
      )}
    </div>
  );
}