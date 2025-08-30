import { useState, useEffect } from "react";
import { Home, MessageCircle, BarChart3, ChefHat, Leaf, Plus, X, Zap, Eye, EyeOff, Palette, Sparkles, Moon, Sun, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsService } from "@/services/settingsService";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";
import { APIService } from "@/services/apiService";
import { ImpactService } from "@/services/impactService";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: "home" | "chat" | "stats" | "recipes" | "leaves" | "settings";
  onTabChange: (tab: "home" | "chat" | "stats" | "recipes" | "leaves" | "settings") => void;
}

export default function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const { t, setLanguage, lang } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const initialSettings = SettingsService.getSettings();
  const [roboflowApiKey, setRoboflowApiKey] = useState(initialSettings.roboflowApiKey);
  const [roboflowEndpoint, setRoboflowEndpoint] = useState(initialSettings.roboflowEndpoint);
  const [openrouterApiKey, setOpenrouterApiKey] = useState(initialSettings.openrouterApiKey);
  const [openrouterEndpoint, setOpenrouterEndpoint] = useState(initialSettings.openrouterEndpoint);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(initialSettings.n8nWebhookUrl);
  const [chatProvider, setChatProvider] = useState(initialSettings.chatProvider);

  // Define default visual settings first
  const defaultVisualSettings = {
    particlesEnabled: false,
    parallaxEnabled: true,
    animationsEnabled: true,
    neonGlowEnabled: false, // Changed from true to false to disable glow by default
    glowIntensity: 'medium' as const,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' as 'light' | 'dark'
  };

  // Visual effects settings
  const [visualSettings, setVisualSettings] = useState(() => {
    // Load visual settings from localStorage if available
    const savedVisualSettings = localStorage.getItem('visualEffectsSettings');
    if (savedVisualSettings) {
      try {
        return { ...defaultVisualSettings, ...JSON.parse(savedVisualSettings) };
      } catch (e) {
        console.warn('Failed to parse visual settings from localStorage', e);
        return defaultVisualSettings;
      }
    }
    return defaultVisualSettings;
  });

  const tabs = [
    { id: "home" as const, icon: Home, label: t('tabs.home') },
    { id: "chat" as const, icon: MessageCircle, label: t('tabs.chat') },
    { id: "stats" as const, icon: BarChart3, label: t('tabs.stats') },
    { id: "recipes" as const, icon: ChefHat, label: t('tabs.recipes') },
    { id: "leaves" as const, icon: Leaf, label: t('tabs.leaves') }
  ];

  // Apply visual effects on mount and when visualSettings change
  useEffect(() => {
    applyVisualEffectsToBody();
  }, [visualSettings]);

  const applyVisualEffectsToBody = () => {
    const body = document.body;
    
    // Remove existing glow classes
    body.classList.remove('neon-glow-enabled', 'glow-subtle', 'glow-medium', 'glow-vibrant');
    
    // Apply current settings
    if (visualSettings.neonGlowEnabled) {
      body.classList.add('neon-glow-enabled', `glow-${visualSettings.glowIntensity}`);
    }
  };

  // Visual effects toggle functions
  const toggleNeonGlow = () => {
    setVisualSettings((prev: typeof visualSettings) => ({
      ...prev,
      neonGlowEnabled: !prev.neonGlowEnabled
    }));
  };

  const setGlowIntensity = (intensity: 'subtle' | 'medium' | 'vibrant') => {
    setVisualSettings((prev: typeof visualSettings) => ({
      ...prev,
      glowIntensity: intensity
    }));
  };

  const toggleParticles = () => {
    setVisualSettings((prev: typeof visualSettings) => ({
      ...prev,
      particlesEnabled: !prev.particlesEnabled
    }));
  };

  const toggleParallax = () => {
    setVisualSettings((prev: typeof visualSettings) => ({
      ...prev,
      parallaxEnabled: !prev.parallaxEnabled
    }));
  };

  const toggleAnimations = () => {
    setVisualSettings((prev: typeof visualSettings) => ({
      ...prev,
      animationsEnabled: !prev.animationsEnabled
    }));
  };

  const handleToggleTheme = () => {
    setVisualSettings((prev: typeof defaultVisualSettings) => {
      const newTheme = prev.theme === 'dark' ? 'light' : 'dark';
      return { ...prev, theme: newTheme as 'light' | 'dark' };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-glow rounded-full opacity-30 animate-leaf-float"></div>
        <div className="absolute top-1/3 right-8 w-16 h-16 bg-gradient-glow rounded-full opacity-20 animate-leaf-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-glow rounded-full opacity-25 animate-leaf-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Top Bar (sticky) */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-md border-b border-border">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Embedded Top-Left Circular Menu inside top bar */}
            <div className="relative w-14 h-14">
              {tabs.map(({ id, icon: Icon, label }, index) => {
                const total = tabs.length;
                const isRtl = lang === 'AR';
                // RTL: expand left-down (90°→180°), LTR: right-down (0°→90°)
                const startDeg = isRtl ? 90 : 0;
                const endDeg = isRtl ? 180 : 90;
                const step = total > 1 ? (endDeg - startDeg) / (total - 1) : 0;
                const angle = (startDeg + step * index) * Math.PI / 180;
                const radius = isTopMenuOpen ? 170 : 0;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <button
                    key={id}
                    onClick={() => { onTabChange(id); setIsTopMenuOpen(false); }}
                    className={cn(
                      "absolute flex items-center gap-2 px-4 py-1 rounded-tl-2xl rounded-br-2xl shadow-lg backdrop-blur-md transition-all duration-300 transform hover:scale-105", // Leaf shape with two round corners and two sharp corners
                      isTopMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-0",
                      activeTab === id ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-muted/60"
                    )}
                    style={{ 
                      left: '50%', 
                      top: '50%', 
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      minWidth: '100px' // Thinner and longer
                    }}
                    aria-label={label}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      activeTab === id ? "bg-primary-foreground/20" : "bg-background/70"
                    )}>
                      <Icon className={cn("w-3 h-3", activeTab === id ? "text-primary-foreground" : "text-foreground")} />
                    </span>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {label}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}
                className={cn(
                  "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform duration-300",
                  isTopMenuOpen ? "animate-wobble bg-primary text-primary-foreground" : "bg-primary text-primary-foreground hover:scale-105"
                )}
                aria-label="Menu"
                style={{ position: 'absolute', left: 0, top: 0 }}
              >
                {isTopMenuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language selector (right group) */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="w-9 h-9 rounded-full border border-border bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-semibold"
                title="Language"
              >
                {lang}
              </button>
              {langOpen && (
                <div className="absolute mt-2 right-0 glass rounded-2xl p-2 flex gap-2">
                  {(['EN','FR','AR'] as const).map(code => (
                    <button
                      key={code}
                      onClick={() => { setLanguage(code); setLangOpen(false); }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${lang===code? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                    >{code}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Theme toggle dispatch */}
            <button
              onClick={() => window.dispatchEvent(new Event('toggleTheme'))}
              className="p-2 rounded-full border border-border bg-background/80 hover:bg-muted transition"
              title="Theme"
            >
              <span className="dark:hidden">🌙</span>
              <span className="hidden dark:inline">☀️</span>
            </button>
            
            {/* Settings button */}
            <button
              onClick={() => onTabChange("settings" as any)}
              className="p-2 rounded-full border border-border bg-background/80 hover:bg-muted transition"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-foreground" />
            </button>

          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out pb-16"
      )}>
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Corner Menu (FAB) */}
      <div className={cn("fixed right-5 z-50", activeTab === 'chat' ? "bottom-24" : "bottom-5")}>
        <div className="relative w-14 h-14">
          {/* Circular items */}
          {tabs.map(({ id, icon: Icon, label }, index) => {
            const total = tabs.length;
            const startDeg = 180; // arc up-left from bottom-right corner
            const endDeg = 260;
            const step = total > 1 ? (endDeg - startDeg) / (total - 1) : 0;
            const angle = (startDeg + step * index) * Math.PI / 180;
            const radius = isMenuOpen ? 170 : 0; // px (increased spacing)
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <button
                key={id}
                onClick={() => { onTabChange(id); setIsMenuOpen(false); }}
                className={cn(
                  "absolute flex items-center gap-2 px-4 py-1 rounded-tl-2xl rounded-br-2xl shadow-lg backdrop-blur-md transition-all duration-300 transform hover:scale-105",
                  isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-0",
                  activeTab === id ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-muted/60"
                )}
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  minWidth: '100px'
                }}
                aria-label={label}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  activeTab === id ? "bg-primary-foreground/20" : "bg-background/70"
                )}>
                  <Icon className={cn("w-3 h-3", activeTab === id ? "text-primary-foreground" : "text-foreground")} />
                </span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}

          {/* Main FAB */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform duration-300",
              isMenuOpen ? "animate-wobble bg-primary text-primary-foreground" : "bg-primary text-primary-foreground hover:scale-105"
            )}
            aria-label="Menu"
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
        </div>

    </div>
  );
}