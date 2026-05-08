import { create } from 'zustand';
import { Exercise, ProgrammingLanguage, DifficultyLevel, ExerciseCategory, ExerciseType } from '@/types';

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
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise[]> => {
  try {
    const response = await fetch('/content/exercises/all.json');
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    let exercises = data.exercises || [];
    
    if (language) {
      exercises = exercises.filter((e: Exercise) => e.language === language);
    }
    if (level) {
      exercises = exercises.filter((e: Exercise) => e.level === level);
    }
    
    return exercises;
  } catch {
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
    const { cache, languageFilter, levelFilter, typeFilter, searchQuery } = get();
    const lang = language || undefined;
    const lvl = level || undefined;
    const cacheKey = `${lang || 'all'}-${lvl || 'all'}`;
    
    // Verificar cache primero
    if (isCacheValid(cache, cacheKey)) {
      const cached = cache[cacheKey].data;
      const langFilter = languageFilter || language || null;
      const lvlFilter = levelFilter || level || null;
      const filtered = applyFilters(cached, langFilter, lvlFilter, null, typeFilter, searchQuery);
      set({
        allExercises: cached,
        filteredExercises: filtered,
        isLoading: false,
        hasLoadedInitial: true,
        languageFilter: langFilter,
        levelFilter: lvlFilter,
      });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const loaded = await fetchFromRepo(language, level);
      
      const reflexSnippets = loaded.filter(e => e.exerciseType === 'reflex-typing');
      const guidedProblems = loaded.filter(e => e.exerciseType === 'guided-problem');
      
      const newCache = {
        ...cache,
        [cacheKey]: { data: loaded, timestamp: Date.now() },
      };
      
      const langF = languageFilter || language || null;
      const lvlF = levelFilter || level || null;
      const filtered = applyFilters(
        loaded,
        langF,
        lvlF,
        null,
        typeFilter,
        searchQuery
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
        languageFilter: langF,
        levelFilter: lvlF,
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
  setLanguageFilter: (language) => {
    set({ languageFilter: language });
    get().applyFilters();
  },

  setLevelFilter: (level) => {
    set({ levelFilter: level });
    get().applyFilters();
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
      const loaded = await fetchFromRepo(languageFilter || undefined, nextLevel);
      
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