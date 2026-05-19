import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { safeStorage } from "@/lib/safeStorage";

interface VisualEffectsSettings {
  particlesEnabled: boolean;
  parallaxEnabled: boolean;
  animationsEnabled: boolean;
  neonGlowEnabled: boolean;
  glowIntensity: 'subtle' | 'medium' | 'vibrant';
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
  toggleNeonGlow: () => void;
  setGlowIntensity: (intensity: 'subtle' | 'medium' | 'vibrant') => void;
}

const defaultSettings: VisualEffectsSettings = {
  particlesEnabled: false,
  parallaxEnabled: true,
  animationsEnabled: true,
  neonGlowEnabled: false, // Changed from true to false to disable glow by default
  glowIntensity: 'medium',
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

  const toggleNeonGlow = useCallback(() => {
    updateSetting('neonGlowEnabled', !settings.neonGlowEnabled);
  }, [settings.neonGlowEnabled, updateSetting]);

  const setGlowIntensity = useCallback((intensity: 'subtle' | 'medium' | 'vibrant') => {
    updateSetting('glowIntensity', intensity);
  }, [updateSetting]);

  // Apply CSS classes to document body based on settings
  useEffect(() => {
    const body = document.body;
    
    // Remove existing glow classes
    body.classList.remove('neon-glow-enabled', 'glow-subtle', 'glow-medium', 'glow-vibrant');
    
    // Apply current settings
    if (settings.neonGlowEnabled) {
      body.classList.add('neon-glow-enabled', `glow-${settings.glowIntensity}`);
    }
  }, [settings.neonGlowEnabled, settings.glowIntensity]);

  const value = {
    settings,
    updateSetting,
    toggleParticles,
    toggleParallax,
    toggleAnimations,
    toggleNeonGlow,
    setGlowIntensity,
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