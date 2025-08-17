import { useState } from "react";
import { Home, MessageCircle, BarChart3, Settings, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsService } from "@/services/settingsService";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: "home" | "chat" | "stats";
  onTabChange: (tab: "home" | "chat" | "stats") => void;
}

export default function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(true);

  const initialSettings = SettingsService.getSettings();
  const [roboflowApiKey, setRoboflowApiKey] = useState(initialSettings.roboflowApiKey);
  const [roboflowEndpoint, setRoboflowEndpoint] = useState(initialSettings.roboflowEndpoint);
  const [openrouterApiKey, setOpenrouterApiKey] = useState(initialSettings.openrouterApiKey);
  const [openrouterEndpoint, setOpenrouterEndpoint] = useState(initialSettings.openrouterEndpoint);

  const tabs = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "chat" as const, icon: MessageCircle, label: "Chat" },
    { id: "stats" as const, icon: BarChart3, label: "Insights" },
  ];

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handlePasswordSubmit = () => {
    if (settingsPassword === "hidachi") {
      setIsSettingsUnlocked(true);
      setShowSettings(false);
      setSettingsPassword("");
    } else {
      alert("Incorrect password");
      setSettingsPassword("");
    }
  };

  const handleSaveSettings = () => {
    SettingsService.update({
      roboflowApiKey,
      roboflowEndpoint,
      openrouterApiKey,
      openrouterEndpoint,
    });
    toast.success("Settings saved. Changes apply immediately for this session.");
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-glow rounded-full opacity-30 animate-leaf-float"></div>
        <div className="absolute top-1/3 right-8 w-16 h-16 bg-gradient-glow rounded-full opacity-20 animate-leaf-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-glow rounded-full opacity-25 animate-leaf-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Settings button */}
      <button
        onClick={handleSettingsClick}
        className="absolute top-4 right-4 z-50 p-3 glass rounded-full glow transition-all duration-300 hover:scale-110"
      >
        <Settings className="w-5 h-5 text-primary" />
      </button>

      {/* Settings Password Modal */}
      {showSettings && !isSettingsUnlocked && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 max-w-sm w-full">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Settings</h3>
              <button
                onClick={() => setIsSettingsUnlocked(false)}
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
              <div className="flex gap-3 mt-2">
                <button onClick={handleSaveSettings} className="btn-organic px-4 py-2 font-medium">
                  Save
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Settings reset to defaults on app restart
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        isNavExpanded ? "pb-24" : "pb-12"
      )}>
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 glass border-t border-border transition-all duration-300 ease-in-out",
        isNavExpanded ? "h-24" : "h-12"
      )}>
        {/* Toggle button */}
        <div className="flex justify-center -mt-3 mb-2">
          <button
            onClick={() => setIsNavExpanded(!isNavExpanded)}
            className="p-2 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-background/90 transition-all duration-300"
          >
            {isNavExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Navigation tabs - only visible when expanded */}
        <div className={cn(
          "flex items-center justify-around transition-all duration-300 ease-in-out",
          isNavExpanded ? "p-3 opacity-100 h-16" : "p-0 opacity-0 pointer-events-none h-0 overflow-hidden"
        )}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-full transition-all duration-300 min-w-[60px]",
                activeTab === id
                  ? "text-primary bg-primary/20 scale-110 shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}