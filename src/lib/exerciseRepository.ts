import { Exercise, ExerciseIndex, ProgrammingLanguage, DifficultyLevel, ExerciseCategory } from '@/types';

const EXERCISES_BASE_PATH = '/content/exercises';

interface ExercisesResponse {
  exercises: Exercise[];
  index: ExerciseIndex;
}

const exerciseCache: Map<string, Exercise[]> = new Map();
let cachedIndex: ExerciseIndex | null = null;

const fetchFromJSON = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.json();
};

export const loadExerciseIndex = async (): Promise<ExerciseIndex> => {
  if (cachedIndex) return cachedIndex;
  
  try {
    const data = await fetchFromJSON<{ index: ExerciseIndex }>(`${EXERCISES_BASE_PATH}/index.json`);
    cachedIndex = data.index;
    return data.index;
  } catch {
    return {
      languages: ['javascript', 'typescript', 'python'],
      levels: ['fundamentals', 'intermediate', 'interview', 'advanced'],
      categories: ['arrays', 'strings', 'objects', 'functions'],
      totalCount: 0,
      byLanguage: { javascript: 0, typescript: 0, python: 0, java: 0 },
      byLevel: { fundamentals: 0, intermediate: 0, interview: 0, advanced: 0 },
    };
  }
};

export const loadExercisesByFilter = async (
  language?: ProgrammingLanguage,
  level?: DifficultyLevel
): Promise<Exercise[]> => {
  const cacheKey = `${language || 'all'}-${level || 'all'}`;
  
  if (exerciseCache.has(cacheKey)) {
    return exerciseCache.get(cacheKey)!;
  }

  try {
    const allData = await fetchFromJSON<ExercisesResponse>(`${EXERCISES_BASE_PATH}/all.json`);
    let exercises = allData.exercises;

    if (language) {
      exercises = exercises.filter(e => e.language === language);
    }
    if (level) {
      exercises = exercises.filter(e => e.level === level);
    }

    exerciseCache.set(cacheKey, exercises);
    return exercises;
  } catch {
    return [];
  }
};

export const loadExerciseById = async (id: string): Promise<Exercise | null> => {
  const exercises = await loadExercisesByFilter();
  return exercises.find(e => e.id === id) || null;
};

export const getAvailableLanguages = (): ProgrammingLanguage[] => ['javascript', 'typescript', 'python'];
export const getAvailableLevels = (): DifficultyLevel[] => {
  return ['fundamentals', 'intermediate', 'interview', 'advanced'];
};
export const getAvailableCategories = (): ExerciseCategory[] => [
  'arrays', 'strings', 'objects', 'functions', 'classes',
  'algorithms', 'data-structures', 'async', 'patterns', 'testing'
];

export const getExerciseCount = async (): Promise<number> => {
  const index = await loadExerciseIndex();
  return index.totalCount;
};

export const getExercisesByCategory = async (category: ExerciseCategory): Promise<Exercise[]> => {
  const exercises = await loadExercisesByFilter();
  return exercises.filter(e => e.category === category);
};

export const clearExerciseCache = (): void => {
  exerciseCache.clear();
  cachedIndex = null;
};

export const searchExercises = async (
  query: string,
  filters?: { language?: ProgrammingLanguage; level?: DifficultyLevel }
): Promise<Exercise[]> => {
  const exercises = await loadExercisesByFilter(filters?.language, filters?.level);
  const lowerQuery = query.toLowerCase();
  
  return exercises.filter(e => 
    e.title.toLowerCase().includes(lowerQuery) ||
    e.description.toLowerCase().includes(lowerQuery) ||
    e.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
    e.concepts.some(c => c.toLowerCase().includes(lowerQuery))
  );
};