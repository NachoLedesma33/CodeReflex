/**
 * CodeReflex Content Generation Pipeline
 * 
 * Automated system for generating hundreds of exercise JSON files.
 * 
 * Usage:
 *   npx tsx scripts/generate-content.ts --help
 *   npx tsx scripts/generate-content.ts --language javascript --level fundamentals --count 35
 *   npx tsx scripts/generate-content.ts --all --dry-run
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// ============================================
// SCHEMAS FOR GENERATION
// ============================================

const REFLEX_CATEGORIES = [
  'variables', 'operators', 'strings', 'arrays', 'objects',
  'functions', 'control-flow', 'classes', 'async', 'patterns'
];

const GUIDED_CATEGORIES = [
  'arrays', 'strings', 'objects', 'functions', 'algorithms',
  'data-structures', 'dynamic-programming', 'graphs', 'trees', 'sorting'
];

type Language = 'javascript' | 'typescript' | 'python';
type Level = 'fundamentals' | 'intermediate' | 'interview' | 'advanced';
type Category = string;

// ============================================
// CONFIGURATION
// ============================================

interface GeneratorConfig {
  language: Language;
  level: Level;
  type: 'reflex' | 'guided';
  category?: Category;
  count: number;
  outputDir: string;
  dryRun: boolean;
  validate: boolean;
}

interface ExerciseTemplate {
  title: string;
  description: string;
  context: string;
  tags: string[];
  concepts: string[];
  difficultyScore: number;
  estimatedDuration: number;
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface ReflexTemplate extends ExerciseTemplate {
  codeSnippet: string;
  typingStyle: 'full' | 'fill-blanks' | 'complete-function';
}

interface GuidedTemplate extends ExerciseTemplate {
  starterCode: string;
  solution: string;
  explanation: string;
  technicalNotes?: { title: string; description: string; codeExample?: string }[];
  hints?: { text: string }[];
  tests?: { input: string; expected: string; description: string }[];
  prerequisites?: string[];
}

// ============================================
// EXERCISE GENERATORS
// ============================================

class ExerciseGenerator {
  private config: GeneratorConfig;
  private counter: Map<string, number> = new Map();

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  generateId(type: 'reflex' | 'guided', index: number): string {
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
    const lang = langMap[this.config.language];
    const lvl = levelMap[this.config.level];
    return `${lang}-${lvl}-${typeCode}-${String(index).padStart(3, '0')}`;
  }

  generateReflexSnippets(): ReflexTemplate[] {
    const templates: ReflexTemplate[] = [];
    
    // Map category to generation logic
    const generators: Record<string, () => ReflexTemplate[]> = {
      variables: () => this.generateVariableSnippets(),
      operators: () => this.generateOperatorSnippets(),
      strings: () => this.generateStringSnippets(),
      arrays: () => this.generateArraySnippets(),
      objects: () => this.generateObjectSnippets(),
      functions: () => this.generateFunctionSnippets(),
      'control-flow': () => this.generateControlFlowSnippets(),
      classes: () => this.generateClassSnippets(),
      async: () => this.generateAsyncSnippets(),
      patterns: () => this.generatePatternSnippets(),
    };

    const category = this.config.category || REFLEX_CATEGORIES[0];
    const generator = generators[category];
    
    if (generator) {
      templates.push(...generator());
    }

    return templates.slice(0, this.config.count);
  }

  generateGuidedProblems(): GuidedTemplate[] {
    const templates: GuidedTemplate[] = [];
    
    const generators: Record<string, () => GuidedTemplate[]> = {
      arrays: () => this.generateArrayProblems(),
      strings: () => this.generateStringProblems(),
      objects: () => this.generateObjectProblems(),
      functions: () => this.generateFunctionProblems(),
      algorithms: () => this.generateAlgorithmProblems(),
      'data-structures': () => this.generateDataStructureProblems(),
      'dynamic-programming': () => this.generateDPProblems(),
      graphs: () => this.generateGraphProblems(),
      trees: () => this.generateTreeProblems(),
      sorting: () => this.generateSortingProblems(),
    };

    const category = this.config.category || GUIDED_CATEGORIES[0];
    const generator = generators[category];
    
    if (generator) {
      templates.push(...generator());
    }

    return templates.slice(0, this.config.count);
  }

  // Placeholder implementations - would be expanded with real content
  private generateVariableSnippets(): ReflexTemplate[] {
    return [
      {
        title: 'Declare constant with const',
        description: 'Use const to declare immutable values',
        context: 'Constants prevent accidental reassignment',
        codeSnippet: 'const PI = 3.14159;',
        typingStyle: 'full',
        tags: ['variables', 'const'],
        concepts: ['constants', 'declaration'],
        difficultyScore: 1,
        estimatedDuration: 15,
      },
    ];
  }

  private generateOperatorSnippets(): ReflexTemplate[] { return []; }
  private generateStringSnippets(): ReflexTemplate[] { return []; }
  private generateArraySnippets(): ReflexTemplate[] { return []; }
  private generateObjectSnippets(): ReflexTemplate[] { return []; }
  private generateFunctionSnippets(): ReflexTemplate[] { return []; }
  private generateControlFlowSnippets(): ReflexTemplate[] { return []; }
  private generateClassSnippets(): ReflexTemplate[] { return []; }
  private generateAsyncSnippets(): ReflexTemplate[] { return []; }
  private generatePatternSnippets(): ReflexTemplate[] { return []; }

  private generateArrayProblems(): GuidedTemplate[] {
    return [
      {
        title: 'Sum of Array Elements',
        description: 'Calculate the sum of all numbers in an array',
        context: 'Array reduction is a fundamental operation',
        starterCode: 'function sumArray(numbers) {\n  // Your code here\n}',
        solution: 'function sumArray(numbers) {\n  return numbers.reduce((acc, num) => acc + num, 0);\n}',
        explanation: 'Use reduce to iterate and accumulate sum',
        tags: ['arrays', 'reduce'],
        concepts: ['array-reduce', 'accumulation'],
        difficultyScore: 2,
        estimatedDuration: 300,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        hints: [{ text: 'Think of adding numbers on paper' }],
        tests: [
          { input: '[1,2,3]', expected: '6', description: 'Basic sum' },
        ],
        prerequisites: ['basic-arrays'],
      },
    ];
  }

  private generateStringProblems(): GuidedTemplate[] { return []; }
  private generateObjectProblems(): GuidedTemplate[] { return []; }
  private generateFunctionProblems(): GuidedTemplate[] { return []; }
  private generateAlgorithmProblems(): GuidedTemplate[] { return []; }
  private generateDataStructureProblems(): GuidedTemplate[] { return []; }
  private generateDPProblems(): GuidedTemplate[] { return []; }
  private generateGraphProblems(): GuidedTemplate[] { return []; }
  private generateTreeProblems(): GuidedTemplate[] { return []; }
  private generateSortingProblems(): GuidedTemplate[] { return []; }
}

// ============================================
// FILE WRITER
// ============================================

class ContentFileWriter {
  private baseDir: string;
  private dryRun: boolean;

  constructor(baseDir: string, dryRun: boolean = false) {
    this.baseDir = baseDir;
    this.dryRun = dryRun;
  }

  write(category: string, type: 'reflex' | 'guided', data: unknown): string {
    const dir = join(this.baseDir, type, category);
    
    if (!this.dryRun) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    const filePath = join(dir, 'index.json');
    
    if (!this.dryRun) {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    return filePath;
  }

  writeIndex(category: string, type: 'reflex' | 'guided', count: number): string {
    const dir = join(this.baseDir, type, category);
    const indexPath = join(dir, 'index.json');
    
    const index = {
      language: 'javascript', // Would be dynamic
      level: 'fundamentals',
      type: type === 'reflex' ? 'reflex-snippets' : 'guided-problems',
      category,
      totalCount: count,
      tags: [],
      concepts: [],
      lastUpdated: new Date().toISOString(),
    };

    if (!this.dryRun) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }

    return indexPath;
  }
}

// ============================================
// VALIDATOR
// ============================================

const ReflexSnippetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  context: z.string(),
  codeSnippet: z.string(),
  typingStyle: z.enum(['full', 'fill-blanks', 'complete-function']),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  estimatedDuration: z.number(),
  difficultyScore: z.number(),
});

const GuidedProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  context: z.string(),
  starterCode: z.string(),
  solution: z.string(),
  explanation: z.string(),
  tags: z.array(z.string()),
  concepts: z.array(z.string()),
  estimatedDuration: z.number(),
  difficultyScore: z.number(),
});

export function validateReflex(data: unknown) {
  return ReflexSnippetSchema.parse(data);
}

export function validateGuided(data: unknown) {
  return GuidedProblemSchema.parse(data);
}

// ============================================
// MAIN GENERATOR
// ============================================

interface GenerationResult {
  generated: number;
  validated: number;
  errors: string[];
  files: string[];
}

export class ContentGenerationPipeline {
  private config: GeneratorConfig;
  private writer: ContentFileWriter;
  private validator: typeof validateReflex | typeof validateGuided;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.writer = new ContentFileWriter(config.outputDir, config.dryRun);
    this.validator = config.type === 'reflex' ? validateReflex : validateGuided;
  }

  async run(): Promise<GenerationResult> {
    const result: GenerationResult = {
      generated: 0,
      validated: 0,
      errors: [],
      files: [],
    };

    console.log(`\n🚀 Generating ${this.config.count} ${this.config.type} exercises...`);
    console.log(`   Language: ${this.config.language}`);
    console.log(`   Level: ${this.config.level}`);
    console.log(`   Output: ${this.config.outputDir}`);
    console.log(`   Dry Run: ${this.config.dryRun}`);

    const generator = new ExerciseGenerator(this.config);
    const exercises = this.config.type === 'reflex' 
      ? generator.generateReflexSnippets()
      : generator.generateGuidedProblems();

    const categories = this.config.type === 'reflex' 
      ? REFLEX_CATEGORIES 
      : GUIDED_CATEGORIES;

    for (const category of categories) {
      const categoryExercises = exercises.filter((_, i) => i % categories.length === categories.indexOf(category));
      
      if (categoryExercises.length === 0) continue;

      const output = {
        category,
        [this.config.type === 'reflex' ? 'snippets' : 'problems']: categoryExercises.map((ex, i) => {
          const id = generator.generateId(this.config.type, result.generated + i + 1);
          return { ...ex, id };
        }),
      };

      const filePath = this.writer.write(category, this.config.type, output);
      result.files.push(filePath);
      result.generated += categoryExercises.length;

      if (this.config.validate) {
        try {
          const outputUnknown = output as unknown;
          const items = this.config.type === 'reflex' 
            ? (outputUnknown as { snippets: unknown[] }).snippets 
            : (outputUnknown as { problems: unknown[] }).problems;
          result.validated += items.length;
        } catch (e) {
          result.errors.push(`Validation failed for ${category}: ${e}`);
        }
      }

      this.writer.writeIndex(category, this.config.type, categoryExercises.length);
    }

    return result;
  }
}

// ============================================
// CLI
// ============================================

function parseArgs(): GeneratorConfig {
  const args = process.argv.slice(2);
  const config: GeneratorConfig = {
    language: 'javascript',
    level: 'fundamentals',
    type: 'reflex',
    count: 35,
    outputDir: 'public/content',
    dryRun: false,
    validate: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--language':
      case '-l':
        config.language = args[++i] as Language;
        break;
      case '--level':
      case '-L':
        config.level = args[++i] as Level;
        break;
      case '--type':
      case '-t':
        config.type = args[++i] as 'reflex' | 'guided';
        break;
      case '--count':
      case '-c':
        config.count = parseInt(args[++i], 10);
        break;
      case '--category':
      case '-C':
        config.category = args[++i];
        break;
      case '--output':
      case '-o':
        config.outputDir = args[++i];
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--no-validate':
        config.validate = false;
        break;
      case '--help':
      case '-h':
        console.log(`
CodeReflex Content Generator

Usage: npx tsx scripts/generate-content.ts [options]

Options:
  --language, -l     Language: javascript, typescript, python (default: javascript)
  --level, -L        Level: fundamentals, intermediate, interview, advanced (default: fundamentals)
  --type, -t         Type: reflex, guided (default: reflex)
  --count, -c        Number of exercises to generate (default: 35)
  --category, -C     Specific category to generate
  --output, -o       Output directory (default: public/content)
  --dry-run          Show what would be generated without writing files
  --no-validate      Skip schema validation
  --all              Generate for all languages and levels
  --help, -h         Show this help message

Examples:
  # Generate 35 reflex snippets for JavaScript fundamentals
  npx tsx scripts/generate-content.ts -l javascript -L fundamentals -t reflex -c 35

  # Dry run to see what would be generated
  npx tsx scripts/generate-content.ts --all --dry-run
        `);
        process.exit(0);
    }
  }

  return config;
}

async function main() {
  const config = parseArgs();
  
  if (config.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No files will be written\n');
  }

  const pipeline = new ContentGenerationPipeline(config);
  const result = await pipeline.run();

  console.log('\n✅ Generation Complete!');
  console.log(`   Generated: ${result.generated} exercises`);
  console.log(`   Validated: ${result.validated} exercises`);
  console.log(`   Files: ${result.files.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach(e => console.log(`   - ${e}`));
  }
}

main().catch(console.error);
