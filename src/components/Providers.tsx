'use client';

import { useEffect, useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useExerciseStore } from '@/stores/exerciseStore';

interface ProvidersProps {
  children: React.ReactNode;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted text-sm">Loading...</span>
      </div>
    </div>
  );
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  const { theme } = useUIStore();
  const loadExercises = useExerciseStore(state => state.loadExercises);

  // Apply dark class immediately if needed (before first paint)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    loadExercises();
  }, [loadExercises]);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

export default Providers;
