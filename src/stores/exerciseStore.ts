import { create } from 'zustand';
import { Exercise, ProgrammingLanguage, DifficultyLevel, ExerciseCategory, ExerciseType } from '@/types';
import { contentLoader } from '@/lib/contentLoader';

interface ExerciseCache {
  [key: string]: {
    data: Exercise[];
    timestamp: number;
  };
}

interface ExerciseState {
  // Datos separados por tipo
  reflexSnippets: Exercise[];
  guidedProblems: Exercise[];
  allExercises: Exercise[];
  filteredExercises: Exercise[];
  
  // Ejercicio actual
  currentExercise: Exercise | null;
  currentIndex: number;
  currentType: ExerciseType;
  
  // Estado de carga
  isLoading: boolean;
  isLoadingReflex: boolean;
  isLoadingGuided: boolean;
  error: string | null;
  
  // Filtros activos
  languageFilter: ProgrammingLanguage | null;
  levelFilter: DifficultyLevel | null;
  categoryFilter: ExerciseCategory | null;
  typeFilter: ExerciseType | null;
  searchQuery: string;
  
  // Cache
  cache: ExerciseCache;
  hasLoadedInitial: boolean;
  loadedCombinations: Set<string>;
  
  // Acciones - Carga
  loadExercises: (language?: ProgrammingLanguage, level?: DifficultyLevel) => Promise<void>;
  loadReflexSnippets: (language?: ProgrammingLanguage, level?: DifficultyLevel) => Promise<void>;
  loadGuidedProblems: (language?: ProgrammingLanguage, level?: DifficultyLevel) => Promise<void>;
  
  // Acciones - Navegación
  setCurrentExercise: (exercise: Exercise) => void;
  setCurrentById: (id: string) => Promise<void>;
  getNextExercise: () => void;
  getPreviousExercise: () => void;
  getRandomExercise: () => void;
  setCurrentType: (type: ExerciseType) => void;
  
  // Acciones - Filtros
  setLanguageFilter: (language: ProgrammingLanguage | null) => void;
  setLevelFilter: (level: DifficultyLevel | null) => void;
  setCategoryFilter: (category: ExerciseCategory | null) => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
  
  // Acciones - Cache
  preloadNextDifficulty: () => Promise<void>;
  clearCache: () => void;
  getCacheKey: (language?: ProgrammingLanguage, level?: DifficultyLevel) => string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const EXERCISE_TYPES: ExerciseType[] = ['reflex-typing', 'guided-problem'];
const DIFFICULTY_ORDER: DifficultyLevel[] = ['fundamentals', 'intermediate', 'interview', 'advanced'];

const applyFilters = (
  exercises: Exercise[],
  language: ProgrammingLanguage | null,
  level: DifficultyLevel | null,
  category: ExerciseCategory | null,
  type: ExerciseType | null,
  search: string
): Exercise[] => {
  return exercises.filter(ex => {
    if (language && ex.language !== language) return false;
    if (level && ex.level !== level) return false;
    if (category && ex.category !== category) return false;
    if (type && ex.exerciseType !== type) return false;
    if (search) {
      const query = search.toLowerCase();
      const matchesSearch = 
        ex.title.toLowerCase().includes(query) ||
        ex.description.toLowerCase().includes(query) ||
        ex.tags.some(t => t.toLowerCase().includes(query)) ||
        ex.concepts.some(c => c.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    return true;
  });
};

const isCacheValid = (cache: ExerciseCache, key: string): boolean => {
  const entry = cache[key];
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
};

const fetchFromRepo = async (
  language: ProgrammingLanguage,
  level: DifficultyLevel
): Promise<Exercise[]> => {
  try {
    const lang = language;
    const lvl = level;
    
    const reflexSnippets = await contentLoader.loadReflexSnippets(lang as ProgrammingLanguage, lvl as DifficultyLevel);
    const guidedProblems = await contentLoader.loadGuidedProblems(lang as ProgrammingLanguage, lvl as DifficultyLevel);
    
    const reflexExercises: Exercise[] = reflexSnippets.map(snippet => ({
      id: snippet.id,
      language: lang as ProgrammingLanguage,
      level: lvl as DifficultyLevel,
      exerciseType: 'reflex-typing' as ExerciseType,
      category: (snippet.category || snippet.tags?.[0] || 'general') as ExerciseCategory,
      title: snippet.title,
      description: snippet.description,
      context: snippet.context || '',
      tags: snippet.tags || [],
      concepts: snippet.concepts || [],
      prerequisites: [],
      codeSnippet: snippet.codeSnippet,
      typingStyle: snippet.typingStyle,
      blanks: snippet.blanks,
      estimatedDuration: snippet.estimatedDuration,
      difficultyScore: snippet.difficultyScore,
    }));
    
    const guidedExercises: Exercise[] = guidedProblems.map(problem => ({
      id: problem.id,
      language: lang as ProgrammingLanguage,
      level: lvl as DifficultyLevel,
      exerciseType: 'guided-problem' as ExerciseType,
      category: (problem.category || problem.tags?.[0] || 'general') as ExerciseCategory,
      title: problem.title,
      description: problem.description,
      context: problem.context || '',
      tags: problem.tags || [],
      concepts: problem.concepts || [],
      prerequisites: problem.prerequisites || [],
      solution: problem.solution,
      explanation: problem.explanation,
      technicalNotes: problem.technicalNotes,
      hints: problem.hints,
      tests: problem.tests,
      estimatedDuration: problem.estimatedDuration,
      difficultyScore: problem.difficultyScore,
      timeComplexity: problem.timeComplexity,
      spaceComplexity: problem.spaceComplexity,
    }));
    
    return [...reflexExercises, ...guidedExercises];
  } catch (error) {
    console.error('Error loading exercises:', error);
    return [];
  }
};

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  // Initial state
  reflexSnippets: [],
  guidedProblems: [],
  allExercises: [],
  filteredExercises: [],
  currentExercise: null,
  currentIndex: 0,
  currentType: 'reflex-typing',
  isLoading: false,
  isLoadingReflex: false,
  isLoadingGuided: false,
  error: null,
  languageFilter: null,
  levelFilter: null,
  categoryFilter: null,
  typeFilter: null,
  searchQuery: '',
  cache: {},
  hasLoadedInitial: false,
  loadedCombinations: new Set(),

  // === FUNCIONES DE CARGA ===
  getCacheKey: (language?: ProgrammingLanguage, level?: DifficultyLevel): string => {
    return `${language || 'all'}-${level || 'all'}`;
  },

  loadExercises: async (language?: ProgrammingLanguage, level?: DifficultyLevel) => {
    const state = get();
    const lang = language || state.languageFilter || 'javascript';
    const lvl = level || state.levelFilter || 'fundamentals';
    const cacheKey = `${lang}-${lvl}`;
    
    // Verificar cache primero
    if (isCacheValid(state.cache, cacheKey)) {
      const cached = state.cache[cacheKey].data;
      const filtered = applyFilters(cached, lang, lvl, null, state.typeFilter, state.searchQuery);
      set({
        allExercises: cached,
        filteredExercises: filtered,
        isLoading: false,
        hasLoadedInitial: true,
        languageFilter: lang,
        levelFilter: lvl,
      });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const loaded = await fetchFromRepo(lang, lvl);
      
      const reflexSnippets = loaded.filter(e => e.exerciseType === 'reflex-typing');
      const guidedProblems = loaded.filter(e => e.exerciseType === 'guided-problem');
      
      const newCache = {
        ...state.cache,
        [cacheKey]: { data: loaded, timestamp: Date.now() },
      };
      
      const filtered = applyFilters(
        loaded,
        lang,
        lvl,
        null,
        state.typeFilter,
        state.searchQuery
      );

      const newLoadedCombinations = new Set(get().loadedCombinations);
      newLoadedCombinations.add(cacheKey);

      set({
        allExercises: loaded,
        reflexSnippets,
        guidedProblems,
        filteredExercises: filtered,
        cache: newCache,
        isLoading: false,
        hasLoadedInitial: true,
        languageFilter: lang,
        levelFilter: lvl,
        loadedCombinations: newLoadedCombinations,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load exercises',
      });
    }
  },

  loadReflexSnippets: async (language?: ProgrammingLanguage, level?: DifficultyLevel) => {
    const { isLoadingReflex, cache } = get();
    if (isLoadingReflex) return;
    
    const lang = language || undefined;
    const lvl = level || undefined;
    const cacheKey = `reflex-${lang || 'all'}-${lvl || 'all'}`;
    
    if (isCacheValid(cache, cacheKey)) {
      const cached = cache[cacheKey].data;
      set({ reflexSnippets: cached, isLoadingReflex: false });
      return;
    }

    set({ isLoadingReflex: true });
    
    try {
      const loaded = await fetchFromRepo(language, level);
      const reflexSnippets = loaded.filter(e => e.exerciseType === 'reflex-typing');
      
      set({
        cache: {
          ...cache,
          [cacheKey]: { data: reflexSnippets, timestamp: Date.now() },
        },
        reflexSnippets,
        isLoadingReflex: false,
      });
    } catch {
      set({ isLoadingReflex: false });
    }
  },

  loadGuidedProblems: async (language?: ProgrammingLanguage, level?: DifficultyLevel) => {
    const { isLoadingGuided, cache } = get();
    if (isLoadingGuided) return;
    
    const lang = language || undefined;
    const lvl = level || undefined;
    const cacheKey = `guided-${lang || 'all'}-${lvl || 'all'}`;
    
    if (isCacheValid(cache, cacheKey)) {
      const cached = cache[cacheKey].data;
      set({ guidedProblems: cached, isLoadingGuided: false });
      return;
    }

    set({ isLoadingGuided: true });
    
    try {
      const loaded = await fetchFromRepo(language, level);
      const guidedProblems = loaded.filter(e => e.exerciseType === 'guided-problem');
      
      set({
        cache: {
          ...cache,
          [cacheKey]: { data: guidedProblems, timestamp: Date.now() },
        },
        guidedProblems,
        isLoadingGuided: false,
      });
    } catch {
      set({ isLoadingGuided: false });
    }
  },

  // === NAVEGACIÓN ===
  setCurrentExercise: (exercise) => {
    const index = get().filteredExercises.findIndex(e => e.id === exercise.id);
    set({
      currentExercise: exercise,
      currentIndex: index >= 0 ? index : 0,
      currentType: exercise.exerciseType,
    });
  },

  setCurrentById: async (id) => {
    const { allExercises } = get();
    const exercise = allExercises.find(e => e.id === id);
    if (exercise) {
      get().setCurrentExercise(exercise);
    }
  },

  getNextExercise: () => {
    const { filteredExercises, currentIndex } = get();
    if (filteredExercises.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % filteredExercises.length;
    set({
      currentExercise: filteredExercises[nextIndex],
      currentIndex: nextIndex,
      currentType: filteredExercises[nextIndex].exerciseType,
    });
  },

  getPreviousExercise: () => {
    const { filteredExercises, currentIndex } = get();
    if (filteredExercises.length === 0) return;
    
    const prevIndex = (currentIndex - 1 + filteredExercises.length) % filteredExercises.length;
    set({
      currentExercise: filteredExercises[prevIndex],
      currentIndex: prevIndex,
      currentType: filteredExercises[prevIndex].exerciseType,
    });
  },

  getRandomExercise: () => {
    const { filteredExercises } = get();
    if (filteredExercises.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * filteredExercises.length);
    set({
      currentExercise: filteredExercises[randomIndex],
      currentIndex: randomIndex,
      currentType: filteredExercises[randomIndex].exerciseType,
    });
  },

  setCurrentType: (type) => {
    set({ currentType: type });
    get().applyFilters();
  },

  // === FILTROS ===
  setLanguageFilter: async (language) => {
    set({ languageFilter: language, isLoading: true });
    get().applyFilters();
    await get().loadExercises(language || undefined, undefined);
    set({ isLoading: false });
  },

  setLevelFilter: async (level) => {
    set({ levelFilter: level, isLoading: true });
    get().applyFilters();
    await get().loadExercises(undefined, level || undefined);
    set({ isLoading: false });
  },

  setCategoryFilter: (category) => {
    set({ categoryFilter: category });
    get().applyFilters();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  applyFilters: () => {
    const { 
      allExercises, 
      languageFilter, 
      levelFilter, 
      categoryFilter, 
      typeFilter, 
      searchQuery 
    } = get();
    
    const filtered = applyFilters(
      allExercises,
      languageFilter,
      levelFilter,
      categoryFilter,
      typeFilter,
      searchQuery
    );
    
    set({
      filteredExercises: filtered,
      currentExercise: filtered[0] || get().currentExercise,
      currentIndex: 0,
    });
  },

  // === CACHE ===
  preloadNextDifficulty: async () => {
    const { levelFilter, languageFilter, loadedCombinations } = get();
    
    if (!levelFilter) return;
    
    const currentLevelIndex = DIFFICULTY_ORDER.indexOf(levelFilter);
    if (currentLevelIndex >= DIFFICULTY_ORDER.length - 1) return;
    
    const nextLevel = DIFFICULTY_ORDER[currentLevelIndex + 1];
    const lang = languageFilter || undefined;
    const cacheKey = `${lang || 'all'}-${nextLevel}`;
    
    if (loadedCombinations.has(cacheKey)) return;
    
    try {
      const lang = languageFilter || 'javascript';
      const loaded = await fetchFromRepo(lang, nextLevel);
      
      set(state => ({
        cache: {
          ...state.cache,
          [cacheKey]: { data: loaded, timestamp: Date.now() },
        },
        loadedCombinations: new Set([...state.loadedCombinations, cacheKey]),
      }));
    } catch {
      // Silently fail preload
    }
  },

  clearCache: () => {
    set({
      cache: {},
      allExercises: [],
      reflexSnippets: [],
      guidedProblems: [],
      filteredExercises: [],
      currentExercise: null,
      loadedCombinations: new Set(),
    });
  },
}));