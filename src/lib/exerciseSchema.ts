import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN (Zod)
// ============================================

export const BlankPositionSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(1),
  hint: z.string().optional(),
  expectedValue: z.string(),
});

export const ExerciseTestCaseSchema = z.object({
  id: z.string(),
  input: z.string(),
  expected: z.string(),
  description: z.string(),
  isHidden: z.boolean().optional(),
});

export const ExerciseHintSchema = z.object({
  id: z.string(),
  text: z.string(),
  order: z.number().int().min(1),
});

export const TechnicalNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  codeExample: z.string().optional(),
});

export const ReflexSnippetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  context: z.string(),
  codeSnippet: z.string(),
  typingStyle: z.enum(['full', 'fill-blanks', 'complete-function']).default('full'),
  blanks: BlankPositionSchema.array().optional(),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  estimatedDuration: z.number().int().min(10).max(600),
  difficultyScore: z.number().min(1).max(10),
});

export const GuidedProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  context: z.string(),
  starterCode: z.string(),
  solution: z.string(),
  explanation: z.string(),
  technicalNotes: TechnicalNoteSchema.array().optional(),
  hints: ExerciseHintSchema.array().optional(),
  tests: ExerciseTestCaseSchema.array().optional(),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  prerequisites: z.array(z.string()),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  estimatedDuration: z.number().int().min(60).max(3600),
  difficultyScore: z.number().min(1).max(10),
});

export const ExerciseFileIndexSchema = z.object({
  language: z.enum(['javascript', 'typescript', 'python']),
  level: z.enum(['fundamentals', 'intermediate', 'interview', 'advanced']),
  reflexCount: z.number().int().min(0),
  guidedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  lastUpdated: z.string(),
});

export const GlobalIndexSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  languages: z.array(z.enum(['javascript', 'typescript', 'python'])),
  levels: z.array(z.enum(['fundamentals', 'intermediate', 'interview', 'advanced'])),
  categories: z.array(z.string()),
  totalExercises: z.number().int().min(0),
  totalSnippets: z.number().int().min(0),
  byLanguage: z.record(z.string(), z.number().int()),
  byLevel: z.record(z.string(), z.number().int()),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type ReflexSnippet = z.infer<typeof ReflexSnippetSchema>;
export type GuidedProblem = z.infer<typeof GuidedProblemSchema>;
export type ExerciseFileIndex = z.infer<typeof ExerciseFileIndexSchema>;
export type GlobalIndex = z.infer<typeof GlobalIndexSchema>;

// ============================================
// VALIDACIÓN
// ============================================

export const validateReflexSnippet = (data: unknown): ReflexSnippet => {
  return ReflexSnippetSchema.parse(data);
};

export const validateGuidedProblem = (data: unknown): GuidedProblem => {
  return GuidedProblemSchema.parse(data);
};

export const validateReflexArray = (data: unknown): ReflexSnippet[] => {
  return z.array(ReflexSnippetSchema).parse(data);
};

export const validateGuidedArray = (data: unknown): GuidedProblem[] => {
  return z.array(GuidedProblemSchema).parse(data);
};

// ============================================
// GENERACIÓN DE ID ÚNICO
// ============================================

export const generateExerciseId = (
  language: string,
  level: string,
  type: 'reflex' | 'guided',
  index: number
): string => {
  const lang = language.slice(0, 2).toLowerCase();
  const levelCode = { fundamentals: 'fund', intermediate: 'int', interview: 'intv', advanced: 'adv' };
  const typeCode = type === 'reflex' ? 'rt' : 'gp';
  return `${lang}-${levelCode[level as keyof typeof levelCode]}-${typeCode}-${String(index).padStart(3, '0')}`;
};

// ============================================
// VERIFICACIÓN DE DUPLICADOS
// ============================================

export const checkForDuplicates = (
  exercises: Array<{ id: string }>
): { hasDuplicates: boolean; duplicateIds: string[] } => {
  const ids = exercises.map(e => e.id);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicateIds: duplicates,
  };
};