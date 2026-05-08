import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExerciseType, ProgrammingLanguage, DifficultyLevel } from '@/types';

type Theme = 'dark' | 'light';
type FontFamily = 'monaco' | 'fira-code' | 'jetbrains-mono';

interface UIState {
  // Tema y apariencia
  theme: Theme;
  
  // Modo de ejercicio
  mode: ExerciseType;
  
  // Configuración de sonido
  soundEnabled: boolean;
  soundVolume: number;
  
  // Editor
  editorFontFamily: FontFamily;
  editorFontSize: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoComplete: boolean;
  minimapEnabled: boolean;
  
  // Layout
  sidebarCollapsed: boolean;
  statsPanelCollapsed: boolean;
  
  // Preferencias de usuario
  currentLanguage: ProgrammingLanguage;
  currentLevel: DifficultyLevel;
  showCompletedExercises: boolean;
  showFavoritesOnly: boolean;
  
  // Notificaciones
  notificationsEnabled: boolean;
  showAchievementToasts: boolean;
  
  // Acciones
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setMode: (mode: ExerciseType) => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  setEditorFontFamily: (font: FontFamily) => void;
  setEditorFontSize: (size: number) => void;
  toggleLineNumbers: () => void;
  toggleWordWrap: () => void;
  toggleAutoComplete: () => void;
  toggleMinimap: () => void;
  toggleSidebar: () => void;
  toggleStatsPanel: () => void;
  setCurrentLanguage: (language: ProgrammingLanguage) => void;
  setCurrentLevel: (level: DifficultyLevel) => void;
  toggleShowCompleted: () => void;
  toggleShowFavorites: () => void;
  toggleNotifications: () => void;
  toggleAchievementToasts: () => void;
  resetSettings: () => void;
}

const initialState = {
  theme: 'dark' as Theme,
  mode: 'reflex-typing' as ExerciseType,
  soundEnabled: true,
  soundVolume: 0.5,
  editorFontFamily: 'monaco' as FontFamily,
  editorFontSize: 14,
  showLineNumbers: true,
  wordWrap: false,
  autoComplete: true,
  minimapEnabled: false,
  sidebarCollapsed: false,
  statsPanelCollapsed: true,
  currentLanguage: 'javascript' as ProgrammingLanguage,
  currentLevel: 'fundamentals' as DifficultyLevel,
  showCompletedExercises: true,
  showFavoritesOnly: false,
  notificationsEnabled: true,
  showAchievementToasts: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),

      setMode: (mode) => set({ mode }),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),

      setEditorFontFamily: (font) => set({ editorFontFamily: font }),
      setEditorFontSize: (size) => set({ editorFontSize: Math.max(10, Math.min(24, size)) }),

      toggleLineNumbers: () => set((state) => ({ showLineNumbers: !state.showLineNumbers })),
      toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),
      toggleAutoComplete: () => set((state) => ({ autoComplete: !state.autoComplete })),
      toggleMinimap: () => set((state) => ({ minimapEnabled: !state.minimapEnabled })),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleStatsPanel: () => set((state) => ({ statsPanelCollapsed: !state.statsPanelCollapsed })),

      setCurrentLanguage: (language) => set({ currentLanguage: language }),
      setCurrentLevel: (level) => set({ currentLevel: level }),

      toggleShowCompleted: () => set((state) => ({ showCompletedExercises: !state.showCompletedExercises })),
      toggleShowFavorites: () => set((state) => ({ showFavoritesOnly: !state.showFavoritesOnly })),

      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleAchievementToasts: () => set((state) => ({ showAchievementToasts: !state.showAchievementToasts })),

      resetSettings: () => set(initialState),
    }),
    {
      name: 'codereflex-ui',
      partialize: (state) => ({
        theme: state.theme,
        mode: state.mode,
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        editorFontFamily: state.editorFontFamily,
        editorFontSize: state.editorFontSize,
        showLineNumbers: state.showLineNumbers,
        wordWrap: state.wordWrap,
        autoComplete: state.autoComplete,
        minimapEnabled: state.minimapEnabled,
        currentLanguage: state.currentLanguage,
        currentLevel: state.currentLevel,
        showCompletedExercises: state.showCompletedExercises,
        showFavoritesOnly: state.showFavoritesOnly,
        notificationsEnabled: state.notificationsEnabled,
        showAchievementToasts: state.showAchievementToasts,
      }),
    }
  )
);