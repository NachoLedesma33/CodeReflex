// ============================================
// ENUMS Y TIPOS BÁSICOS
// ============================================

export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java';

export type DifficultyLevel = 'fundamentals' | 'intermediate' | 'interview' | 'advanced';

export type ExerciseType = 'reflex-typing' | 'guided-problem';

export type TypingStyle = 'full' | 'fill-blanks' | 'complete-function';

export type ExerciseCategory = 
  | 'arrays'
  | 'strings'
  | 'objects'
  | 'functions'
  | 'loops'
  | 'browser-api'
  | 'classes'
  | 'algorithms'
  | 'data-structures'
  | 'async'
  | 'state-management'
  | 'data-processing'
  | 'architecture'
  | 'performance'
  | 'functional-programming'
  | 'patterns'
  | 'system-design'
  | 'api-design'
  | 'concurrency'
  | 'security'
  | 'distributed-systems'
  | 'databases'
  | 'monitoring'
  | 'infrastructure'
  | 'automation'
  | 'validation'
  | 'runtime-systems'
  | 'realtime'
  | 'backend-architecture'
  | 'microservices'
  | 'authentication'
  | 'search'
  | 'cloud-architecture'
  | 'resilience'
  | 'testing';

// ============================================
// INTERFACES DE EJERCICIOS
// ============================================

export interface BlankPosition {
  start: number;
  end: number;
  hint?: string;
  expectedValue: string;
}

export interface ExerciseTestCase {
  id: string;
  input: string;
  expected: string;
  description: string;
  isHidden?: boolean;
}

export interface ExerciseHint {
  id: string;
  text: string;
  order: number;
}

export interface TechnicalNote {
  id: string;
  title: string;
  description: string;
  codeExample?: string;
}

export interface TechnicalExplanation {
  overview: string;
  stepByStep: string[];
  keyConcepts: string[];
  commonMistakes: string[];
  alternativeApproaches: string[];
  realWorldUseCases: string[];
}

export interface Exercise {
  // Identificación
  id: string;
  
  // Clasificación
  language: ProgrammingLanguage;
  level: DifficultyLevel;
  exerciseType: ExerciseType;
  category: ExerciseCategory;
  
  // Contenido
  title: string;
  description: string;
  context: string;
  
  // Metadatos
  tags: string[];
  concepts: string[];
  prerequisites: string[];
  
  // Reflex Typing
  typingStyle?: TypingStyle;
  codeSnippet?: string;
  blanks?: BlankPosition[];
  
  // Guided Problem
  solution?: string;
  explanation?: string;
  technicalNotes?: TechnicalNote[];
  hints?: ExerciseHint[];
  tests?: ExerciseTestCase[];
  
  // Complejidad
  timeComplexity?: string;
  spaceComplexity?: string;
  estimatedDuration: number;
  difficultyScore: number;
}

// ============================================
// INTERFACES DE PROGRESO
// ============================================

export interface TypingAttempt {
  id: string;
  exerciseId: string;
  startTime: number;
  endTime: number;
  typedText: string;
  errorsByPosition: Record<number, string>;
  correctionsCount: number;
  finalAccuracy: number;
  wpm: number;
}

export interface ExerciseStats {
  exerciseId: string;
  attempts: number;
  bestWpm: number;
  bestAccuracy: number;
  averageTime: number;
  completedAt?: string;
  lastAttemptAt: string;
}

export interface CommonMistake {
  pattern: string;
  count: number;
  description: string;
  suggestion?: string;
}

export interface UserProgress {
  exercisesCompleted: number;
  totalAttempts: number;
  bestWpmByLanguage: Record<ProgrammingLanguage, number>;
  bestAccuracyByLanguage: Record<ProgrammingLanguage, number>;
  streaks: {
    current: number;
    longest: number;
    lastCompletedDate?: string;
  };
  lastActive: string;
  totalTypingTime: number;
  commonMistakes: CommonMistake[];
  exerciseStats: Record<string, ExerciseStats>;
}

// ============================================
// LOGROS Y GAMIFICACIÓN
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'streak' | 'volume' | 'language';
  xpReward: number;
  requirement: number;
  unlockedAt?: string;
}

export interface XPLevel {
  level: number;
  title: string;
  xpRequired: number;
  totalXP: number;
}

// ============================================
// RESULTADOS DE EJECUCIÓN
// ============================================

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  testResults?: TestResult[];
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actual: string;
  expected: string;
  executionTime?: number;
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

export interface ExerciseFilters {
  language?: ProgrammingLanguage;
  level?: DifficultyLevel;
  exerciseType?: ExerciseType;
  category?: ExerciseCategory;
  tags?: string[];
  completed?: boolean;
  favorites?: boolean;
}

export interface ExerciseIndex {
  languages: ProgrammingLanguage[];
  levels: DifficultyLevel[];
  categories: ExerciseCategory[];
  totalCount: number;
  byLanguage: Record<ProgrammingLanguage, number>;
  byLevel: Record<DifficultyLevel, number>;
}

export interface TypingMetrics {
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