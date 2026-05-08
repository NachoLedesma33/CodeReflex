'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useExerciseStore } from '@/stores/exerciseStore';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useUIStore();
  const loadExercises = useExerciseStore(state => state.loadExercises);

  useEffect(() => {
    setMounted(true);
    loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default Providers;