import React, { createContext, useContext, useState, useCallback } from 'react';
import { safeStorage } from '@/lib/safeStorage';

interface VisualEffectsSettings {
  particlesEnabled: boolean;
  parallaxEnabled: boolean;
  animationsEnabled: boolean;
}

interface VisualEffectsContextValue {
  settings: VisualEffectsSettings;
  updateSetting: <K extends keyof VisualEffectsSettings>(
    key: K, 
    value: VisualEffectsSettings[K]
  ) => void;
  toggleParticles: () => void;
  toggleParallax: () => void;
  toggleAnimations: () => void;
}

const defaultSettings: VisualEffectsSettings = {
  particlesEnabled: false,
  parallaxEnabled: true,
  animationsEnabled: true,
};

const VisualEffectsContext = createContext<VisualEffectsContextValue | undefined>(undefined);

export function VisualEffectsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<VisualEffectsSettings>(() => {
    try {
      const saved = safeStorage.get('visualEffectsSettings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSetting = useCallback(<K extends keyof VisualEffectsSettings>(
    key: K, 
    value: VisualEffectsSettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      safeStorage.set('visualEffectsSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const toggleParticles = useCallback(() => {
    updateSetting('particlesEnabled', !settings.particlesEnabled);
  }, [settings.particlesEnabled, updateSetting]);

  const toggleParallax = useCallback(() => {
    updateSetting('parallaxEnabled', !settings.parallaxEnabled);
  }, [settings.parallaxEnabled, updateSetting]);

  const toggleAnimations = useCallback(() => {
    updateSetting('animationsEnabled', !settings.animationsEnabled);
  }, [settings.animationsEnabled, updateSetting]);

  const value = {
    settings,
    updateSetting,
    toggleParticles,
    toggleParallax,
    toggleAnimations,
  };

  return (
    <VisualEffectsContext.Provider value={value}>
      {children}
    </VisualEffectsContext.Provider>
  );
}

export function useVisualEffects(): VisualEffectsContextValue {
  const context = useContext(VisualEffectsContext);
  if (!context) {
    throw new Error('useVisualEffects must be used within VisualEffectsProvider');
  }
  return context;
}