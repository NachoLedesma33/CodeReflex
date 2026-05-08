import { Exercise, ProgrammingLanguage, DifficultyLevel, ExerciseType, ExerciseIndex } from '@/types';
import { validateReflexArray, validateGuidedArray, checkForDuplicates } from './exerciseSchema';

const CONTENT_BASE_PATH = '/content/exercises';

interface ContentCache {
  [key: string]: {
    data: Exercise[] | null;
    index: ExerciseIndex | null;
    timestamp: number;
    error?: string;
  };
}

interface LoaderStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
}

class ContentLoader {
  private cache: ContentCache = {};
  private loadingPromises: Map<string, Promise<Exercise[]>> = new Map();
  private stats: LoaderStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 50;

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getCacheKey(language?: ProgrammingLanguage, level?: DifficultyLevel, type?: ExerciseType): string {
    const lang = language || 'all';
    const lvl = level || 'all';
    const t = type || 'all';
    return `${lang}-${lvl}-${t}`;
  }

  private isCacheValid(key: string): boolean {
    const entry = this.cache[key];
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private getCacheSize(): number {
    return Object.keys(this.cache).length;
  }

  private evictOldestEntry(): void {
    const keys = Object.keys(this.cache);
    if (keys.length >= this.MAX_CACHE_SIZE) {
      let oldestKey = keys[0];
      let oldestTime = this.cache[keys[0]].timestamp;
      
      for (const key of keys) {
        if (this.cache[key].timestamp < oldestTime) {
          oldestTime = this.cache[key].timestamp;
          oldestKey = key;
        }
      }
      
      delete this.cache[oldestKey];
    }
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.json();
  }

  private separateByType(exercises: Exercise[]): { reflex: Exercise[]; guided: Exercise[] } {
    const reflex = exercises.filter(e => e.exerciseType === 'reflex-typing');
    const guided = exercises.filter(e => e.exerciseType === 'guided-problem');
    return { reflex, guided };
  }

  private async loadFromFile(
    language?: ProgrammingLanguage,
    level?: DifficultyLevel
  ): Promise<Exercise[]> {
    try {
      const url = `${CONTENT_BASE_PATH}/all.json`;
      const data = await this.fetchJSON<{ exercises: Exercise[] }>(url);
      
      let filtered = data.exercises || [];
      
      if (language) {
        filtered = filtered.filter(e => e.language === language);
      }
      if (level) {
        filtered = filtered.filter(e => e.level === level);
      }
      
      // Validar schema
      try {
        if (filtered.some(e => e.exerciseType === 'reflex-typing')) {
          validateReflexArray(filtered.filter(e => e.exerciseType === 'reflex-typing'));
        }
        if (filtered.some(e => e.exerciseType === 'guided-problem')) {
          validateGuidedArray(filtered.filter(e => e.exerciseType === 'guided-problem'));
        }
      } catch (validationError) {
        console.warn('Schema validation warning:', validationError);
      }

      // Verificar duplicados
      const duplicates = checkForDuplicates(filtered);
      if (duplicates.hasDuplicates) {
        console.warn('Duplicate exercise IDs found:', duplicates.duplicateIds);
      }

      return filtered;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  async fetchExercises(
    language?: ProgrammingLanguage,
    level?: DifficultyLevel
  ): Promise<Exercise[]> {
    this.stats.totalRequests++;
    const cacheKey = this.getCacheKey(language, level);

    // Verificar cache
    if (this.isCacheValid(cacheKey) && this.cache[cacheKey].data) {
      this.stats.cacheHits++;
      return this.cache[cacheKey].data!;
    }

    // Verificar si ya hay una petición en curso
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    this.stats.cacheMisses++;

    // Crear promesa de carga
    const loadPromise = this.loadFromFile(language, level)
      .then(data => {
        // Guardar en cache
        if (this.getCacheSize() >= this.MAX_CACHE_SIZE) {
          this.evictOldestEntry();
        }
        
        this.cache[cacheKey] = {
          data,
          index: null,
          timestamp: Date.now(),
        };
        
        this.loadingPromises.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.loadingPromises.delete(cacheKey);
        
        // Guardar error en cache para no reintentar inmediatamente
        this.cache[cacheKey] = {
          data: null,
          index: null,
          timestamp: Date.now(),
          error: error.message,
        };
        
        throw error;
      });

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  async fetchReflexSnippets(
    language?: ProgrammingLanguage,
    level?: DifficultyLevel
  ): Promise<Exercise[]> {
    const exercises = await this.fetchExercises(language, level);
    return exercises.filter(e => e.exerciseType === 'reflex-typing');
  }

  async fetchGuidedProblems(
    language?: ProgrammingLanguage,
    level?: DifficultyLevel
  ): Promise<Exercise[]> {
    const exercises = await this.fetchExercises(language, level);
    return exercises.filter(e => e.exerciseType === 'guided-problem');
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    // Primero buscar en cache
    for (const entry of Object.values(this.cache)) {
      if (entry.data) {
        const found = entry.data.find(e => e.id === id);
        if (found) return found;
      }
    }

    // Si no está en cache, cargar todo
    const allExercises = await this.fetchExercises();
    return allExercises.find(e => e.id === id) || null;
  }

  async getRandomExercise(
    language?: ProgrammingLanguage,
    level?: DifficultyLevel
  ): Promise<Exercise | null> {
    const exercises = await this.fetchExercises(language, level);
    if (exercises.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * exercises.length);
    return exercises[randomIndex];
  }

  async getExerciseByType(
    type: ExerciseType,
    language?: ProgrammingLanguage,
    level?: DifficultyLevel
  ): Promise<Exercise | null> {
    const exercises = await this.fetchExercises(language, level);
    const filtered = exercises.filter(e => e.exerciseType === type);
    
    if (filtered.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  getAllLanguages(): ProgrammingLanguage[] {
    return ['javascript', 'typescript', 'python'];
  }

  getAllLevels(): DifficultyLevel[] {
    return ['fundamentals', 'intermediate', 'interview', 'advanced'];
  }

  async getIndex(): Promise<ExerciseIndex> {
    const cacheKey = 'global-index';
    
    if (this.cache[cacheKey]?.index) {
      return this.cache[cacheKey].index!;
    }

    try {
      const data = await this.fetchJSON<{ index: ExerciseIndex }>(`${CONTENT_BASE_PATH}/index.json`);
      
      this.cache[cacheKey] = {
        data: null,
        index: data.index,
        timestamp: Date.now(),
      };
      
      return data.index;
    } catch {
      // Return default index if fetch fails
      return {
        languages: this.getAllLanguages(),
        levels: this.getAllLevels(),
        categories: [],
        totalCount: 0,
        byLanguage: { javascript: 0, typescript: 0, python: 0 },
        byLevel: { fundamentals: 0, intermediate: 0, interview: 0, advanced: 0 },
      };
    }
  }

  async preloadContent(
    language: ProgrammingLanguage,
    levels?: DifficultyLevel[]
  ): Promise<void> {
    const targetLevels = levels || this.getAllLevels();
    
    // Preload current and next level
    const currentIndex = targetLevels.indexOf('fundamentals');
    const levelsToPreload = [
      targetLevels[currentIndex],
      targetLevels[currentIndex + 1],
    ].filter(Boolean);

    const promises = levelsToPreload.map(level => 
      this.fetchExercises(language, level).catch(() => null)
    );

    await Promise.all(promises);
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  invalidateCache(language?: ProgrammingLanguage, level?: DifficultyLevel): void {
    if (language && level) {
      const key = this.getCacheKey(language, level);
      delete this.cache[key];
    } else if (language) {
      // Invalidar todas las combinaciones con este language
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith(language)) {
          delete this.cache[key];
        }
      });
    } else {
      // Invalidar todo
      this.cache = {};
    }
  }

  clearAllCache(): void {
    this.cache = {};
    this.loadingPromises.clear();
  }

  getCacheStatus(): {
    size: number;
    keys: string[];
    stats: LoaderStats;
  } {
    return {
      size: this.getCacheSize(),
      keys: Object.keys(this.cache),
      stats: { ...this.stats },
    };
  }

  // ============================================
  // SEARCH AND FILTER
  // ============================================

  async searchExercises(
    query: string,
    options?: {
      language?: ProgrammingLanguage;
      level?: DifficultyLevel;
      type?: ExerciseType;
      tags?: string[];
    }
  ): Promise<Exercise[]> {
    const exercises = await this.fetchExercises(options?.language, options?.level);
    
    const searchLower = query.toLowerCase();
    
    return exercises.filter(ex => {
      // Search in title and description
      const matchesQuery = 
        ex.title.toLowerCase().includes(searchLower) ||
        ex.description.toLowerCase().includes(searchLower) ||
        ex.context.toLowerCase().includes(searchLower);
      
      // Filter by type
      const matchesType = !options?.type || ex.exerciseType === options.type;
      
      // Filter by tags
      const matchesTags = !options?.tags?.length || 
        ex.tags.some(tag => options.tags!.includes(tag));
      
      return matchesQuery && matchesType && matchesTags;
    });
  }

  async getExercisesByTag(
    tag: string,
    language?: ProgrammingLanguage
  ): Promise<Exercise[]> {
    const exercises = await this.fetchExercises(language);
    return exercises.filter(ex => 
      ex.tags.includes(tag) || ex.concepts.includes(tag)
    );
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const contentLoader = new ContentLoader();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const fetchExercises = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise[]> => contentLoader.fetchExercises(language, level);

export const fetchReflexSnippets = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise[]> => contentLoader.fetchReflexSnippets(language, level);

export const fetchGuidedProblems = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise[]> => contentLoader.fetchGuidedProblems(language, level);

export const getExerciseById = (id: string): Promise<Exercise | null> => 
  contentLoader.getExerciseById(id);

export const getRandomExercise = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise | null> => contentLoader.getRandomExercise(language, level);

export const getRandomReflex = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise | null> => contentLoader.getExerciseByType('reflex-typing', language, level);

export const getRandomGuided = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise | null> => contentLoader.getExerciseByType('guided-problem', language, level);

export const getAllLanguages = (): ProgrammingLanguage[] => contentLoader.getAllLanguages();

export const getAllLevels = (): DifficultyLevel[] => contentLoader.getAllLevels();

export const searchExercises = (
  query: string,
  options?: {
    language?: ProgrammingLanguage;
    level?: DifficultyLevel;
    type?: ExerciseType;
    tags?: string[];
  }
): Promise<Exercise[]> => contentLoader.searchExercises(query, options);

export const preloadContent = (
  language: ProgrammingLanguage,
  levels?: DifficultyLevel[]
): Promise<void> => contentLoader.preloadContent(language, levels);

export const invalidateCache = (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): void => contentLoader.invalidateCache(language, level);

export const getCacheStatus = () => contentLoader.getCacheStatus();