import { ProgrammingLanguage, DifficultyLevel } from '@/types';
import { 
  ReflexSnippet, 
  GuidedProblem, 
  ContentIndex, 
  GlobalContentIndex,
  validateReflexSnippet,
  validateGuidedProblem,
  validateContentIndex,
  GlobalContentIndexSchema
} from './contentSchema';

interface ContentCache {
  [key: string]: {
    data: ReflexSnippet[] | GuidedProblem[] | ContentIndex | GlobalContentIndex;
    timestamp: number;
  };
}

interface ReflexFileContent {
  metadata: {
    language: string;
    mode: string;
    version: string;
    lastUpdated: string;
    totalExercises: number;
  };
  exercises: ReflexSnippet[];
}

const CACHE_TTL = 5 * 60 * 1000;
const CONTENT_BASE = '/content';

const contentCache: ContentCache = {};

const LANGUAGE_FILE_MAP: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  python: 'PY',
  java: 'JV',
};

export class ContentLoader {
  private static instance: ContentLoader;
  private cache: ContentCache = {};

  private constructor() {}

  static getInstance(): ContentLoader {
    if (!ContentLoader.instance) {
      ContentLoader.instance = new ContentLoader();
    }
    return ContentLoader.instance;
  }

  private getCacheKey(language: ProgrammingLanguage, level: DifficultyLevel, type: 'reflex' | 'guided'): string {
    return `${language}-${level}-${type}`;
  }

  private isCacheValid(key: string): boolean {
    const entry = this.cache[key];
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
  }

  private getReflexFileName(language: ProgrammingLanguage, level: DifficultyLevel): string {
    const suffix = LANGUAGE_FILE_MAP[language] || 'JS';
    return `${level}${suffix}.json`;
  }

  async loadReflexSnippets(
    language: ProgrammingLanguage, 
    level: DifficultyLevel
  ): Promise<ReflexSnippet[]> {
    const key = this.getCacheKey(language, level, 'reflex');
    
    if (this.isCacheValid(key)) {
      return this.cache[key].data as ReflexSnippet[];
    }

    try {
      const fileName = this.getReflexFileName(language, level);
      const url = `${CONTENT_BASE}/reflex/${language}/${fileName}`;
      console.log('[ContentLoader] Loading reflex from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`No file found for ${language}/${level}/reflex: ${fileName}, returning empty array`);
        return [];
      }

      const fileData: ReflexFileContent[] = await response.json();
      const snippets: ReflexSnippet[] = [];

      for (const file of fileData) {
        if (file.exercises) {
          const fileLang = (file.metadata.language as ProgrammingLanguage) || language;
          const fileLevel = (level as DifficultyLevel); // El nivel viene del argumento ya que el archivo es nivel-específico

          for (const exercise of file.exercises) {
            const snippet: any = {
              ...exercise,
              language: fileLang,
              level: fileLevel,
              exerciseType: 'reflex-typing',
              category: exercise.category || 'general',
            };
            snippets.push(snippet as ReflexSnippet);
          }
        }
      }

      this.cache[key] = { data: snippets, timestamp: Date.now() };
      return snippets;
    } catch (error) {
      console.error('Error loading reflex snippets:', error);
      return [];
    }
  }

  async loadGuidedProblems(
    language: ProgrammingLanguage, 
    level: DifficultyLevel
  ): Promise<GuidedProblem[]> {
    const key = this.getCacheKey(language, level, 'guided');
    
    if (this.isCacheValid(key)) {
      return this.cache[key].data as GuidedProblem[];
    }

    try {
      // Guided problems not yet implemented - skip silently
      console.log('[ContentLoader] Guided problems not available yet, skipping');
      return [];
    } catch (error) {
      console.error('Error loading guided problems:', error);
      return [];
    }
  }

  async loadAllContent(): Promise<{
    reflexSnippets: ReflexSnippet[];
    guidedProblems: GuidedProblem[];
  }> {
    const languages: ProgrammingLanguage[] = ['javascript', 'typescript', 'python'];
    const levels: DifficultyLevel[] = ['fundamentals', 'intermediate', 'interview', 'advanced'];

    const allReflex: ReflexSnippet[] = [];
    const allGuided: GuidedProblem[] = [];

    for (const lang of languages) {
      for (const level of levels) {
        const [reflex, guided] = await Promise.all([
          this.loadReflexSnippets(lang, level),
          this.loadGuidedProblems(lang, level),
        ]);
        allReflex.push(...reflex);
        allGuided.push(...guided);
      }
    }

    return {
      reflexSnippets: allReflex,
      guidedProblems: allGuided,
    };
  }

  async loadGlobalIndex(): Promise<GlobalContentIndex | null> {
    const key = 'global-index';
    
    if (this.isCacheValid(key)) {
      return this.cache[key].data as GlobalContentIndex;
    }

    try {
      const response = await fetch(`${CONTENT_BASE}/index.json`);
      if (!response.ok) return null;
      
      const index = GlobalContentIndexSchema.parse(await response.json());
      this.cache[key] = { data: index, timestamp: Date.now() };
      return index;
    } catch {
      return null;
    }
  }

  clearCache(): void {
    this.cache = {};
  }

  preload(language: ProgrammingLanguage, level: DifficultyLevel): void {
    this.loadReflexSnippets(language, level);
    this.loadGuidedProblems(language, level);
  }
}

export const contentLoader = ContentLoader.getInstance();

export default contentLoader;