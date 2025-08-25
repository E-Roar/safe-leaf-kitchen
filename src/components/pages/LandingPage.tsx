import { Leaf, Scan, ChefHat, MessageCircle, Users, Globe2, ShieldCheck, Building2, ArrowRight, Sun, Moon } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface LandingPageProps {
  onNavigateToChat: () => void;
  onNavigateToRecipes?: () => void;
  onNavigateToScan?: () => void;
  onNavigateToLeaves?: () => void;
  onToggleTheme?: () => void;
}

export default function LandingPage({ onNavigateToChat, onNavigateToRecipes, onNavigateToScan, onNavigateToLeaves, onToggleTheme }: LandingPageProps) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-12 relative">
      {/* Theme Toggle */}
      <button
        onClick={onToggleTheme}
        className="absolute top-4 left-16 z-20 p-2 rounded-full border border-border bg-background/70 backdrop-blur-sm hover:bg-muted transition-colors"
        title="Toggle light/dark"
      >
        <Sun className="w-4 h-4 hidden dark:block" />
        <Moon className="w-4 h-4 dark:hidden" />
      </button>
      {/* Hero */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center mb-14">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            SafeLeaf<span className="text-primary">Kitchen</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
            {t('landing.tagline')}
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t('landing.fact')}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={onNavigateToScan}
              className="btn-organic px-6 py-3 text-base font-semibold text-primary-foreground flex items-center gap-2"
            >
              <Scan className="w-5 h-5" />
              {t('landing.scanNow')}
            </button>
            <button
              onClick={onNavigateToChat}
              className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t('landing.askAssistant')}
            </button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {t('landing.sources')}
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 md:w-36 md:h-36 bg-gradient-primary rounded-full flex items-center justify-center shadow-leaf animate-leaf-float">
              <Leaf className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground" />
            </div>
            <div className="absolute inset-0 bg-gradient-glow rounded-full opacity-60 animate-pulse-glow"></div>
          </div>
        </div>
      </div>

      {/* Value props with clickable shortcuts */}
      <div className="w-full max-w-5xl grid grid-cols-3 gap-4 mb-12">
        <button onClick={onNavigateToScan} className="text-center group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto group-hover:scale-105 transition-transform">
            <Scan className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">{t('landing.smartScanning')}</p>
        </button>
        <button onClick={onNavigateToRecipes} className="text-center group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto group-hover:scale-105 transition-transform">
            <ChefHat className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">{t('landing.recipeIdeas')}</p>
        </button>
        <button onClick={onNavigateToChat} className="text-center group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto group-hover:scale-105 transition-transform">
            <MessageCircle className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">{t('landing.chatAndNutrition')}</p>
        </button>
      </div>

      {/* Moroccan context */}
      <div className="w-full max-w-5xl grid md:grid-cols-3 gap-4 mb-12">
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-foreground font-semibold"><Users className="w-4 h-4" /> {t('landing.moroccanHouseholds')}</div>
          <p className="text-sm text-muted-foreground">
            {t('landing.moroccanBody')}
          </p>
        </div>
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-foreground font-semibold"><Globe2 className="w-4 h-4" /> {t('landing.globalImpact')}</div>
          <p className="text-sm text-muted-foreground">
            {t('landing.globalBody')}
          </p>
        </div>
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-foreground font-semibold"><ShieldCheck className="w-4 h-4" /> {t('landing.scienceBacked')}</div>
          <p className="text-sm text-muted-foreground">
            {t('landing.scienceBody')}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-xl font-semibold mb-3">{t('landing.howItWorks')}</h2>
        <div className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <div className="glass p-4 rounded-xl">{t('landing.hiw.1')}</div>
          <div className="glass p-4 rounded-xl">{t('landing.hiw.2')}</div>
          <div className="glass p-4 rounded-xl">{t('landing.hiw.3')}</div>
          <div className="glass p-4 rounded-xl">{t('landing.hiw.4')}</div>
        </div>
      </div>

      {/* Partners */}
      <div className="w-full max-w-5xl mb-10">
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3 font-semibold text-foreground"><Building2 className="w-4 h-4" /> {t('landing.partners')}</div>
          <div className="text-sm text-muted-foreground">
            {t('landing.partnersBody')}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground max-w-xl">
          {t('landing.bottomCtaQuote')}
        </p>
        <div className="flex gap-3">
          <button onClick={onNavigateToScan} className="btn-organic px-5 py-3 text-sm font-semibold text-primary-foreground flex items-center gap-2">
            {t('landing.startScanning')} <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onNavigateToRecipes} className="px-5 py-3 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors">
            {t('landing.exploreRecipes')}
          </button>
          <button onClick={onNavigateToLeaves} className="px-5 py-3 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors">
            {t('landing.leavesEncyclopedia')}
          </button>
        </div>
      </div>
    </div>
  );
}