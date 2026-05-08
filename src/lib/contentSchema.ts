import { z } from 'zod';

export const ReflexSnippetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  context: z.string(),
  codeSnippet: z.string(),
  typingStyle: z.enum(['full', 'fill-blanks', 'complete-function']).default('full'),
  blanks: z.array(z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(1),
    hint: z.string().optional(),
    expectedValue: z.string(),
  })).optional(),
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
  technicalNotes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    codeExample: z.string().optional(),
  })).optional(),
  hints: z.array(z.object({
    id: z.string(),
    text: z.string(),
    order: z.number().int().min(1),
  })).optional(),
  tests: z.array(z.object({
    id: z.string(),
    input: z.string(),
    expected: z.string(),
    description: z.string(),
    isHidden: z.boolean().optional(),
  })).optional(),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  prerequisites: z.array(z.string()),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  estimatedDuration: z.number().int().min(60).max(3600),
  difficultyScore: z.number().min(1).max(10),
});

export const ContentIndexSchema = z.object({
  language: z.enum(['javascript', 'typescript', 'python']),
  level: z.enum(['fundamentals', 'intermediate', 'interview', 'advanced']),
  type: z.enum(['reflex-snippets', 'guided-problems']),
  totalCount: z.number().int().min(0),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  lastUpdated: z.string(),
});

export const GlobalContentIndexSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  languages: z.array(z.enum(['javascript', 'typescript', 'python'])),
  levels: z.array(z.enum(['fundamentals', 'intermediate', 'interview', 'advanced'])),
  types: z.array(z.enum(['reflex-snippets', 'guided-problems'])),
  totalFiles: z.number().int().min(0),
  exercises: z.record(z.string(), z.number().int()),
});

export type ReflexSnippet = z.infer<typeof ReflexSnippetSchema>;
export type GuidedProblem = z.infer<typeof GuidedProblemSchema>;
export type ContentIndex = z.infer<typeof ContentIndexSchema>;
export type GlobalContentIndex = z.infer<typeof GlobalContentIndexSchema>;

export function generateExerciseId(
  language: string,
  level: string,
  type: 'reflex' | 'guided',
  index: number
): string {
  const langMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
  };
  const levelMap: Record<string, string> = {
    fundamentals: 'fund',
    intermediate: 'int',
    interview: 'intv',
    advanced: 'adv',
  };
  const typeCode = type === 'reflex' ? 'rt' : 'gp';
  const lang = langMap[language] || language.slice(0, 2);
  const lvl = levelMap[level] || level.slice(0, 4);
  return `${lang}-${lvl}-${typeCode}-${String(index).padStart(3, '0')}`;
}

export function validateReflexSnippet(data: unknown): ReflexSnippet {
  return ReflexSnippetSchema.parse(data);
}

export function validateGuidedProblem(data: unknown): GuidedProblem {
  return GuidedProblemSchema.parse(data);
}

export function validateContentIndex(data: unknown): ContentIndex {
  return ContentIndexSchema.parse(data);
}

export default {
  ReflexSnippetSchema,
  GuidedProblemSchema,
  ContentIndexSchema,
  GlobalContentIndexSchema,
  generateExerciseId,
  validateReflexSnippet,
  validateGuidedProblem,
  validateContentIndex,
};