import { useState } from "react";
import { SettingsService, type AppSettings } from "@/services/settingsService";
import { useI18n } from "@/hooks/useI18n";
import { Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useI18n();
  const currentSettings = SettingsService.getSettings();
  
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Default password - in a real app, this should be properly secured
  const SETTINGS_PASSWORD = "hidachi";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Trim whitespace and compare passwords
    const trimmedPassword = password.trim();
    const trimmedSettingsPassword = SETTINGS_PASSWORD.trim();
    
    if (trimmedPassword === trimmedSettingsPassword) {
      setIsAuthenticated(true);
      toast.success(t('settings.authSuccess'));
    } else {
      // Log for debugging purposes
      console.log('Password mismatch:', {
        entered: `"${trimmedPassword}"`,
        expected: `"${trimmedSettingsPassword}"`,
        enteredLength: trimmedPassword.length,
        expectedLength: trimmedSettingsPassword.length
      });
      toast.error(t('settings.authFailed'));
    }
  };

  const handleSave = () => {
    SettingsService.update(settings);
    toast.success(t('settings.saved'));
  };

  const handleReset = () => {
    setSettings(SettingsService.defaults);
    toast.info(t('settings.reset'));
  };

  const handleChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="glass p-8 rounded-3xl border border-border/50 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('settings.passwordTitle')}</h2>
            <p className="text-muted-foreground">{t('settings.passwordSubtitle')}</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('settings.passwordPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full btn-organic py-3 font-semibold text-primary-foreground hover:scale-105 transition-all duration-300"
            >
              {t('settings.unlock')}
            </button>
          </form>
          
          <button
            onClick={onBack}
            className="w-full mt-4 px-4 py-3 rounded-2xl border border-border glass text-center font-medium hover:bg-muted/50 transition-colors"
          >
            {t('settings.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-2xl border border-border glass font-medium hover:bg-muted/50 transition-colors"
            >
              {t('settings.back')}
            </button>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 rounded-2xl border border-border bg-primary text-primary-foreground font-medium hover:scale-105 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="glass p-6 rounded-3xl border border-border/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">{t('settings.apiSettings')}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border glass text-sm hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t('settings.reset')}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:scale-105 transition-all duration-300"
              >
                <Save className="w-4 h-4" />
                {t('settings.save')}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.roboflowApiKey')}
              </label>
              <div className="relative">
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.roboflowApiKey}
                  onChange={(e) => handleChange('roboflowApiKey', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showApiKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.roboflowEndpoint')}
              </label>
              <input
                type="text"
                value={settings.roboflowEndpoint}
                onChange={(e) => handleChange('roboflowEndpoint', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.openrouterApiKey')}
              </label>
              <div className="relative">
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.openrouterApiKey}
                  onChange={(e) => handleChange('openrouterApiKey', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showApiKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.openrouterEndpoint')}
              </label>
              <input
                type="text"
                value={settings.openrouterEndpoint}
                onChange={(e) => handleChange('openrouterEndpoint', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.n8nWebhookUrl')}
              </label>
              <input
                type="text"
                value={settings.n8nWebhookUrl}
                onChange={(e) => handleChange('n8nWebhookUrl', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.chatProvider')}
              </label>
              <select
                value={settings.chatProvider}
                onChange={(e) => handleChange('chatProvider', e.target.value as any)}
                className="w-full px-4 py-33 rounded-2xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="n8n">n8n Webhook</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>{t('settings.footer')}</p>
        </div>
      </div>
    </div>
  );
}