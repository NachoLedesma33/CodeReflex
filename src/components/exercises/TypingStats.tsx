'use client';

import { useMemo } from 'react';
import { TypingMetrics } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  Zap,
  Target,
  AlertCircle,
  RotateCcw,
  Clock,
  Flame,
  TrendingUp,
} from 'lucide-react';

interface TypingStatsProps {
  metrics: TypingMetrics;
  characterStreak?: number;
  wpmHistory?: number[];
  errorPositions?: number[];
  className?: string;
}

interface WPMDataPoint {
  time: number;
  wpm: number;
}

export function TypingStats({
  metrics,
  characterStreak = 0,
  wpmHistory = [],
  errorPositions = [],
  className,
}: TypingStatsProps) {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatWpmHistory = useMemo(() => {
    if (wpmHistory.length === 0) return [];
    const recent = wpmHistory.slice(-20);
    return recent.map((wpm, i) => ({
      index: i,
      wpm,
      label: `${wpm} WPM`,
    }));
  }, [wpmHistory]);

  const heatmapData = useMemo(() => {
    const rows = 4;
    const cols = 10;
    const cells: { index: number; hasError: boolean }[] = [];
    
    for (let i = 0; i < rows * cols; i++) {
      cells.push({
        index: i,
        hasError: errorPositions.includes(i),
      });
    }
    
    return { cells, rows, cols };
  }, [errorPositions]);

  const maxWpm = useMemo(() => Math.max(...formatWpmHistory.map(d => d.wpm), 1), [formatWpmHistory]);

  const averageWpm = useMemo(() => {
    if (formatWpmHistory.length === 0) return 0;
    const sum = formatWpmHistory.reduce((acc, d) => acc + d.wpm, 0);
    return Math.round(sum / formatWpmHistory.length);
  }, [formatWpmHistory]);

  return (
    <Card variant="bordered" className={cn('', className)}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium text-zinc-400">Live Statistics</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<Zap className="w-4 h-4 text-yellow-500" />}
            label="WPM"
            value={metrics.wpm}
            subValue={averageWpm > 0 ? `Avg: ${averageWpm}` : undefined}
            highlight={metrics.wpm > 40}
          />
          
          <StatCard
            icon={<Target className="w-4 h-4 text-green-500" />}
            label="Accuracy"
            value={`${metrics.accuracy}%`}
            highlight={metrics.accuracy >= 95}
          />
          
          <StatCard
            icon={<AlertCircle className="w-4 h-4 text-red-500" />}
            label="Errors"
            value={metrics.errors}
            subValue={errorPositions.length > 0 ? `at positions: ${errorPositions.slice(0, 3).join(', ')}${errorPositions.length > 3 ? '...' : ''}` : undefined}
            highlight={metrics.errors > 5}
          />
          
          <StatCard
            icon={<RotateCcw className="w-4 h-4 text-orange-500" />}
            label="Corrections"
            value={metrics.corrections}
          />
          
          <StatCard
            icon={<Clock className="w-4 h-4 text-blue-500" />}
            label="Time"
            value={formatTime(metrics.elapsedTime)}
          />
          
          <StatCard
            icon={<Flame className="w-4 h-4 text-purple-500" />}
            label="Streak"
            value={characterStreak}
            highlight={characterStreak > 20}
          />
        </div>

        {formatWpmHistory.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <TrendingUp className="w-3 h-3" />
              <span>WPM Evolution</span>
            </div>
            <div className="h-16 flex items-end gap-0.5">
              {formatWpmHistory.map((point, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-t transition-all',
                    point.wpm === maxWpm ? 'bg-yellow-500' : 'bg-blue-500'
                  )}
                  style={{
                    height: `${Math.max(10, (point.wpm / maxWpm) * 100)}%`,
                    opacity: point.wpm === maxWpm ? 1 : 0.6,
                  }}
                  title={point.label}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-600">
              <span>Start</span>
              <span>Current: {metrics.wpm} WPM</span>
              <span>Peak: {maxWpm} WPM</span>
            </div>
          </div>
        )}

        {errorPositions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">Error Heatmap</div>
            <div 
              className="grid gap-0.5"
              style={{ 
                gridTemplateColumns: `repeat(${heatmapData.cols}, 1fr)` 
              }}
            >
              {heatmapData.cells.map((cell) => (
                <div
                  key={cell.index}
                  className={cn(
                    'h-6 rounded text-[10px] flex items-center justify-center transition-colors',
                    cell.hasError 
                      ? 'bg-red-500/30 text-red-400' 
                      : 'bg-zinc-800 text-zinc-600'
                  )}
                >
                  {cell.hasError ? '!' : ''}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/30" />
                Error
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-zinc-800" />
                Correct
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-700 text-xs text-zinc-500">
          <div className="flex justify-between">
            <span>Characters: {metrics.charactersTyped} / {metrics.charactersTyped + metrics.charactersRemaining}</span>
            <span>Keystrokes: {metrics.totalKeystrokes}</span>
          </div>
        </div>
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
      'bg-zinc-800/50 rounded-lg p-2 transition-colors',
      highlight && 'ring-1 ring-yellow-500/50'
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <div className={cn(
        'text-lg font-semibold',
        highlight ? 'text-yellow-500' : 'text-zinc-100'
      )}>
        {value}
      </div>
      {subValue && (
        <div className="text-[10px] text-zinc-500 truncate">{subValue}</div>
      )}
    </div>
  );
}

export default TypingStats;