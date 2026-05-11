'use client';

import { useState, useMemo, useEffect } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgrammingLanguage, DifficultyLevel, ExerciseType, Exercise, ExerciseCategory } from '@/types';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Shuffle,
  Star,
  StarOff,
  CheckCircle2,
  Circle,
  Play,
  BookOpen,
  Keyboard,
  TrendingUp,
  RefreshCw,
  Filter,
  X,
  Search,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onSelectExercise?: (exercise: Exercise) => void;
}

const LANGUAGES: { value: ProgrammingLanguage; label: string; icon: string }[] = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
];

const LEVELS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'fundamentals', label: 'Fundamentals', color: 'text-green-400 bg-green-500/20' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-400 bg-yellow-500/20' },
  { value: 'interview', label: 'Interview', color: 'text-orange-400 bg-orange-500/20' },
  { value: 'advanced', label: 'Advanced', color: 'text-red-400 bg-red-500/20' },
];

const MODES: { value: ExerciseType; label: string; icon: React.ReactNode }[] = [
  { value: 'reflex-typing', label: 'Reflex Typing', icon: <Keyboard className="w-4 h-4" /> },
  { value: 'guided-problem', label: 'Guided Problem', icon: <BookOpen className="w-4 h-4" /> },
];

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'algorithms', label: 'Algorithms' },
  { value: 'api-design', label: 'API Design' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'arrays', label: 'Arrays' },
  { value: 'async', label: 'Async' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'automation', label: 'Automation' },
  { value: 'backend-architecture', label: 'Backend Arch' },
  { value: 'browser-api', label: 'Browser API' },
  { value: 'classes', label: 'Classes' },
  { value: 'cloud-architecture', label: 'Cloud Arch' },
  { value: 'concurrency', label: 'Concurrency' },
  { value: 'databases', label: 'Databases' },
  { value: 'data-processing', label: 'Data Processing' },
  { value: 'data-structures', label: 'Data Structures' },
  { value: 'distributed-systems', label: 'Distributed Sys' },
  { value: 'functional-programming', label: 'FP' },
  { value: 'functions', label: 'Functions' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'loops', label: 'Loops' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'objects', label: 'Objects' },
  { value: 'patterns', label: 'Patterns' },
  { value: 'performance', label: 'Performance' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'resilience', label: 'Resilience' },
  { value: 'runtime-systems', label: 'Runtime Systems' },
  { value: 'search', label: 'Search' },
  { value: 'security', label: 'Security' },
  { value: 'state-management', label: 'State Mgmt' },
  { value: 'strings', label: 'Strings' },
  { value: 'system-design', label: 'System Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'validation', label: 'Validation' },
];

export function Sidebar({ className, onSelectExercise }: SidebarProps) {
  const {
    allExercises,
    filteredExercises,
    currentExercise,
    currentIndex,
    languageFilter,
    levelFilter,
    categoryFilter,
    setLanguageFilter,
    setLevelFilter,
    setCategoryFilter,
    setSearchQuery,
    getRandomExercise,
    applyFilters,
  } = useExerciseStore();

  const {
    completedExercises,
    favoriteExercises,
    isFavorite,
    toggleFavorite,
    isCompleted,
    getExerciseStats,
  } = useProgressStore();

  const { mode, setMode } = useUIStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [searchQueryLocal, setSearchQueryLocal] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['filters', 'favorites', 'list'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSearch = () => {
    setSearchQuery(searchQueryLocal);
  };

  const favoritesList = useMemo(() => {
    return filteredExercises.filter(ex => isFavorite(ex.id));
  }, [filteredExercises, isFavorite]);

  const recommendations = useMemo(() => {
    return filteredExercises
      .filter(ex => !isCompleted(ex.id))
      .slice(0, 5);
  }, [filteredExercises, isCompleted]);

  const progressByLevel = useMemo(() => {
    const result: Record<DifficultyLevel, { completed: number; total: number }> = {
      fundamentals: { completed: 0, total: 0 },
      intermediate: { completed: 0, total: 0 },
      interview: { completed: 0, total: 0 },
      advanced: { completed: 0, total: 0 },
    };

    filteredExercises.forEach(ex => {
      result[ex.level].total++;
      if (isCompleted(ex.id)) {
        result[ex.level].completed++;
      }
    });

    return result;
  }, [filteredExercises, isCompleted]);

  const currentLevelInfo = languageFilter && levelFilter
    ? progressByLevel[levelFilter]
    : null;

  if (isCollapsed) {
    return (
      <div className={cn('w-12 h-full bg-zinc-900 border-r border-zinc-800', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="w-full h-12"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('w-80 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col', className)}>
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Explorer</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={getRandomExercise}
            className="p-1.5"
            title="Random Exercise"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQueryLocal}
              onChange={(e) => setSearchQueryLocal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 pl-9 pr-8 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQueryLocal && (
              <button
                onClick={() => {
                  setSearchQueryLocal('');
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => toggleSection('filters')}
              className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 hover:text-zinc-300"
            >
              <span className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filters
              </span>
              {expandedSections.has('filters') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.has('filters') && (
              <div className="space-y-3 pl-1">
                <div className="space-y-1.5">
                  <div className="text-xs text-zinc-600">Language</div>
                  <div className="flex flex-wrap gap-1">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguageFilter(languageFilter === lang.value ? null : lang.value)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          languageFilter === lang.value
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
                        )}
                      >
                        {lang.icon} {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-zinc-600">Difficulty</div>
                  <div className="flex flex-wrap gap-1">
                    {LEVELS.map(level => (
                      <button
                        key={level.value}
                        onClick={() => setLevelFilter(levelFilter === level.value ? null : level.value)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          levelFilter === level.value
                            ? level.color
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
                        )}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-zinc-600">Mode</div>
                  <div className="flex gap-1">
                    {MODES.map(m => (
                      <button
                        key={m.value}
                        onClick={() => setMode(m.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors',
                          mode === m.value
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
                        )}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-zinc-600">Category</div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {(() => {
                      // Obtenemos todas las categorías disponibles para el nivel actual (ignorando el filtro de categoría)
                      const availableCategories = [...new Set(
                        allExercises
                          .filter(e => e.language === languageFilter && e.level === levelFilter)
                          .map(e => e.category)
                          .filter(Boolean)
                      )] as string[];

                      const visibleCategories = CATEGORIES.filter(cat => availableCategories.includes(cat.value));
                      
                      return visibleCategories.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setCategoryFilter(categoryFilter === cat.value ? null : cat.value)}
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-md transition-colors',
                            categoryFilter === cat.value
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
                          )}
                        >
                          {cat.label}
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {(languageFilter || levelFilter || categoryFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLanguageFilter(null);
                      setLevelFilter(null);
                      setCategoryFilter(null);
                    }}
                    className="w-full text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {currentLevelInfo && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  {levelFilter || 'All'} Progress
                </span>
                <span className="text-zinc-400">
                  {currentLevelInfo.completed}/{currentLevelInfo.total}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    width: `${currentLevelInfo.total > 0 ? (currentLevelInfo.completed / currentLevelInfo.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => toggleSection('favorites')}
              className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 hover:text-zinc-300"
            >
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Favorites ({favoritesList.length})
              </span>
              {expandedSections.has('favorites') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.has('favorites') && (
              <div className="space-y-1">
                {favoritesList.length > 0 ? (
                  favoritesList.slice(0, 5).map(exercise => (
                    <ExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      isActive={currentExercise?.id === exercise.id}
                      isCompleted={isCompleted(exercise.id)}
                      stats={getExerciseStats(exercise.id)}
                      onClick={() => onSelectExercise?.(exercise)}
                      onToggleFavorite={() => toggleFavorite(exercise.id)}
                    />
                  ))
                ) : (
                  <div className="text-xs text-zinc-600 italic p-2">
                    No favorites yet
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => toggleSection('recommendations')}
              className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 hover:text-zinc-300"
            >
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Recommended
              </span>
              {expandedSections.has('recommendations') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.has('recommendations') && (
              <div className="space-y-1">
                {recommendations.map(exercise => (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    isActive={currentExercise?.id === exercise.id}
                    isCompleted={isCompleted(exercise.id)}
                    stats={getExerciseStats(exercise.id)}
                    onClick={() => onSelectExercise?.(exercise)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => toggleSection('list')}
              className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 hover:text-zinc-300"
            >
              <span className="flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                All Exercises ({filteredExercises.length})
              </span>
              {expandedSections.has('list') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.has('list') && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {!categoryFilter && languageFilter && levelFilter ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Zap className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500">Selecciona una categoría para ver los ejercicios</p>
                  </div>
                ) : (
                  filteredExercises.map((exercise, index) => (
                    <ExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      index={index + 1}
                      isActive={currentExercise?.id === exercise.id}
                      isCompleted={isCompleted(exercise.id)}
                      stats={getExerciseStats(exercise.id)}
                      onClick={() => onSelectExercise?.(exercise)}
                      onToggleFavorite={() => toggleFavorite(exercise.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-zinc-800">
        <Button
          variant="secondary"
          className="w-full"
          onClick={getRandomExercise}
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Random Exercise
        </Button>
      </div>
    </div>
  );
}

interface ExerciseItemProps {
  exercise: Exercise;
  index?: number;
  isActive: boolean;
  isCompleted: boolean;
  stats: ReturnType<typeof useProgressStore.getState>['exerciseStats'][string] | null;
  onClick: () => void;
  onToggleFavorite?: () => void;
}

function ExerciseItem({
  exercise,
  index,
  isActive,
  isCompleted,
  stats,
  onClick,
  onToggleFavorite,
}: ExerciseItemProps) {
  const levelColor = LEVELS.find(l => l.value === exercise.level)?.color || '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full text-left p-2 rounded-lg transition-colors group cursor-pointer',
        isActive ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-zinc-800/50'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-zinc-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {index && (
              <span className="text-[10px] text-zinc-600">{index}.</span>
            )}
            <span className={cn(
              'text-xs font-medium truncate',
              isActive ? 'text-blue-400' : 'text-zinc-300'
            )}>
              {exercise.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn('px-1.5 py-0.5 text-[10px] rounded', levelColor)}>
              {exercise.level.slice(0, 4)}
            </span>
            <span className="text-[10px] text-zinc-600">
              {exercise.category}
            </span>
            {stats && stats.bestWpm > 0 && (
              <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                {stats.bestWpm}
              </span>
            )}
          </div>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
          >
            <StarOff className="w-3 h-3 text-zinc-500 hover:text-yellow-500" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;