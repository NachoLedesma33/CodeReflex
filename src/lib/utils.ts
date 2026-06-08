import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const normalizeCode = (code: string): string => {
  return code
    .replace(/[\t ]+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
};

export const calculateWPM = (startTime: number, endTime: number, typedCharacters: number): number => {
  const timeInMinutes = (endTime - startTime) / 60000;
  if (timeInMinutes <= 0) return 0;
  const words = typedCharacters / 5;
  return Math.round(words / timeInMinutes);
};

export const calculateAccuracy = (errors: number, total: number): number => {
  if (total === 0) return 100;
  return Math.round(((total - errors) / total) * 100 * 100) / 100;
};

export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const difficultyColors: Record<string, string> = {
  fundamentals: 'text-green-400 bg-green-900/30 border-green-800',
  intermediate: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  interview: 'text-orange-400 bg-orange-900/30 border-orange-800',
  advanced: 'text-red-400 bg-red-900/30 border-red-800',
};

export const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
};

export const languageIcons: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  python: 'PY',
  java: 'JV',
};