'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Exercise, ExecutionResult, TestResult, TypingMetrics } from '@/types';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Code2,
  ListChecks,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  FileText,
  Clock,
  Zap,
  Target,
} from 'lucide-react';

interface GuidedProblemProps {
  exercise: Exercise;
  onComplete?: (result: ExecutionResult) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

type ProblemPhase = 'reading' | 'coding' | 'testing' | 'completed';

interface TestState {
  id: string;
  passed: boolean | null;
  actual: string;
  expected: string;
  description: string;
  isHidden: boolean;
}

export function GuidedProblem({
  exercise,
  onComplete,
  onNext,
  onPrevious,
  className,
}: GuidedProblemProps) {
  const [phase, setPhase] = useState<ProblemPhase>('reading');
  const [userCode, setUserCode] = useState('');
  const [testStates, setTestStates] = useState<TestState[]>([]);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['problem', 'theory'])
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);

  const { getNextExercise, getPreviousExercise, currentIndex, filteredExercises } = useExerciseStore();
  const { isFavorite, toggleFavorite, completeExercise, addXP } = useProgressStore();

  const isFavoriteCurrent = isFavorite(exercise.id);
  const tests = exercise.tests || [];
  const hints = exercise.hints || [];
  const technicalNotes = exercise.technicalNotes || [];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredExercises.length - 1;

  useEffect(() => {
    if (phase === 'coding' || phase === 'testing') {
      timerRef.current = setInterval(() => {
        if (startTime) {
          setElapsedTime(Date.now() - startTime);
        }
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
  }, [phase, startTime]);

  useEffect(() => {
    setUserCode('');
    setTestStates([]);
    setPhase('reading');
    setRevealedHints(0);
    setShowSolution(false);
    setExecutionResult(null);
    setElapsedTime(0);
    setStartTime(null);
    isCompletedRef.current = false;
  }, [exercise.id]);

  const startCoding = useCallback(() => {
    setPhase('coding');
    setStartTime(Date.now());
  }, []);

  const runTests = useCallback(() => {
    setPhase('testing');
    
    const initialTestStates: TestState[] = tests.map(test => ({
      id: test.id,
      passed: null,
      actual: '',
      expected: test.expected,
      description: test.description,
      isHidden: test.isHidden || false,
    }));
    setTestStates(initialTestStates);

    setTimeout(() => {
      const passedTests = tests.map(test => {
        const actual = simulateTest(test.input);
        return {
          id: test.id,
          passed: actual === test.expected,
          actual,
          expected: test.expected,
          description: test.description,
          isHidden: test.isHidden || false,
        };
      });

      setTestStates(passedTests);

      const allPassed = passedTests.every(t => t.passed);
      
      const result: ExecutionResult = {
        success: allPassed,
        output: allPassed ? 'All tests passed!' : `${passedTests.filter(t => t.passed).length}/${passedTests.length} tests passed`,
        executionTime: elapsedTime,
        testResults: passedTests.map(t => ({
          testCaseId: t.id,
          passed: t.passed || false,
          actual: t.actual,
          expected: t.expected,
          executionTime: Math.random() * 50,
        })),
      };

      setExecutionResult(result);

      if (allPassed && !isCompletedRef.current) {
        isCompletedRef.current = true;
        setPhase('completed');
        
        const wpm = Math.round((userCode.length / 5) / (elapsedTime / 60000)) || 0;
        const accuracy = passedTests.length > 0 ? Math.round((passedTests.filter(t => t.passed).length / passedTests.length) * 100) : 0;
        
        completeExercise(exercise.id, exercise.language, wpm, accuracy, elapsedTime);
        
        const xpAmount = 25 + Math.round(accuracy / 10);
        addXP(xpAmount);

        onComplete?.(result);
      }
    }, 800);
  }, [tests, userCode, elapsedTime, exercise, completeExercise, addXP, onComplete]);

  const simulateTest = (input: string): string => {
    try {
      const fn = new Function(userCode + `\nreturn ${getMainFunction(exercise.solution || '')}`);
      const result = fn(input);
      return String(result);
    } catch {
      return 'Error';
    }
  };

  const getMainFunction = (code: string): string => {
    const match = code.match(/function\s+(\w+)/);
    return match ? match[1] : '';
  };

  const resetProblem = useCallback(() => {
    setUserCode('');
    setTestStates([]);
    setPhase('reading');
    setRevealedHints(0);
    setShowSolution(false);
    setExecutionResult(null);
    setElapsedTime(0);
    setStartTime(null);
    isCompletedRef.current = false;
  }, []);

  const revealNextHint = () => {
    setRevealedHints(prev => Math.min(prev + 1, hints.length));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-200">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-zinc-300">$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-zinc-800 px-1 rounded text-blue-400 text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Card variant="bordered" className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
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
              <span className="text-xs text-zinc-600">• {exercise.category}</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 truncate">{exercise.title}</h2>
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
              onClick={resetProblem}
              className="p-2"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-2 py-1 rounded',
                phase === 'reading' && 'bg-blue-500/20 text-blue-400',
                phase === 'coding' && 'bg-yellow-500/20 text-yellow-400',
                phase === 'testing' && 'bg-purple-500/20 text-purple-400',
                phase === 'completed' && 'bg-green-500/20 text-green-400',
              )}>
                {phase === 'reading' && '📖 Reading'}
                {phase === 'coding' && '⌨️ Coding'}
                {phase === 'testing' && '🧪 Testing'}
                {phase === 'completed' && '✅ Completed'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {phase === 'reading' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection('problem')}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 w-full"
                >
                  <FileText className="w-4 h-4" />
                  Problem Statement
                  {expandedSections.has('problem') ? (
                    <ChevronUp className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  )}
                </button>
                {expandedSections.has('problem') && (
                  <div 
                    className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-400 border border-zinc-700/50"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(exercise.description) }}
                  />
                )}
              </div>

              {exercise.context && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection('theory')}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 w-full"
                  >
                    <BookOpen className="w-4 h-4" />
                    Theory & Context
                    {expandedSections.has('theory') ? (
                      <ChevronUp className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                  {expandedSections.has('theory') && (
                    <div 
                      className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-400 border border-zinc-700/50"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(exercise.context) }}
                    />
                  )}
                </div>
              )}

              {technicalNotes.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection('notes')}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 w-full"
                  >
                    <Code2 className="w-4 h-4" />
                    Technical Notes ({technicalNotes.length})
                    {expandedSections.has('notes') ? (
                      <ChevronUp className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                  {expandedSections.has('notes') && (
                    <div className="space-y-2">
                      {technicalNotes.map((note, i) => (
                        <div key={note.id || i} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                          <div className="text-sm font-medium text-zinc-300 mb-1">{note.title}</div>
                          <div className="text-xs text-zinc-500">{note.description}</div>
                          {note.codeExample && (
                            <pre className="mt-2 bg-zinc-900 p-2 rounded text-xs text-zinc-400 overflow-x-auto">
                              {note.codeExample}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {hints.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleSection('hints')}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Hints ({revealedHints}/{hints.length})
                    </button>
                    {revealedHints < hints.length && (
                      <Button variant="ghost" size="sm" onClick={revealNextHint}>
                        Reveal
                      </Button>
                    )}
                  </div>
                  {expandedSections.has('hints') && revealedHints > 0 && (
                    <div className="space-y-2">
                      {hints.slice(0, revealedHints).map((hint, i) => (
                        <div
                          key={hint.id || i}
                          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-500 font-mono text-sm">Hint {i + 1}:</span>
                            <span className="text-sm text-yellow-200">{hint.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button onClick={startCoding} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Coding
              </Button>
            </div>
          )}

          {(phase === 'coding' || phase === 'testing' || phase === 'completed') && (
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400 border border-zinc-700/50">
                <div className="font-medium text-zinc-300 mb-1">Problem:</div>
                {exercise.description.split('\n').slice(0, 3).join('\n')}
                {exercise.description.split('\n').length > 3 && '...'}
              </div>

              <div className="h-[300px]">
                <CodeEditor
                  expectedCode={exercise.solution || ''}
                  currentCode={userCode}
                  language={exercise.language}
                  mode={phase === 'completed' ? 'read' : 'write'}
                  onChange={(code) => setUserCode(code)}
                  showGhostText={false}
                  highlightErrors={false}
                  className="h-full"
                />
              </div>

              <div className="flex gap-2">
                {phase === 'coding' && (
                  <Button onClick={runTests} className="flex-1">
                    <ListChecks className="w-4 h-4 mr-2" />
                    Run Tests
                  </Button>
                )}
                {phase === 'testing' && (
                  <Button variant="secondary" onClick={() => setPhase('coding')} className="flex-1">
                    Continue Coding
                  </Button>
                )}
                {phase === 'completed' && (
                  <Button onClick={resetProblem} variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>

              {testStates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-zinc-400">Test Results:</div>
                  {testStates.map((test, i) => (
                    <div
                      key={test.id}
                      className={cn(
                        'rounded-lg p-3 border',
                        test.passed === null && 'bg-zinc-800/30 border-zinc-700',
                        test.passed === true && 'bg-green-500/10 border-green-500/30',
                        test.passed === false && 'bg-red-500/10 border-red-500/30',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {test.passed === null && (
                          <Clock className="w-4 h-4 text-zinc-500" />
                        )}
                        {test.passed === true && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {test.passed === false && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-zinc-300">
                          Test {i + 1}: {test.description}
                        </span>
                        {test.isHidden && <EyeOff className="w-3 h-3 text-zinc-600" />}
                      </div>
                      {test.passed !== null && (
                        <div className="text-xs font-mono mt-1">
                          <span className="text-zinc-500">Expected: </span>
                          <span className="text-zinc-400">{test.expected}</span>
                          {test.passed === false && (
                            <>
                              <br />
                              <span className="text-zinc-500">Actual: </span>
                              <span className="text-red-400">{test.actual}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {phase === 'completed' && exercise.explanation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-400">Solution Explanation</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSolution(!showSolution)}
                    >
                      {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showSolution ? ' Hide' : ' Show'}
                    </Button>
                  </div>
                  {showSolution && (
                    <>
                      <div className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-400 border border-zinc-700/50">
                        <pre className="whitespace-pre-wrap">{exercise.solution}</pre>
                      </div>
                      <div 
                        className="bg-blue-500/10 rounded-lg p-4 text-sm text-blue-200 border border-blue-500/30"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(exercise.explanation) }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2 border-t border-zinc-700">
          <div className="flex items-center justify-between w-full">
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

export default GuidedProblem;