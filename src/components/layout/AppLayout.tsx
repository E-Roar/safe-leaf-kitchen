import { useState, useEffect } from "react";
import { Home, MessageCircle, BarChart3, ChefHat, Settings, Leaf, Plus, X, RefreshCw, Zap, Eye, EyeOff, Palette, Sparkles, Moon, Sun } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
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
    { id: "leaves" as const, icon: Leaf, label: t('tabs.leaves') },
    { id: "settings" as const, icon: Settings, label: t('tabs.settings') },
  ];

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  // Apply visual effects on mount and when visualSettings change
  useEffect(() => {
    applyVisualEffectsToBody();
  }, [visualSettings]);

  // Effect to show password modal when settings tab is active
  useEffect(() => {
    if (activeTab === 'settings' && !isSettingsUnlocked) {
      setShowSettings(true);
    }
  }, [activeTab, isSettingsUnlocked]);

  const handlePasswordSubmit = () => {
    if (settingsPassword === "hidachi") {
      setIsSettingsUnlocked(true);
      setShowSettings(false);
      setSettingsPassword("");
    } else {
      alert("Incorrect password");
      setSettingsPassword("");
      // Keep the settings modal open and don't change the active tab
    }
  };

  const handleSaveSettings = () => {
    SettingsService.update({
      roboflowApiKey,
      roboflowEndpoint,
      openrouterApiKey,
      openrouterEndpoint,
      n8nWebhookUrl,
      chatProvider,
    });
    
    // Save visual effects settings
    localStorage.setItem('visualEffectsSettings', JSON.stringify(visualSettings));
    
    // Apply theme
    if (visualSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply visual effects to body
    applyVisualEffectsToBody();
    
    toast.success("Settings saved. Changes apply immediately for this session.");
    
    // Close the settings panel after saving
    setIsSettingsUnlocked(false);
    onTabChange('home');
  };

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

  const addDemoData = () => {
    console.log('Adding demo data...');
    
    // Add sample leaf detections
    const demoLeaves = [
      { class: 'Onion Leaves', confidence: 0.95, x: 100, y: 100, width: 200, height: 200, detection_id: `demo-${Date.now()}-onion` },
      { class: 'Garlic Leaves', confidence: 0.88, x: 150, y: 150, width: 180, height: 180, detection_id: `demo-${Date.now()}-garlic` },
      { class: 'Leek Leaves', confidence: 0.92, x: 200, y: 200, width: 190, height: 190, detection_id: `demo-${Date.now()}-leek` }
    ];
    
    demoLeaves.forEach(leaf => {
      APIService.saveDetectedLeaves([leaf]);
      APIService.incrementScans();
    });
    
    // Add sample recipe views
    for (let i = 1; i <= 5; i++) {
      APIService.saveRecipeView(i);
    }
    
    // Add sample favorites
    APIService.toggleFavoriteRecipe(1);
    APIService.toggleFavoriteRecipe(3);
    
    console.log('Demo data added successfully');
    
    // Verify impact calculations
    setTimeout(() => {
      const impact = ImpactService.getCumulativeImpact();
      console.log('Updated impact after demo data:', impact);
      toast.success(`Demo data added! Impact: ${impact.amount_g}g leaves, ${impact.price_saved_MAD.toFixed(2)} MAD saved`);
    }, 100);
  };
  
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      const keysToRemove = Object.keys(localStorage).filter(key => key.includes('safeleaf'));
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      toast.success('All data cleared successfully');
    }
  };
  
  const getDebugInfo = () => {
    try {
      const detectedLeaves = APIService.getDetectedLeaves();
      const impactMetrics = ImpactService.getCumulativeImpact();
      const debugInfo = {
        detectedLeavesRaw: JSON.stringify(detectedLeaves, null, 2),
        impactCalculation: JSON.stringify(impactMetrics, null, 2),
        storageKeys: Object.keys(localStorage).filter(key => key.includes('safeleaf')),
        recipesReceived: APIService.getRecipeViews()?.length || 0,
        favoritesCount: APIService.getFavoriteRecipes()?.length || 0
      };
      return debugInfo;
    } catch (err) {
      console.warn('Failed to get debug info:', err);
      return {
        detectedLeavesRaw: 'Error loading data',
        impactCalculation: 'Error loading data',
        storageKeys: [],
        recipesReceived: 0,
        favoritesCount: 0
      };
    }
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
                      "absolute flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
                      isTopMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-0",
                      activeTab === id ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-muted/60"
                    )}
                    style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                    aria-label={label}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      activeTab === id ? "bg-primary-foreground/20" : "bg-background/70"
                    )}>
                      <Icon className={cn("w-4 h-4", activeTab === id ? "text-primary-foreground" : "text-foreground")} />
                    </span>
                    <span className="text-xs font-medium whitespace-nowrap">
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
      <button
        onClick={() => {
          setShowSettings(true);
          onTabChange('settings');
        }}
              className={cn(
                "p-2 rounded-full border border-border bg-background/80 hover:bg-muted transition",
                activeTab === 'settings' ? 'bg-primary text-primary-foreground' : ''
              )}
              title="Settings"
      >
              <Settings className="w-4 h-4" />
      </button>
          </div>
        </div>
      </div>

      {/* Settings Password Modal */}
      {showSettings && !isSettingsUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-background/90 rounded-3xl p-6 max-w-sm w-full border border-border shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Enter Settings Password</h3>
            <input
              type="password"
              value={settingsPassword}
              onChange={(e) => setSettingsPassword(e.target.value)}
              className="input-organic w-full p-3 mb-4 text-foreground placeholder:text-muted-foreground"
              placeholder="Password"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSettings(false);
                  setSettingsPassword("");
                  onTabChange('home'); // Reset to home tab when canceling
                }}
                className="flex-1 p-3 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 btn-organic text-primary-foreground p-3 font-medium"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {isSettingsUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-background/90 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Settings</h3>
              <button
                onClick={() => {
                  setIsSettingsUnlocked(false);
                  onTabChange('home'); // Reset to home tab when closing settings
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Roboflow API Key
                </label>
                <input
                  type="text"
                  value={roboflowApiKey}
                  onChange={(e) => setRoboflowApiKey(e.target.value)}
                  className="input-organic w-full p-3 text-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Roboflow Endpoint
                </label>
                <input
                  type="text"
                  value={roboflowEndpoint}
                  onChange={(e) => setRoboflowEndpoint(e.target.value)}
                  className="input-organic w-full p-3 text-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  className="input-organic w-full p-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OpenRouter Endpoint
                </label>
                <input
                  type="text"
                  value={openrouterEndpoint}
                  onChange={(e) => setOpenrouterEndpoint(e.target.value)}
                  className="input-organic w-full p-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  N8N Webhook URL
                </label>
                <input
                  type="text"
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                  className="input-organic w-full p-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chat Provider
                </label>
                <select
                  value={chatProvider}
                  onChange={(e) => setChatProvider(e.target.value as "openrouter" | "n8n")}
                  className="input-organic w-full p-3 text-foreground"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="n8n">N8N Webhook</option>
                </select>
              </div>
              
              {/* Visual Effects Section */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Visual Effects
                </h4>
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 glass rounded-xl mb-2">
                  <div className="flex items-center gap-2">
                    {visualSettings.theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-foreground" />
                    ) : (
                      <Sun className="w-4 h-4 text-foreground" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">Theme</div>
                      <div className="text-xs text-muted-foreground">Choose between light and dark mode</div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleTheme}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      visualSettings.theme === 'dark' ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        visualSettings.theme === 'dark' ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Neon Glow Toggle */}
                <div className="flex items-center justify-between p-3 glass rounded-xl mb-2">
                  <div className="flex items-center gap-2">
                    {visualSettings.neonGlowEnabled ? (
                      <Zap className="w-4 h-4 text-primary animate-pulse" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">Neon Glow Effects</div>
                      <div className="text-xs text-muted-foreground">Dynamic vibrant glow effects on UI elements</div>
                    </div>
                  </div>
                  <button
                    onClick={toggleNeonGlow}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      visualSettings.neonGlowEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        visualSettings.neonGlowEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Glow Intensity */}
                {visualSettings.neonGlowEnabled && (
                  <div className="p-3 glass rounded-xl mb-2">
                    <div className="text-sm font-medium text-foreground mb-2">Glow Intensity</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'subtle' as const, label: 'Subtle', icon: Eye },
                        { value: 'medium' as const, label: 'Medium', icon: Sparkles },
                        { value: 'vibrant' as const, label: 'Vibrant', icon: Zap }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setGlowIntensity(value)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                            visualSettings.glowIntensity === value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background/50 text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Particles Toggle */}
                <div className="flex items-center justify-between p-3 glass rounded-xl mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${visualSettings.particlesEnabled ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">Floating Particles</div>
                      <div className="text-xs text-muted-foreground">Animated leaf particles in the background</div>
                    </div>
                  </div>
                  <button
                    onClick={toggleParticles}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      visualSettings.particlesEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        visualSettings.particlesEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Parallax Toggle */}
                <div className="flex items-center justify-between p-3 glass rounded-xl mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 ${visualSettings.parallaxEnabled ? "border-primary bg-primary/20" : "border-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">Parallax Effects</div>
                      <div className="text-xs text-muted-foreground">Depth scrolling effects for immersive experience</div>
                    </div>
                  </div>
                  <button
                    onClick={toggleParallax}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      visualSettings.parallaxEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        visualSettings.parallaxEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Animations Toggle */}
                <div className="flex items-center justify-between p-3 glass rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${visualSettings.animationsEnabled ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">Animations</div>
                      <div className="text-xs text-muted-foreground">Smooth transitions and micro-interactions</div>
                    </div>
                  </div>
                  <button
                    onClick={toggleAnimations}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      visualSettings.animationsEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        visualSettings.animationsEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 mt-2">
                <button onClick={handleSaveSettings} className="btn-organic px-4 py-2 font-medium">
                  Save
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Settings reset to defaults on app restart
              </p>
              
              {/* Debug Controls Section */}
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Debug Controls</h4>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={addDemoData}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    <Leaf className="w-4 h-4" />
                    <span>Add Demo Data</span>
                  </button>
                  
                  <button
                    onClick={clearAllData}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Clear All Data</span>
                  </button>
                </div>
                
                {/* Debug Information Display */}
                <div className="mt-4">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                      Debug Information
                    </summary>
                    <div className="bg-muted/30 p-3 rounded-lg space-y-2 max-h-40 overflow-y-auto">
                      {(() => {
                        const debug = getDebugInfo();
                        return (
                          <div className="space-y-1">
                            <div><span className="font-medium">Recipes Viewed:</span> {debug.recipesReceived}</div>
                            <div><span className="font-medium">Favorites:</span> {debug.favoritesCount}</div>
                            <div><span className="font-medium">Storage Keys:</span> {debug.storageKeys.length}</div>
                            <div className="pt-2">
                              <div className="font-medium mb-1">Impact Data:</div>
                              <pre className="whitespace-pre-wrap text-xs">{debug.impactCalculation}</pre>
                            </div>
                          </div>
                        );
                      })()
                      }
                    </div>
                  </details>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Debug controls are password protected
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  "absolute flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
                  isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-0",
                  activeTab === id ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-muted/60"
                )}
                style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                aria-label={label}
              >
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  activeTab === id ? "bg-primary-foreground/20" : "bg-background/70"
                )}>
                  <Icon className={cn("w-4 h-4", activeTab === id ? "text-primary-foreground" : "text-foreground")} />
                </span>
                <span className="text-xs font-medium whitespace-nowrap">
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