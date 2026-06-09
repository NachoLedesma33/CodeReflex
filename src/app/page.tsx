'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useUIStore } from '@/stores/uiStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsPanel } from '@/components/layout/StatsPanel';
import { SettingsPanel } from '@/components/layout/SettingsPanel';
import { Exercise } from '@/types';
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
      <span className="text-sm text-text-muted">Cargando ejercicio...</span>
      </div>

      <SettingsPanel />
    </div>
  );

export default function Home() {
  const {
    currentExercise,
    filteredExercises,
    isLoading,
    error,
    setCurrentExercise,
  } = useExerciseStore();

  const {
    zenModeEnabled,
    statsPanelCollapsed,
    toggleStatsPanel,
    sidebarCollapsed,
    toggleSidebar,
    mode,
  } = useUIStore();

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
        <div className="flex flex-col items-center gap-4 p-8 bg-bg-surface rounded-lg border border-red-500/30 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-lg font-semibold text-text-primary">Error al cargar ejercicios</h2>
          <p className="text-sm text-text-secondary text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm text-text-muted">Cargando CodeReflex...</span>
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
                {mode === 'reflex-typing' ? (
                  <ReflexTyping
                    key={currentExercise.id}
                    exercise={currentExercise}
                    className="flex-1"
                  />
                ) : (
                  <GuidedProblem
                    key={currentExercise.id}
                    exercise={currentExercise}
                    className="flex-1"
                  />
                )}
              </Suspense>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center">
                    {mode === 'reflex-typing' ? (
                      <Keyboard className="w-8 h-8 text-text-muted" />
                    ) : (
                      <BookOpen className="w-8 h-8 text-text-muted" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-text-primary">No hay ejercicios disponibles</h3>
                    <p className="text-sm text-text-muted mt-1">
                      Selecciona un lenguaje y dificultad en la barra lateral
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!zenModeEnabled && activePanel && (
            <div className="w-80 border-l border-border bg-bg-surface overflow-y-auto custom-scrollbar">
              {activePanel === 'info' && currentExercise && (
                <Suspense fallback={<LoadingFallback />}>
                  <ExerciseInfo
                    exercise={currentExercise}
                    showHints={mode === 'guided-problem'}
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
            <div className="w-80 border-l border-border bg-bg-surface overflow-y-auto custom-scrollbar">
              <StatsPanel className="p-4" />
            </div>
          )}
        </main>
      </div>

      {!zenModeEnabled && (
        <div className="h-8 bg-bg-surface border-t border-border flex items-center justify-between px-4 text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span>
              {currentExercise?.id || 'Ningún ejercicio seleccionado'}
            </span>
            <span>
              {filteredExercises.length} ejercicios disponibles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Atajos:</span>
            <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded text-text-muted">Ctrl+B</kbd>
            <span className="text-text-muted">Sidebar</span>
            <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded text-text-muted">Ctrl+S</kbd>
            <span className="text-text-muted">Stats</span>
          </div>
        </div>
      )}
    </div>
  );
}