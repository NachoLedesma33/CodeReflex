'use client';

import { useMemo } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LanguageIcon } from '@/components/ui/LanguageIcon';
import {
  Flame,
  Target,
  Clock,
  Zap,
  Trophy,
  Award,
  BarChart3,
  Calendar,
  Star,
} from 'lucide-react';

interface StatsPanelProps {
  className?: string;
  compact?: boolean;
}

import { Achievement } from '@/types';

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-exercise', name: 'Primeros Pasos', description: 'Completa tu primer ejercicio', icon: '🎯', requirement: 1, category: 'volume', xpReward: 10 },
  { id: 'ten-exercises', name: 'Comenzando', description: 'Completa 10 ejercicios', icon: '🚀', requirement: 10, category: 'volume', xpReward: 50 },
  { id: 'fifty-exercises', name: 'Dedicado', description: 'Completa 50 ejercicios', icon: '💪', requirement: 50, category: 'volume', xpReward: 100 },
  { id: 'wpm-30', name: 'Velocidad Base', description: 'Alcanza 30 WPM', icon: '⚡', requirement: 30, category: 'speed', xpReward: 25 },
  { id: 'wpm-50', name: 'Mecanógrafo Rápido', description: 'Alcanza 50 WPM', icon: '🔥', requirement: 50, category: 'speed', xpReward: 50 },
  { id: 'wpm-80', name: 'Rayo', description: 'Alcanza 80 WPM', icon: '🌩️', requirement: 80, category: 'speed', xpReward: 100 },
  { id: 'accuracy-90', name: 'Precisión', description: 'Logra 90% de precisión', icon: '🎯', requirement: 90, category: 'accuracy', xpReward: 25 },
  { id: 'accuracy-99', name: 'Perfección', description: 'Logra 99% de precisión', icon: '💎', requirement: 99, category: 'accuracy', xpReward: 100 },
  { id: 'streak-3', name: 'Consistente', description: 'Racha de 3 días', icon: '📅', requirement: 3, category: 'streak', xpReward: 30 },
  { id: 'streak-7', name: 'Guerrero Semanal', description: 'Racha de 7 días', icon: '🗓️', requirement: 7, category: 'streak', xpReward: 75 },
  { id: 'streak-30', name: 'Maestro Mensual', description: 'Racha de 30 días', icon: '🏆', requirement: 30, category: 'streak', xpReward: 200 },
  { id: 'js-master', name: 'Ninja JS', description: 'Completa todos los ejercicios de JS', icon: 'javascript', category: 'language', requirement: 0, xpReward: 200 },
  { id: 'ts-master', name: 'Maestro TS', description: 'Completa todos los ejercicios de TS', icon: 'typescript', category: 'language', requirement: 0, xpReward: 200 },
  { id: 'py-master', name: 'Python Pro', description: 'Completa todos los ejercicios de Python', icon: 'python', category: 'language', requirement: 0, xpReward: 200 },
  { id: 'java-master', name: 'Experto Java', description: 'Completa todos los ejercicios de Java', icon: 'java', category: 'language', requirement: 0, xpReward: 200 },
];

export function StatsPanel({ className, compact = false }: StatsPanelProps) {
  const {
    totalExercises,
    totalAttempts,
    currentStreak,
    longestStreak,
    totalTypingTime,
    totalXP,
    bestWpmByLanguage,
    bestAccuracyByLanguage,
    exerciseStats,
  } = useProgressStore();

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const bestOverallWpm = useMemo(() => {
    return Math.max(...Object.values(bestWpmByLanguage), 0);
  }, [bestWpmByLanguage]);

  const bestOverallAccuracy = useMemo(() => {
    const accuracies = Object.values(bestAccuracyByLanguage).filter(a => a > 0);
    if (accuracies.length === 0) return 0;
    return Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
  }, [bestAccuracyByLanguage]);

  const level = (() => {
    const xpThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (totalXP >= xpThresholds[i]) {
        return { level: i + 1, title: getLevelTitle(i + 1), progress: ((totalXP - xpThresholds[i]) / (xpThresholds[i + 1] - xpThresholds[i])) * 100 || 100 };
      }
    }
    return { level: 1, title: 'Novato', progress: (totalXP / 100) * 100 };
  })();

  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(achievement => {
      switch (achievement.category) {
        case 'volume':
          return totalExercises >= achievement.requirement;
        case 'speed':
          return bestOverallWpm >= achievement.requirement;
        case 'accuracy':
          return bestOverallAccuracy >= achievement.requirement;
        case 'streak':
          return longestStreak >= achievement.requirement;
        default:
          return false;
      }
    });
  }, [totalExercises, bestOverallWpm, bestOverallAccuracy, longestStreak]);

  const heatmapData = useMemo(() => {
    const dailyCount: Record<string, number> = {};
    for (const stat of Object.values(exerciseStats)) {
      if (stat.completedAt) {
        const day = stat.completedAt.split('T')[0];
        dailyCount[day] = (dailyCount[day] || 0) + 1;
      }
    }
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const count = dailyCount[dayStr] || 0;
      days.push({ date: dayStr, count, level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : 3 });
    }
    return days;
  }, [exerciseStats]);

  if (compact) {
    return (
      <Card variant="bordered" className={cn('', className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{currentStreak}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">{totalExercises}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className={cn('', className)}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium text-text-secondary">Tu Progreso</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            label="Racha Actual"
            value={currentStreak}
            subValue={`Mejor: ${longestStreak}`}
            highlight={currentStreak > 0}
          />
          <StatCard
            icon={<Target className="w-4 h-4 text-green-500" />}
            label="Completados"
            value={totalExercises}
            subValue={`${totalAttempts} intentos`}
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-yellow-500" />}
            label="Mejor WPM"
            value={bestOverallWpm}
            highlight={bestOverallWpm > 40}
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-blue-500" />}
            label="Tiempo Total"
            value={formatTime(totalTypingTime)}
          />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            Nivel {level.level} - {level.title}
          </span>
          <span>{totalXP} / {getXPForLevel(level.level + 1)} XP</span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(level.progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-text-muted flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Rendimiento por Lenguaje
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <LanguageStat
              language="JavaScript"
              wpm={bestWpmByLanguage.javascript}
            />
            <LanguageStat
              language="TypeScript"
              wpm={bestWpmByLanguage.typescript}
            />
            <LanguageStat
              language="Python"
              wpm={bestWpmByLanguage.python}
            />
            <LanguageStat
              language="Java"
              wpm={bestWpmByLanguage.java || 0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-text-muted flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Mapa de Actividad (Último Año)
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-[2px]">
              {heatmapData.slice(-90).map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-sm',
                    day.level === 0 && 'bg-zinc-800',
                    day.level === 1 && 'bg-green-900',
                    day.level === 2 && 'bg-green-700',
                    day.level === 3 && 'bg-green-500',
                  )}
                  title={`${day.date}: ${day.count} exercises`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <span>Menos</span>
            <div className="w-2 h-2 bg-zinc-800 rounded-sm" />
            <div className="w-2 h-2 bg-green-900 rounded-sm" />
            <div className="w-2 h-2 bg-green-700 rounded-sm" />
            <div className="w-2 h-2 bg-green-500 rounded-sm" />
            <span>Más</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-text-muted flex items-center gap-1">
            <Award className="w-3 h-3" />
            Logros ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {unlockedAchievements.length > 0 ? (
              unlockedAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 rounded-lg text-xs"
                    title={achievement.description}
                  >
                    <span>
                      {achievement.category === 'language' ? (
                        <LanguageIcon language={achievement.icon} size={16} />
                      ) : (
                        achievement.icon
                      )}
                    </span>
                    <span className="text-yellow-200">{achievement.name}</span>
                  </div>
              ))
            ) : (
              <div className="text-xs text-text-muted italic">
                ¡Completa ejercicios para desbloquear logros!
              </div>
            )}
          </div>
        </div>

        {unlockedAchievements.length < ACHIEVEMENTS.length && (
          <div className="pt-2 border-t border-border-strong">
            <div className="text-xs text-text-muted mb-2">Logros Bloqueados</div>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.filter(a => !unlockedAchievements.find(u => u.id === a.id)).slice(0, 5).map(achievement => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-bg-elevated rounded-lg text-xs opacity-50"
                    title={achievement.description}
                  >
                    <span>
                      {achievement.category === 'language' ? (
                        <LanguageIcon language={achievement.icon} size={16} />
                      ) : (
                        achievement.icon
                      )}
                    </span>
                    <span className="text-text-muted">{achievement.name}</span>
                  </div>
              ))}
              {ACHIEVEMENTS.length - unlockedAchievements.length > 5 && (
                <div className="text-xs text-text-muted px-2 py-1">
                  +{ACHIEVEMENTS.length - unlockedAchievements.length - 5} más
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, subValue, highlight }: StatCardProps) {
  return (
    <div className={cn(
      'bg-bg-elevated/50 rounded-lg p-2 transition-colors',
      highlight && 'ring-1 ring-yellow-500/50'
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div className={cn(
        'text-lg font-semibold',
        highlight ? 'text-yellow-500' : 'text-text-primary'
      )}>
        {value}
      </div>
      {subValue && (
        <div className="text-[10px] text-text-muted truncate">{subValue}</div>
      )}
    </div>
  );
}

interface LanguageStatProps {
  language: string;
  wpm: number;
}

function LanguageStat({ language, wpm }: LanguageStatProps) {
  return (
    <div className="bg-bg-elevated/30 rounded-lg p-2 text-center border border-border/50 hover:border-border-strong/50 transition-colors">
      <LanguageIcon language={language} size={20} className="mx-auto mb-1.5" />
      <div className="text-[10px] text-text-muted mb-1 uppercase tracking-wider">{language}</div>
      <div className="text-sm font-semibold text-text-primary">{wpm || '-'}</div>
      <div className="text-[10px] text-text-muted">BEST WPM</div>
    </div>
  );
}

function getLevelTitle(level: number): string {
  const titles = [
    'Novato', 'Principiante', 'Intermedio', 'Avanzado',
    'Experto', 'Maestro', 'Gran Maestro', 'Leyenda', 'Mítico', 'Divino'
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

function getXPForLevel(level: number): number {
  const thresholds = [100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
  return thresholds[Math.min(level - 1, thresholds.length - 1)];
}

export default StatsPanel;