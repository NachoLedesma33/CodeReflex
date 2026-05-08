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

const CACHE_TTL = 5 * 60 * 1000;
const CONTENT_BASE = '/content';

const contentCache: ContentCache = {};

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

  async loadReflexSnippets(
    language: ProgrammingLanguage, 
    level: DifficultyLevel
  ): Promise<ReflexSnippet[]> {
    const key = this.getCacheKey(language, level, 'reflex');
    
    if (this.isCacheValid(key)) {
      return this.cache[key].data as ReflexSnippet[];
    }

    try {
      const response = await fetch(
        `${CONTENT_BASE}/reflex-snippets/${language}/${level}/index.json`
      );
      
      if (!response.ok) {
        console.warn(`No index found for ${language}/${level}/reflex, returning empty array`);
        return [];
      }

      const index = validateContentIndex(await response.json());
      const snippets: ReflexSnippet[] = [];

      for (const tag of index.tags) {
        try {
          const tagResponse = await fetch(
            `${CONTENT_BASE}/reflex-snippets/${language}/${level}/${tag}.json`
          );
          if (tagResponse.ok) {
            const data = await tagResponse.json();
            const validated = data.snippets.map(validateReflexSnippet);
            snippets.push(...validated);
          }
        } catch (e) {
          console.warn(`Failed to load tag ${tag}:`, e);
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
      const response = await fetch(
        `${CONTENT_BASE}/guided-problems/${language}/${level}/index.json`
      );
      
      if (!response.ok) {
        console.warn(`No index found for ${language}/${level}/guided, returning empty array`);
        return [];
      }

      const index = validateContentIndex(await response.json());
      const problems: GuidedProblem[] = [];

      for (const tag of index.tags) {
        try {
          const tagResponse = await fetch(
            `${CONTENT_BASE}/guided-problems/${language}/${level}/${tag}.json`
          );
          if (tagResponse.ok) {
            const data = await tagResponse.json();
            const validated = data.problems.map(validateGuidedProblem);
            problems.push(...validated);
          }
        } catch (e) {
          console.warn(`Failed to load tag ${tag}:`, e);
        }
      }

      this.cache[key] = { data: problems, timestamp: Date.now() };
      return problems;
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