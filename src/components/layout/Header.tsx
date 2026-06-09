'use client';

import { useUIStore } from '@/stores/uiStore';
import { useProgressStore } from '@/stores/progressStore';
import { Button } from '@/components/ui/Button';
import { ExerciseType } from '@/types';
import { cn } from '@/lib/utils';
import {
  Code2,
  Sun,
  Moon,
  Settings,
  Flame,
  Zap,
  Keyboard,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const MODES: { value: ExerciseType; label: string; icon: React.ReactNode }[] = [
  { value: 'reflex-typing', label: 'Reflex', icon: <Keyboard className="w-4 h-4" /> },
  { value: 'guided-problem', label: 'Guiado', icon: <BookOpen className="w-4 h-4" /> },
];

export function Header({ className }: HeaderProps) {
  const {
    theme,
    mode,
    toggleTheme,
    setMode,
    openSettings,
  } = useUIStore();

  const {
    totalXP,
    currentStreak,
    longestStreak,
  } = useProgressStore();

  const level = Math.floor(totalXP / 100) + 1;

  return (
    <header className={cn(
      'h-14 bg-bg-surface border-b border-border flex items-center justify-between px-4',
      className
    )}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">CodeReflex</span>
        </div>

        <div className="h-6 w-px bg-border-strong" />

        <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-1">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
                mode === m.value
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-lg">
            <Flame className="w-4 h-4 text-orange-600 dark:text-orange-500" />
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{currentStreak}</span>
            <span className="text-xs text-text-muted">/ {longestStreak}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{totalXP}</span>
            <span className="text-xs text-text-muted">XP</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-elevated rounded-lg">
            <span className="text-xs text-text-muted">Nvl</span>
            <span className="text-sm font-medium text-text-primary">{level}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-border-strong" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-text-secondary" />
            ) : (
              <Moon className="w-5 h-5 text-text-secondary" />
            )}
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={openSettings}
              className="p-2"
              title="Ajustes"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;