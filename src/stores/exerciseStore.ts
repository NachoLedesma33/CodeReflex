import { create } from 'zustand';
import { Exercise, ProgrammingLanguage, DifficultyLevel, ExerciseCategory } from '@/types';
import { loadExercisesByFilter, loadExerciseById, clearExerciseCache } from '@/lib/exerciseRepository';

interface ExerciseState {
  // Datos
  exercises: Exercise[];
  filteredExercises: Exercise[];
  currentExercise: Exercise | null;
  currentIndex: number;
  
  // Estado de carga
  isLoading: boolean;
  error: string | null;
  
  // Filtros activos
  languageFilter: ProgrammingLanguage | null;
  levelFilter: DifficultyLevel | null;
  categoryFilter: ExerciseCategory | null;
  searchQuery: string;
  
  // Cache
  hasLoadedInitial: boolean;
  
  // Acciones
  loadExercises: (language?: ProgrammingLanguage, level?: DifficultyLevel) => Promise<void>;
  setCurrentExercise: (exercise: Exercise) => void;
  setCurrentById: (id: string) => Promise<void>;
  getNextExercise: () => void;
  getPreviousExercise: () => void;
  setLanguageFilter: (language: ProgrammingLanguage | null) => void;
  setLevelFilter: (level: DifficultyLevel | null) => void;
  setCategoryFilter: (category: ExerciseCategory | null) => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
  clearCache: () => void;
}

const applyFilters = (
  exercises: Exercise[],
  language: ProgrammingLanguage | null,
  level: DifficultyLevel | null,
  category: ExerciseCategory | null,
  search: string
): Exercise[] => {
  return exercises.filter(ex => {
    if (language && ex.language !== language) return false;
    if (level && ex.level !== level) return false;
    if (category && ex.category !== category) return false;
    if (search) {
      const query = search.toLowerCase();
      const matchesSearch = 
        ex.title.toLowerCase().includes(query) ||
        ex.description.toLowerCase().includes(query) ||
        ex.tags.some(t => t.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    return true;
  });
};

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  filteredExercises: [],
  currentExercise: null,
  currentIndex: 0,
  isLoading: false,
  error: null,
  languageFilter: null,
  levelFilter: null,
  categoryFilter: null,
  searchQuery: '',
  hasLoadedInitial: false,

  loadExercises: async (language?: ProgrammingLanguage, level?: DifficultyLevel) => {
    set({ isLoading: true, error: null });
    
    try {
      const loaded = await loadExercisesByFilter(language, level);
      const { languageFilter, levelFilter, categoryFilter, searchQuery } = get();
      
      const filtered = applyFilters(
        loaded,
        languageFilter || language || null,
        levelFilter || level || null,
        categoryFilter,
        searchQuery
      );

      set({
        exercises: loaded,
        filteredExercises: filtered,
        isLoading: false,
        hasLoadedInitial: true,
        languageFilter: languageFilter || language || null,
        levelFilter: levelFilter || level || null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load exercises',
      });
    }
  },

  setCurrentExercise: (exercise) => {
    const index = get().filteredExercises.findIndex(e => e.id === exercise.id);
    set({
      currentExercise: exercise,
      currentIndex: index >= 0 ? index : 0,
    });
  },

  setCurrentById: async (id) => {
    const exercise = await loadExerciseById(id);
    if (exercise) {
      get().setCurrentExercise(exercise);
    }
  },

  getNextExercise: () => {
    const { filteredExercises, currentIndex } = get();
    if (filteredExercises.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % filteredExercises.length;
    set({ currentExercise: filteredExercises[nextIndex], currentIndex: nextIndex });
  },

  getPreviousExercise: () => {
    const { filteredExercises, currentIndex } = get();
    if (filteredExercises.length === 0) return;
    
    const prevIndex = (currentIndex - 1 + filteredExercises.length) % filteredExercises.length;
    set({ currentExercise: filteredExercises[prevIndex], currentIndex: prevIndex });
  },

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
    const { exercises, languageFilter, levelFilter, categoryFilter, searchQuery } = get();
    const filtered = applyFilters(exercises, languageFilter, levelFilter, categoryFilter, searchQuery);
    set({
      filteredExercises: filtered,
      currentExercise: filtered[0] || null,
      currentIndex: 0,
    });
  },

  clearCache: () => {
    clearExerciseCache();
    set({ exercises: [], filteredExercises: [], currentExercise: null });
  },
}));