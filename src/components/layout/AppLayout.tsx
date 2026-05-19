import { useState, useEffect } from "react";
import { Home, MessageCircle, BarChart3, ChefHat, Leaf, User, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityService } from "@/services/communityService";
import type { Profile } from "@/types/community";
import AuthModal from "@/components/auth/AuthModal";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: "home" | "chat" | "stats" | "recipes" | "leaves" | "settings" | "profile";
  onTabChange: (tab: "home" | "chat" | "stats" | "recipes" | "leaves" | "settings" | "profile") => void;
}

const mainTabs = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "chat" as const, icon: MessageCircle, label: "Chat" },
  { id: "stats" as const, icon: BarChart3, label: "Stats" },
  { id: "recipes" as const, icon: ChefHat, label: "Recipes" },
  { id: "leaves" as const, icon: Leaf, label: "Leaves" },
];

export default function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const { setLanguage, lang } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (user) {
      CommunityService.getProfile(user.id).then(setProfile);
      CommunityService.getUnreadNotificationCount(user.id).then(setUnreadCount);

      const interval = setInterval(() => {
        CommunityService.getUnreadNotificationCount(user.id).then(setUnreadCount);
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setProfile(null);
      setUnreadCount(0);
    }
  }, [user]);

  const handleProfileClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      onTabChange("profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-glow rounded-full opacity-30 animate-leaf-float"></div>
        <div className="absolute top-1/3 right-8 w-16 h-16 bg-gradient-glow rounded-full opacity-20 animate-leaf-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-glow rounded-full opacity-25 animate-leaf-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-2 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTabChange('home')}
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mr-2 hover:opacity-90 transition-opacity shrink-0"
              aria-label="Home"
            >
              <Leaf className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="w-9 h-9 rounded-full border border-border bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-semibold"
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

            {user && (
              <button 
                className="relative w-9 h-9 rounded-full border border-border bg-background/80 flex items-center justify-center hover:bg-muted transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[9px] font-black text-white rounded-full flex items-center justify-center ring-2 ring-background animate-in zoom-in duration-300">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="w-9 h-9 rounded-full border border-amber-400/50 bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 transition-all"
                title="Admin Dashboard"
              >
                <Shield className="w-4 h-4 text-amber-500" />
              </button>
            )}

            <button
              onClick={handleProfileClick}
              className={cn(
                "w-9 h-9 rounded-full border border-border bg-background/80 flex items-center justify-center transition-all overflow-hidden",
                activeTab === "profile" ? "ring-2 ring-primary border-transparent" : "hover:bg-muted"
              )}
              title="Profile"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : profile?.avatar_emoji ? (
                <span className="text-sm">{profile.avatar_emoji}</span>
              ) : (
                <User className="w-4 h-4 text-foreground" />
              )}
            </button>


          </div>
        </div>
      </div>

      <main className="min-h-screen transition-all duration-300 ease-in-out pb-20">
        <div className="h-full pt-14">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainTabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 flex-1 transition-colors",
                activeTab === id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                activeTab === id && "fill-primary/20"
              )} />
              <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
