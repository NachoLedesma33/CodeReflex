'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useExerciseStore } from '@/stores/exerciseStore';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { theme } = useUIStore();
  const loadExercises = useExerciseStore(state => state.loadExercises);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return <>{children}</>;
}

export default Providers;
