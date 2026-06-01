import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExerciseType, ProgrammingLanguage, DifficultyLevel } from '@/types';

type Theme = 'dark' | 'light';
type FontFamily = 'cascadia-code' | 'monaco' | 'fira-code' | 'jetbrains-mono';

interface UIState {
  // ============================================
  // TEMA Y APARIENCIA
  // ============================================
  theme: Theme;
  accentColor: string;
  
  // ============================================
  // MODO DE EJERCICIO
  // ============================================
  mode: ExerciseType;
  
  // ============================================
  // CONFIGURACIÓN DE SONIDO
  // ============================================
  soundEnabled: boolean;
  soundVolume: number;
  keyboardSounds: boolean;
  errorSounds: boolean;
  completionSound: boolean;
  
  // ============================================
  // EDITOR
  // ============================================
  editorFontFamily: FontFamily;
  editorFontSize: number;
  editorLineHeight: number;
  editorTabSize: number;
  showLineNumbers: boolean;
  showMinimap: boolean;
  wordWrap: boolean;
  autoComplete: boolean;
  autoSave: boolean;
  highlightActiveLine: boolean;
  bracketPairColorization: boolean;
  
  // ============================================
  // LAYOUT Y PANELES
  // ============================================
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  statsPanelCollapsed: boolean;
  hintsPanelCollapsed: boolean;
  consolePanelCollapsed: boolean;
  keyboardShortcutsPanelOpen: boolean;
  achievementsPanelOpen: boolean;
  settingsPanelOpen: boolean;
  
  // ============================================
  // MODO ZEN/FOCUS
  // ============================================
  zenModeEnabled: boolean;
  zenModeHideSidebar: boolean;
  zenModeHideStats: boolean;
  zenModeHideHeader: boolean;
  zenModeFullscreen: boolean;
  
  // ============================================
  // PREFERENCIAS DE USUARIO
  // ============================================
  currentLanguage: ProgrammingLanguage;
  currentLevel: DifficultyLevel;
  showCompletedExercises: boolean;
  showFavoritesOnly: boolean;
  favoriteExercises: string[];
  
  // ============================================
  // NOTIFICACIONES
  // ============================================
  notificationsEnabled: boolean;
  showAchievementToasts: boolean;
  showHintNotifications: boolean;
  showStreakNotifications: boolean;
  
  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  keyboardShortcutsEnabled: boolean;
  
  // ============================================
  // ACCIONES - TEMA
  // ============================================
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  
  // ============================================
  // ACCIONES - MODO
  // ============================================
  setMode: (mode: ExerciseType) => void;
  
  // ============================================
  // ACCIONES - SONIDO
  // ============================================
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  toggleKeyboardSounds: () => void;
  toggleErrorSounds: () => void;
  toggleCompletionSound: () => void;
  
  // ============================================
  // ACCIONES - EDITOR
  // ============================================
  setEditorFontFamily: (font: FontFamily) => void;
  setEditorFontSize: (size: number) => void;
  setEditorLineHeight: (height: number) => void;
  setEditorTabSize: (size: number) => void;
  toggleLineNumbers: () => void;
  toggleMinimap: () => void;
  toggleWordWrap: () => void;
  toggleAutoComplete: () => void;
  toggleAutoSave: () => void;
  toggleHighlightActiveLine: () => void;
  toggleBracketPairColorization: () => void;
  
  // ============================================
  // ACCIONES - LAYOUT
  // ============================================
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleStatsPanel: () => void;
  toggleHintsPanel: () => void;
  toggleConsolePanel: () => void;
  openKeyboardShortcuts: () => void;
  closeKeyboardShortcuts: () => void;
  openAchievements: () => void;
  closeAchievements: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  togglePanel: (panel: 'stats' | 'hints' | 'console') => void;
  
  // ============================================
  // ACCIONES - MODO ZEN
  // ============================================
  toggleZenMode: () => void;
  setZenModeOptions: (options: {
    hideSidebar?: boolean;
    hideStats?: boolean;
    hideHeader?: boolean;
    fullscreen?: boolean;
  }) => void;
  exitZenMode: () => void;
  
  // ============================================
  // ACCIONES - FAVORITOS
  // ============================================
  toggleFavorite: (exerciseId: string) => void;
  isFavorite: (exerciseId: string) => boolean;
  clearFavorites: () => void;
  
  // ============================================
  // ACCIONES - PREFERENCIAS
  // ============================================
  setCurrentLanguage: (language: ProgrammingLanguage) => void;
  setCurrentLevel: (level: DifficultyLevel) => void;
  toggleShowCompleted: () => void;
  toggleShowFavorites: () => void;
  
  // ============================================
  // ACCIONES - NOTIFICACIONES
  // ============================================
  toggleNotifications: () => void;
  toggleAchievementToasts: () => void;
  toggleHintNotifications: () => void;
  toggleStreakNotifications: () => void;
  
  // ============================================
  // ACCIONES - KEYBOARD SHORTCUTS
  // ============================================
  toggleKeyboardShortcuts: () => void;
  
  // ============================================
  // RESET
  // ============================================
  resetSettings: () => void;
  resetEditorSettings: () => void;
}

const initialState = {
  // Tema
  theme: 'dark' as Theme,
  accentColor: '#3b82f6',
  
  // Modo
  mode: 'reflex-typing' as ExerciseType,
  
  // Sonido
  soundEnabled: true,
  soundVolume: 0.5,
  keyboardSounds: true,
  errorSounds: true,
  completionSound: true,
  
  // Editor
  editorFontFamily: 'cascadia-code' as FontFamily,
  editorFontSize: 16,
  editorLineHeight: 1.5,
  editorTabSize: 2,
  showLineNumbers: true,
  showMinimap: false,
  wordWrap: false,
  autoComplete: true,
  autoSave: true,
  highlightActiveLine: true,
  bracketPairColorization: true,
  
  // Layout
  sidebarCollapsed: false,
  sidebarWidth: 280,
  statsPanelCollapsed: true,
  hintsPanelCollapsed: true,
  consolePanelCollapsed: true,
  keyboardShortcutsPanelOpen: false,
  achievementsPanelOpen: false,
  settingsPanelOpen: false,
  
  // Zen Mode
  zenModeEnabled: false,
  zenModeHideSidebar: true,
  zenModeHideStats: true,
  zenModeHideHeader: false,
  zenModeFullscreen: false,
  
  // Preferencias
  currentLanguage: 'javascript' as ProgrammingLanguage,
  currentLevel: 'fundamentals' as DifficultyLevel,
  showCompletedExercises: true,
  showFavoritesOnly: false,
  favoriteExercises: [] as string[],
  
  // Notificaciones
  notificationsEnabled: true,
  showAchievementToasts: true,
  showHintNotifications: true,
  showStreakNotifications: true,
  
  // Keyboard
  keyboardShortcutsEnabled: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === TEMA ===
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),

      // === MODO ===
      setMode: (mode) => set({ mode }),

      // === SONIDO ===
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
      toggleKeyboardSounds: () => set((state) => ({ keyboardSounds: !state.keyboardSounds })),
      toggleErrorSounds: () => set((state) => ({ errorSounds: !state.errorSounds })),
      toggleCompletionSound: () => set((state) => ({ completionSound: !state.completionSound })),

      // === EDITOR ===
      setEditorFontFamily: (font) => set({ editorFontFamily: font }),
      setEditorFontSize: (size) => set({ editorFontSize: Math.max(10, Math.min(24, size)) }),
      setEditorLineHeight: (height) => set({ editorLineHeight: Math.max(1, Math.min(3, height)) }),
      setEditorTabSize: (size) => set({ editorTabSize: Math.max(2, Math.min(8, size)) }),
      toggleLineNumbers: () => set((state) => ({ showLineNumbers: !state.showLineNumbers })),
      toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
      toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),
      toggleAutoComplete: () => set((state) => ({ autoComplete: !state.autoComplete })),
      toggleAutoSave: () => set((state) => ({ autoSave: !state.autoSave })),
      toggleHighlightActiveLine: () => set((state) => ({ highlightActiveLine: !state.highlightActiveLine })),
      toggleBracketPairColorization: () => set((state) => ({ bracketPairColorization: !state.bracketPairColorization })),

      // === LAYOUT ===
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),
      toggleStatsPanel: () => set((state) => ({ statsPanelCollapsed: !state.statsPanelCollapsed })),
      toggleHintsPanel: () => set((state) => ({ hintsPanelCollapsed: !state.hintsPanelCollapsed })),
      toggleConsolePanel: () => set((state) => ({ consolePanelCollapsed: !state.consolePanelCollapsed })),
      openKeyboardShortcuts: () => set({ keyboardShortcutsPanelOpen: true }),
      closeKeyboardShortcuts: () => set({ keyboardShortcutsPanelOpen: false }),
      openAchievements: () => set({ achievementsPanelOpen: true }),
      closeAchievements: () => set({ achievementsPanelOpen: false }),
      openSettings: () => set({ settingsPanelOpen: true }),
      closeSettings: () => set({ settingsPanelOpen: false }),
      togglePanel: (panel) => {
        const state = get();
        switch (panel) {
          case 'stats':
            set({ statsPanelCollapsed: !state.statsPanelCollapsed });
            break;
          case 'hints':
            set({ hintsPanelCollapsed: !state.hintsPanelCollapsed });
            break;
          case 'console':
            set({ consolePanelCollapsed: !state.consolePanelCollapsed });
            break;
        }
      },

      // === MODO ZEN ===
      toggleZenMode: () => set((state) => {
        if (!state.zenModeEnabled) {
          // Enter zen mode
          return {
            zenModeEnabled: true,
            sidebarCollapsed: state.zenModeHideSidebar,
            statsPanelCollapsed: state.zenModeHideStats,
          };
        } else {
          // Exit zen mode - restore all panels
          return {
            zenModeEnabled: false,
            sidebarCollapsed: false,
            statsPanelCollapsed: true,
          };
        }
      }),
      setZenModeOptions: (options) => set((state) => ({
        zenModeHideSidebar: options.hideSidebar ?? state.zenModeHideSidebar,
        zenModeHideStats: options.hideStats ?? state.zenModeHideStats,
        zenModeHideHeader: options.hideHeader ?? state.zenModeHideHeader,
        zenModeFullscreen: options.fullscreen ?? state.zenModeFullscreen,
      })),
      exitZenMode: () => set({
        zenModeEnabled: false,
        sidebarCollapsed: false,
        statsPanelCollapsed: false,
      }),

      // === FAVORITOS ===
      toggleFavorite: (exerciseId) => set((state) => {
        const favorites = new Set(state.favoriteExercises);
        if (favorites.has(exerciseId)) {
          favorites.delete(exerciseId);
        } else {
          favorites.add(exerciseId);
        }
        return { favoriteExercises: Array.from(favorites) };
      }),
      isFavorite: (exerciseId) => get().favoriteExercises.includes(exerciseId),
      clearFavorites: () => set({ favoriteExercises: [] }),

      // === PREFERENCIAS ===
      setCurrentLanguage: (language) => set({ currentLanguage: language }),
      setCurrentLevel: (level) => set({ currentLevel: level }),
      toggleShowCompleted: () => set((state) => ({ showCompletedExercises: !state.showCompletedExercises })),
      toggleShowFavorites: () => set((state) => ({ showFavoritesOnly: !state.showFavoritesOnly })),

      // === NOTIFICACIONES ===
      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleAchievementToasts: () => set((state) => ({ showAchievementToasts: !state.showAchievementToasts })),
      toggleHintNotifications: () => set((state) => ({ showHintNotifications: !state.showHintNotifications })),
      toggleStreakNotifications: () => set((state) => ({ showStreakNotifications: !state.showStreakNotifications })),

      // === KEYBOARD SHORTCUTS ===
      toggleKeyboardShortcuts: () => set((state) => ({ keyboardShortcutsEnabled: !state.keyboardShortcutsEnabled })),

      // === RESET ===
      resetSettings: () => set(initialState),
      resetEditorSettings: () => set({
        editorFontFamily: initialState.editorFontFamily,
        editorFontSize: initialState.editorFontSize,
        editorLineHeight: initialState.editorLineHeight,
        editorTabSize: initialState.editorTabSize,
        showLineNumbers: initialState.showLineNumbers,
        showMinimap: initialState.showMinimap,
        wordWrap: initialState.wordWrap,
        autoComplete: initialState.autoComplete,
        highlightActiveLine: initialState.highlightActiveLine,
        bracketPairColorization: initialState.bracketPairColorization,
      }),
    }),
    {
      name: 'codereflex-ui',
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        mode: state.mode,
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        keyboardSounds: state.keyboardSounds,
        errorSounds: state.errorSounds,
        completionSound: state.completionSound,
        editorFontFamily: state.editorFontFamily,
        editorFontSize: state.editorFontSize,
        editorLineHeight: state.editorLineHeight,
        editorTabSize: state.editorTabSize,
        showLineNumbers: state.showLineNumbers,
        showMinimap: state.showMinimap,
        wordWrap: state.wordWrap,
        autoComplete: state.autoComplete,
        autoSave: state.autoSave,
        highlightActiveLine: state.highlightActiveLine,
        bracketPairColorization: state.bracketPairColorization,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        currentLanguage: state.currentLanguage,
        currentLevel: state.currentLevel,
        showCompletedExercises: state.showCompletedExercises,
        showFavoritesOnly: state.showFavoritesOnly,
        favoriteExercises: state.favoriteExercises,
        notificationsEnabled: state.notificationsEnabled,
        showAchievementToasts: state.showAchievementToasts,
        showHintNotifications: state.showHintNotifications,
        showStreakNotifications: state.showStreakNotifications,
        keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
        zenModeEnabled: state.zenModeEnabled,
        zenModeHideSidebar: state.zenModeHideSidebar,
        zenModeHideStats: state.zenModeHideStats,
        zenModeHideHeader: state.zenModeHideHeader,
        zenModeFullscreen: state.zenModeFullscreen,
      }),
    }
  )
);