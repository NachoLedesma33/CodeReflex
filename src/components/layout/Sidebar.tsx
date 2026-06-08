'use client';

import { useState, useMemo } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useProgressStore } from '@/stores/progressStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { ProgrammingLanguage, DifficultyLevel, ExerciseType, Exercise, ExerciseCategory } from '@/types';
import { cn } from '@/lib/utils';
import { LanguageIcon } from '@/components/ui/LanguageIcon';
import {
  ChevronDown,
  ChevronRight,
  Shuffle,
  Star,
  StarOff,
  CheckCircle2,
  Circle,
  BookOpen,
  Keyboard,
  TrendingUp,
  Filter,
  X,
  Search,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onSelectExercise?: (exercise: Exercise) => void;
}

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
];

const LEVELS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'fundamentals', label: 'Fundamentos', color: 'text-green-400 bg-green-500/20' },
  { value: 'intermediate', label: 'Intermedio', color: 'text-yellow-400 bg-yellow-500/20' },
  { value: 'interview', label: 'Entrevista', color: 'text-orange-400 bg-orange-500/20' },
  { value: 'advanced', label: 'Avanzado', color: 'text-red-400 bg-red-500/20' },
];

const MODES: { value: ExerciseType; label: string; icon: React.ReactNode }[] = [
  { value: 'reflex-typing', label: 'Práctica Reflex', icon: <Keyboard className="w-4 h-4" /> },
  { value: 'guided-problem', label: 'Problema Guiado', icon: <BookOpen className="w-4 h-4" /> },
];

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'variables', label: 'Variables' },
  { value: 'operators', label: 'Operadores' },
  { value: 'control-flow', label: 'Control de Flujo' },
  { value: 'algorithms', label: 'Algoritmos' },
  { value: 'api-design', label: 'Diseño de API' },
  { value: 'architecture', label: 'Arquitectura' },
  { value: 'arrays', label: 'Arrays' },
  { value: 'async', label: 'Async' },
  { value: 'authentication', label: 'Autenticación' },
  { value: 'automation', label: 'Automatización' },
  { value: 'backend-architecture', label: 'Arquitectura Backend' },
  { value: 'browser-api', label: 'API del Navegador' },
  { value: 'classes', label: 'Clases' },
  { value: 'cloud-architecture', label: 'Arquitectura Cloud' },
  { value: 'concurrency', label: 'Concurrencia' },
  { value: 'databases', label: 'Bases de Datos' },
  { value: 'data-processing', label: 'Procesamiento de Datos' },
  { value: 'data-structures', label: 'Estructuras de Datos' },
  { value: 'distributed-systems', label: 'Sistemas Distribuidos' },
  { value: 'functional-programming', label: 'Prog. Funcional' },
  { value: 'functions', label: 'Funciones' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'loops', label: 'Bucles' },
  { value: 'microservices', label: 'Microservicios' },
  { value: 'monitoring', label: 'Monitoreo' },
  { value: 'objects', label: 'Objetos' },
  { value: 'patterns', label: 'Patrones' },
  { value: 'performance', label: 'Rendimiento' },
  { value: 'realtime', label: 'Tiempo Real' },
  { value: 'resilience', label: 'Resiliencia' },
  { value: 'runtime-systems', label: 'Sistemas Runtime' },
  { value: 'search', label: 'Búsqueda' },
  { value: 'security', label: 'Seguridad' },
  { value: 'state-management', label: 'Gestión de Estado' },
  { value: 'strings', label: 'Strings' },
  { value: 'system-design', label: 'Diseño de Sistemas' },
  { value: 'testing', label: 'Testing' },
  { value: 'validation', label: 'Validación' },
];

export function Sidebar({ className, onSelectExercise }: SidebarProps) {
  const {
    allExercises,
    filteredExercises,
    currentExercise,
    languageFilter,
    levelFilter,
    categoryFilter,
    setLanguageFilter,
    setLevelFilter,
    setCategoryFilter,
    setSearchQuery,
    getRandomExercise,
  } = useExerciseStore();

  const {
    isFavorite,
    toggleFavorite,
    isCompleted,
    getExerciseStats,
  } = useProgressStore();

  const { mode, setMode } = useUIStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <div className={cn('w-12 h-full bg-bg-surface border-r border-border', className)}>
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
    <div className={cn('w-80 h-full bg-bg-surface border-r border-border flex flex-col', className)}>
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Explorador</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={getRandomExercise}
            className="p-1.5"
            title="Ejercicio Aleatorio"
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

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar ejercicios..."
              value={searchQueryLocal}
              onChange={(e) => setSearchQueryLocal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-bg-elevated border border-border-strong rounded-md py-2 pl-9 pr-8 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQueryLocal && (
              <button
                onClick={() => {
                  setSearchQueryLocal('');
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => toggleSection('filters')}
              className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              <span className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtros
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
                  <div className="text-xs text-text-muted">Lenguaje</div>
                  <div className="flex flex-wrap gap-1">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguageFilter(languageFilter === lang.value ? null : lang.value)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5',
                          languageFilter === lang.value
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary border border-transparent'
                        )}
                      >
                        <LanguageIcon language={lang.value} size={16} />
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-text-muted">Dificultad</div>
                  <div className="flex flex-wrap gap-1">
                    {LEVELS.map(level => (
                      <button
                        key={level.value}
                        onClick={() => setLevelFilter(levelFilter === level.value ? null : level.value)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          levelFilter === level.value
                            ? level.color
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        )}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-text-muted">Modo</div>
                  <div className="flex gap-1">
                    {MODES.map(m => (
                      <button
                        key={m.value}
                        onClick={() => setMode(m.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors',
                          mode === m.value
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        )}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-text-muted">Categoría</div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
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
                              : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
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
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            )}
          </div>

          {currentLevelInfo && (
            <div className="bg-bg-elevated/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">
                  Progreso {levelFilter || 'Total'}
                </span>
                <span className="text-text-secondary">
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
              className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Favoritos ({favoritesList.length})
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
                  <div className="text-xs text-text-muted italic p-2">
                    Sin favoritos aún
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => toggleSection('recommendations')}
              className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Recomendados
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
              className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              <span className="flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                Todos los Ejercicios ({filteredExercises.length})
              </span>
              {expandedSections.has('list') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.has('list') && (
              <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                {!categoryFilter && languageFilter && levelFilter ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Zap className="w-8 h-8 text-border-strong mb-2" />
                    <p className="text-xs text-text-muted">Selecciona una categoría para ver los ejercicios</p>
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

      <div className="p-3 border-t border-border">
        <Button
          variant="secondary"
          className="w-full"
          onClick={getRandomExercise}
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Ejercicio Aleatorio
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
        isActive ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-bg-elevated/50'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {index && (
              <span className="text-[10px] text-text-muted">{index}.</span>
            )}
            <span className={cn(
              'text-xs font-medium truncate',
              isActive ? 'text-blue-400' : 'text-text-primary'
            )}>
              {exercise.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn('px-1.5 py-0.5 text-[10px] rounded', levelColor)}>
              {exercise.level.slice(0, 4)}
            </span>
            <span className="text-[10px] text-text-muted">
              {exercise.category}
            </span>
            {stats && stats.bestWpm > 0 && (
              <span className="text-[10px] text-text-muted flex items-center gap-0.5">
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
            <StarOff className="w-3 h-3 text-text-muted hover:text-yellow-500" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;