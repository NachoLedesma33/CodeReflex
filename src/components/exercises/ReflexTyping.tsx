'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Exercise, TypingMetrics } from '@/types';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { useTypingValidator } from '@/hooks/useTypingValidator';
import { useGhostText } from '@/hooks/useGhostText';
import { useUIStore } from '@/stores/uiStore';
import { playKeySound, playErrorSound, playCompletionSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Star,
  StarOff,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeOff,
  Zap,
} from 'lucide-react';

interface ReflexTypingProps {
  exercise: Exercise;
  onComplete?: (metrics: TypingMetrics) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

type SessionState = 'idle' | 'running' | 'paused' | 'completed';

interface SessionSummary {
  wpm: number;
  accuracy: number;
  timeSpent: number;
  totalKeystrokes: number;
  errors: number;
  corrections: number;
}

export function ReflexTyping({
  exercise,
  onComplete,
  onNext,
  onPrevious,
  className,
}: ReflexTypingProps) {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentCode, setCurrentCode] = useState('');
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const isCompleteRef = useRef(false);
  const prevLengthRef = useRef(0);

  const { getNextExercise, getPreviousExercise, currentIndex, filteredExercises } = useExerciseStore();
  const { isFavorite, toggleFavorite, completeExercise, addXP } = useProgressStore();
  const { soundEnabled, soundVolume, keyboardSounds, errorSounds, completionSound, toggleSound } = useUIStore();

  const soundRef = useRef({ soundEnabled, keyboardSounds, errorSounds, soundVolume, completionSound });
  useEffect(() => {
    soundRef.current = { soundEnabled, keyboardSounds, errorSounds, soundVolume, completionSound };
  }, [soundEnabled, keyboardSounds, errorSounds, soundVolume, completionSound]);

  const isFavoriteCurrent = isFavorite(exercise.id);

  const expectedCode = exercise.codeSnippet || '';
  const typingStyle = exercise.typingStyle || 'full';
  const blanks = exercise.blanks || [];

  const handleExerciseComplete = useCallback((finalMetrics: TypingMetrics) => {
    setSessionState('completed');
    setSessionSummary({
      wpm: finalMetrics.wpm,
      accuracy: finalMetrics.accuracy,
      timeSpent: finalMetrics.elapsedTime,
      totalKeystrokes: finalMetrics.totalKeystrokes,
      errors: finalMetrics.errors,
      corrections: finalMetrics.corrections,
    });

    const { soundEnabled, soundVolume, completionSound } = soundRef.current;
    if (soundEnabled && completionSound) {
      playCompletionSound(soundVolume);
    }

    completeExercise(exercise.id, exercise.language, finalMetrics.wpm, finalMetrics.accuracy, finalMetrics.elapsedTime);
    
    const xpAmount = Math.round(finalMetrics.wpm / 10) + Math.round(finalMetrics.accuracy / 10);
    addXP(xpAmount);

    onComplete?.(finalMetrics);
  }, [exercise, completeExercise, addXP, onComplete]);

  const {
    metrics,
    isComplete,
    reset: resetValidator,
    syncText,
    getErrorPositions,
    getCorrectPositions,
  } = useTypingValidator({
    expectedCode,
    blanks,
    enabled: sessionState === 'running',
    debounceMs: 50,
    throttleMs: 30,
  });

  useGhostText({
    codeSnippet: expectedCode,
    typingStyle,
    blanks,
    enabled: sessionState === 'running',
    cursorPosition: currentCode.length,
  });

  const errorPositions: number[] = getErrorPositions();
  const correctPositions: number[] = getCorrectPositions();

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredExercises.length - 1;

  // Timer logic is now handled internally by useTypingValidator metrics
  // but we might want to trigger a re-render for the timer display if needed.
  // Actually, metrics is already updating, so it should be fine.

  useEffect(() => {
    // Check for completion only when isComplete changes to true
    if (isComplete && sessionState === 'running' && !isCompleteRef.current) {
      isCompleteRef.current = true;
      setSessionState('completed');
      handleExerciseComplete(metrics);
    }
  }, [isComplete, sessionState, metrics, handleExerciseComplete]);

  useEffect(() => {
    setCurrentCode('');
    setSessionState('idle');
    setSessionSummary(null);
    setEditorKey(k => k + 1);
    resetValidator();
    isCompleteRef.current = false;
    prevLengthRef.current = 0;
  }, [exercise.id, resetValidator]);

  const startSession = useCallback(() => {
    setSessionState('running');
  }, []);

  const pauseSession = useCallback(() => {
    setSessionState('paused');
  }, []);

  const resumeSession = useCallback(() => {
    setSessionState('running');
  }, []);

  const resetSession = useCallback(() => {
    setSessionState('idle');
    setCurrentCode('');
    setSessionSummary(null);
    setEditorKey(k => k + 1);
    resetValidator();
  }, [resetValidator]);

  const handleCodeChange = useCallback((code: string) => {
    if (sessionState === 'completed') return;
    
    if (sessionState === 'idle' && code.length > 0) {
      setSessionState('running');
    }
    
    const isAdding = code.length > prevLengthRef.current;
    prevLengthRef.current = code.length;
    
    if (isAdding && code.length > 0 && code.length <= expectedCode.length) {
      const { soundEnabled, keyboardSounds, errorSounds, soundVolume } = soundRef.current;
      if (soundEnabled) {
        const lastChar = code[code.length - 1];
        const expectedChar = expectedCode[code.length - 1];
        if (lastChar === expectedChar) {
          if (keyboardSounds) playKeySound(soundVolume);
        } else {
          if (errorSounds) playErrorSound(soundVolume);
        }
      }
    }
    
    setCurrentCode(code);
    syncText(code);
  }, [sessionState, syncText, expectedCode]);



  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!expectedCode) return 0;
    const expectedLen = expectedCode.length;
    const currentLen = currentCode.length;
    const progress = Math.min((currentLen / expectedLen) * 100, 100);
    return Math.round(progress);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Card variant="bordered" className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                exercise.level === 'fundamentals' && 'bg-green-500/20 text-green-400',
                exercise.level === 'intermediate' && 'bg-yellow-500/20 text-yellow-400',
                exercise.level === 'interview' && 'bg-orange-500/20 text-orange-400',
                exercise.level === 'advanced' && 'bg-red-500/20 text-red-400',
              )}>
                {exercise.level}
              </span>
              <span className="text-xs text-text-muted uppercase">{exercise.language}</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary truncate">{exercise.title}</h2>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{exercise.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="p-2"
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-text-secondary" />
              ) : (
                <VolumeOff className="w-5 h-5 text-text-muted" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(exercise.id)}
              className="p-2"
            >
              {isFavoriteCurrent ? (
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="w-5 h-5 text-text-muted" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSession}
              className="p-2"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {exercise.context && (
          <div className="px-4 pb-2">
            <p className="text-xs text-text-muted bg-bg-elevated/50 rounded p-2 border border-border-strong/50">
              💡 {exercise.context}
            </p>
          </div>
        )}

        <CardContent className="flex-1 min-h-0 p-2 relative bg-bg-primary">
          {/* User typing layer */}
          <div key={exercise.id} className="h-full min-h-[300px] relative z-10 animate-in fade-in duration-300">
            <CodeEditor
              expectedCode={expectedCode}
              currentCode={currentCode}
              language={exercise.language}
              typingStyle={typingStyle}
              blanks={blanks}
              mode={sessionState === 'completed' ? 'read' : 'write'}
              onChange={handleCodeChange}
              showGhostText={sessionState !== 'completed'}
              highlightErrors={true}
              correctPositions={correctPositions}
              errorPositions={errorPositions}
              editorKey={editorKey}
              className="h-full bg-transparent"
            />
          </div>

          {/* Completion Modal with blur */}
          {sessionState === 'completed' && sessionSummary && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-md animate-in fade-in duration-500">
              <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform animate-in zoom-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <Trophy className="w-16 h-16 text-yellow-500" />
                    <div className="absolute -inset-1 bg-yellow-500/20 blur-xl rounded-full" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-text-primary mb-8">¡Ejercicio Completado!</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-bg-elevated/50 border border-border-strong/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-500">{sessionSummary.wpm}</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">WPM</div>
                  </div>
                  <div className="bg-bg-elevated/50 border border-border-strong/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-500">{sessionSummary.accuracy}%</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Precisión</div>
                  </div>
                  <div className="bg-bg-elevated/50 border border-border-strong/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-500">{formatTime(sessionSummary.timeSpent)}</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Tiempo</div>
                  </div>
                  <div className="bg-bg-elevated/50 border border-border-strong/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">{sessionSummary.errors}</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Errores</div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="secondary"
                      onClick={onPrevious || (() => getPreviousExercise())}
                      disabled={isFirst}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={onNext || (() => getNextExercise())}
                      disabled={isLast}
                      className="border-border-strong hover:bg-bg-elevated"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  <Button onClick={resetSession} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-6">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-4">
          {sessionState !== 'completed' ? (
            <>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{metrics.wpm}</span>
                    <span className="text-xs text-text-muted">WPM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{metrics.accuracy}%</span>
                    <span className="text-xs text-text-muted">Precisión</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{formatTime(metrics.elapsedTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${getProgress()}%`,
                          backgroundColor: getProgress() < 30 ? '#ef4444' : getProgress() < 70 ? '#eab308' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className="text-xs text-text-muted">{getProgress()}%</span>
                  </div>
                </div>

                {sessionState === 'idle' && (
                  <div className="text-sm text-text-secondary">
                    Empieza a escribir para comenzar...
                  </div>
                )}
                {sessionState === 'running' && (
                  <Button onClick={pauseSession} variant="secondary" size="md">
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {sessionState === 'paused' && (
                  <div className="flex gap-2">
                    <Button onClick={resumeSession} size="md">
                      <Play className="w-4 h-4 mr-2" />
                      Continuar
                    </Button>
                    <Button onClick={resetSession} variant="ghost" size="md">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between w-full text-xs text-text-muted">
                <span>
                  {exercise.tags?.map(tag => `#${tag}`).join(' ')}
                </span>
                <span>
                  Est. {Math.floor(exercise.estimatedDuration / 60)}min
                </span>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-text-primary">¡Reto Superado!</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-text-muted">
                  {currentIndex + 1} / {filteredExercises.length}
                </span>
              </div>
            </div>
          )}

          {sessionState !== 'completed' && (
            <div className="flex items-center justify-between w-full pt-2 border-t border-border-strong">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious || (() => getPreviousExercise())}
                disabled={isFirst}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs text-text-muted">
                {currentIndex + 1} / {filteredExercises.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext || (() => getNextExercise())}
                disabled={isLast}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default ReflexTyping;