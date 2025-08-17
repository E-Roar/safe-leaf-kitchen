import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { setupPWAInstallPrompt, showInstallPrompt, isStandalone } from "@/utils/pwaUtils";

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Don't show if already in PWA mode
    if (isStandalone()) {
      return;
    }

    setupPWAInstallPrompt();

    const checkInstallable = () => {
      setIsInstallable('beforeinstallprompt' in window);
    };

    window.addEventListener('beforeinstallprompt', () => {
      setIsInstallable(true);
      // Show prompt after user has used the app for a bit
      setTimeout(() => setShowPrompt(true), 10000);
    });

    checkInstallable();
  }, []);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if dismissed in this session or not installable
  if (!showPrompt || !isInstallable || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40">
      <div className="glass rounded-2xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Download className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Install SafeLeafKitchen
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Add to your home screen for quick access and offline use
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="btn-organic px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}