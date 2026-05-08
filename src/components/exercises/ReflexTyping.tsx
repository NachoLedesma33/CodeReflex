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
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  Trophy,
  Clock,
  Zap,
  Target,
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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCompleteRef = useRef(false);

  const { getNextExercise, getPreviousExercise, currentIndex, filteredExercises } = useExerciseStore();
  const { isFavorite, toggleFavorite, completeExercise, addXP } = useProgressStore();

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

    completeExercise(exercise.id, exercise.language, finalMetrics.wpm, finalMetrics.accuracy, finalMetrics.elapsedTime);
    
    const xpAmount = Math.round(finalMetrics.wpm / 10) + Math.round(finalMetrics.accuracy / 10);
    addXP(xpAmount);

    onComplete?.(finalMetrics);
  }, [exercise, completeExercise, addXP, onComplete]);

  const {
    metrics,
    isComplete,
    reset: resetValidator,
  } = useTypingValidator({
    expectedCode,
    blanks,
    enabled: sessionState === 'running',
    onComplete: handleExerciseComplete,
    debounceMs: 100,
    throttleMs: 30,
  });

  useGhostText({
    codeSnippet: expectedCode,
    typingStyle,
    blanks,
    enabled: sessionState === 'running',
    cursorPosition: currentCode.length,
  });

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredExercises.length - 1;

  useEffect(() => {
    if (sessionState === 'running' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState, startTime]);

  useEffect(() => {
    if (isComplete && sessionState === 'running' && !isCompleteRef.current) {
      isCompleteRef.current = true;
      handleExerciseComplete(metrics);
    }
  }, [isComplete, sessionState, metrics, handleExerciseComplete]);

  useEffect(() => {
    setCurrentCode('');
    setSessionState('idle');
    setSessionSummary(null);
    setElapsedTime(0);
    setStartTime(null);
    resetValidator();
    isCompleteRef.current = false;
  }, [exercise.id, resetValidator]);

  const startSession = useCallback(() => {
    setSessionState('running');
    setStartTime(Date.now());
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
    setElapsedTime(0);
    setStartTime(null);
    setSessionSummary(null);
    resetValidator();
  }, [resetValidator]);

  const handleCodeChange = useCallback((code: string) => {
    if (sessionState !== 'running') return;
    setCurrentCode(code);
  }, [sessionState]);

  const handleEditorComplete = useCallback((success: boolean) => {
    if (success && sessionState === 'running') {
      handleExerciseComplete(metrics);
    }
  }, [sessionState, handleExerciseComplete, metrics]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!expectedCode) return 0;
    return Math.round((currentCode.length / expectedCode.length) * 100);
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
              <span className="text-xs text-zinc-500 uppercase">{exercise.language}</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 truncate">{exercise.title}</h2>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{exercise.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(exercise.id)}
              className="p-2"
            >
              {isFavoriteCurrent ? (
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="w-5 h-5 text-zinc-500" />
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
            <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded p-2 border border-zinc-700/50">
              💡 {exercise.context}
            </p>
          </div>
        )}

        <CardContent className="flex-1 min-h-0 p-2">
          <div className="h-full min-h-[300px]">
            <CodeEditor
              expectedCode={expectedCode}
              currentCode={currentCode}
              language={exercise.language}
              typingStyle={typingStyle}
              blanks={blanks}
              mode={sessionState === 'completed' ? 'read' : 'write'}
              onChange={handleCodeChange}
              onComplete={handleEditorComplete}
              showGhostText={sessionState === 'running'}
              highlightErrors={true}
              className="h-full"
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          {sessionState !== 'completed' ? (
            <>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{metrics.wpm}</span>
                    <span className="text-xs text-zinc-500">WPM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{metrics.accuracy}%</span>
                    <span className="text-xs text-zinc-500">Accuracy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${getProgress()}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">{getProgress()}%</span>
                  </div>
                </div>

                {sessionState === 'idle' && (
                  <Button onClick={startSession} size="md">
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                )}
                {sessionState === 'running' && (
                  <Button onClick={pauseSession} variant="secondary" size="md">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                {sessionState === 'paused' && (
                  <div className="flex gap-2">
                    <Button onClick={resumeSession} size="md">
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                    <Button onClick={resetSession} variant="ghost" size="md">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between w-full text-xs text-zinc-500">
                <span>
                  {exercise.tags?.map(tag => `#${tag}`).join(' ')}
                </span>
                <span>
                  Est. {Math.floor(exercise.estimatedDuration / 60)}min
                </span>
              </div>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-zinc-100">Exercise Complete!</span>
                </div>
                <Button onClick={resetSession} variant="ghost" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>

              {sessionSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-500">{sessionSummary.wpm}</div>
                    <div className="text-xs text-zinc-500">WPM</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-500">{sessionSummary.accuracy}%</div>
                    <div className="text-xs text-zinc-500">Accuracy</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-500">{formatTime(sessionSummary.timeSpent)}</div>
                    <div className="text-xs text-zinc-500">Time</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-zinc-300">{sessionSummary.errors}</div>
                    <div className="text-xs text-zinc-500">Errors</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between w-full pt-2 border-t border-zinc-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious || (() => getPreviousExercise())}
              disabled={isFirst}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-zinc-500">
              {currentIndex + 1} / {filteredExercises.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext || (() => getNextExercise())}
              disabled={isLast}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ReflexTyping;