'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProgressStore } from '@/stores/progressStore';
import { Button } from '@/components/ui/Button';
import {
  X,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  Check,
} from 'lucide-react';

export function SettingsPanel() {
  const {
    settingsPanelOpen,
    closeSettings,
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    soundVolume,
    setSoundVolume,
  } = useUIStore();

  const {
    totalExercises,
    resetProgress,
  } = useProgressStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!settingsPanelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={closeSettings}
      >
        <div
          className="bg-bg-elevated border border-border-strong rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border-strong">
            <h2 className="text-lg font-semibold text-text-primary">Ajustes</h2>
            <Button variant="ghost" size="sm" onClick={closeSettings} className="p-1">
              <X className="w-5 h-5 text-text-secondary" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Apariencia</h3>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-border-strong/50 transition-colors"
              >
                <span className="text-sm text-text-secondary">Tema</span>
                <span className="flex items-center gap-2 text-sm text-text-primary">
                  {theme === 'dark' ? (
                    <>
                      <Moon className="w-4 h-4" />
                      Oscuro
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      Claro
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="border-t border-border-strong pt-3 space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Sonido</h3>

              <button
                onClick={toggleSound}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-border-strong/50 transition-colors"
              >
                <span className="text-sm text-text-secondary">Sonidos</span>
                <span className="flex items-center gap-2 text-sm text-text-primary">
                  {soundEnabled ? (
                    <><Volume2 className="w-4 h-4" />Activado</>
                  ) : (
                    <><VolumeX className="w-4 h-4" />Silenciado</>
                  )}
                </span>
              </button>

              {soundEnabled && (
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Volumen</span>
                      <span className="text-sm text-text-muted">{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={e => setSoundVolume(parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
              )}
            </div>

            <div className="border-t border-border-strong pt-3 space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Progreso</h3>
              <div className="px-3 py-2 text-sm text-text-muted">
                {totalExercises} ejercicios completados
              </div>
              <button
                onClick={() => { setShowResetConfirm(true); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg w-full transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Progreso
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-bg-elevated border border-border-strong rounded-lg p-4 w-80">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              <span className="text-sm font-medium text-text-primary">¿Reiniciar Progreso?</span>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Esto eliminará permanentemente todo tu progreso, XP, rachas y logros. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { resetProgress(); setShowResetConfirm(false); closeSettings(); }}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
