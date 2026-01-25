import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { Leaf, Scan, ChefHat, MessageCircle, Users, Globe2, ShieldCheck, Building2, ArrowRight, Sun, Moon, Sparkles, Heart, TrendingUp, CheckCircle, Star, ChevronLeft, ChevronRight, BookOpen, RefreshCw } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useMultiParallax } from "@/hooks/useParallax";
import { useVanillaTilt, useParallaxLetters } from "@/hooks/useVanillaTilt";
import { useVisualEffects } from "@/contexts/VisualEffectsContext";
import FloatingLeaves from "@/components/effects/FloatingLeaves";

interface LandingPageProps {
  onNavigateToChat: () => void;
  onNavigateToRecipes?: () => void;
  onNavigateToScan?: () => void;
  onNavigateToLeaves?: () => void;
  onToggleTheme?: () => void;
  theme?: 'light' | 'dark'; // Add theme prop
}

export default function LandingPage({ onNavigateToChat, onNavigateToRecipes, onNavigateToScan, onNavigateToLeaves, onToggleTheme, theme = 'dark' }: LandingPageProps) {
  const { t } = useI18n();
  const { settings, toggleParticles } = useVisualEffects();
  const [showAbout, setShowAbout] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoKey, setVideoKey] = useState(0); // For forcing video reload

  // Vanilla-tilt effect for the hero title container
  const titleRef = useVanillaTilt<HTMLDivElement>({
    max: 8,
    speed: 300,
    glare: true,
    'max-glare': 0.1,
    scale: 1.02,
    perspective: 1000,
    transition: true,
    easing: 'cubic-bezier(.03,.98,.52,.99)'
  });

  // Parallax letters effect for the title text
  const lettersRef = useParallaxLetters('SafeLeafKitchen');

  // Parallax configuration for different layers - Extremely subtle for better UX and stability
  const parallaxOffsets = useMultiParallax([
    { speed: 0.005, direction: 'down' }, // Background layer (barely perceptible)
    { speed: 0.008, direction: 'down' }, // Mid background
    { speed: 0.012, direction: 'down' }, // Content sections
    { speed: 0.015, direction: 'down' }, // Floating elements
    { speed: 0.018, direction: 'down' }  // Front floating elements
  ]);

  // Team carousel state - responsive items per slide
  const [currentTeamSlide, setCurrentTeamSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const teamMembers = [
    {
      name: "Prof. Rekia Belahsen",
      role: "Directrice Scientifique",
      specialty: "Nutrition & Santé Publique",
      type: "onsite"
    },
    {
      name: "Jamila El Biyad",
      role: "Chercheuse",
      specialty: "Analyses Nutritionnelles",
      type: "onsite"
    },
    {
      name: "Abdelghani Aboukhalaf",
      role: "Coordinateur Projet",
      specialty: "Développement Application",
      type: "onsite"
    },
    {
      name: "Manal Tbatou",
      role: "Coordinatrice",
      specialty: "Coopératives",
      type: "onsite"
    },
    {
      name: "Adil Kalili",
      role: "Spécialiste",
      specialty: "Valorisation Co-produits",
      type: "onsite"
    },
    {
      name: "Reda El Bakraouy",
      role: "Lead Developer",
      specialty: "Tech Stack Architect",
      type: "onsite"
    },
    {
      name: "Prof. Hamid Chamlal",
      role: "Conseiller Académique",
      specialty: "Participation en ligne",
      type: "online"
    }
  ];

  // Responsive items per slide - calculate after teamMembers is defined
  const itemsPerSlide = isMobile ? 1 : 3;
  const totalSlides = Math.ceil(teamMembers.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentTeamSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentTeamSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentTeamSlide(index);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden pt-24">
      {/* Parallax Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/images/hero-leafy-background${theme === 'light' ? '-light' : ''}.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* Floating Leaves Particle System */}
      <FloatingLeaves
        enabled={settings.particlesEnabled}
        particleCount={20}
        className="z-[1]"
      />
      {/* Enhanced background effects with parallax */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0 parallax-bg"
        style={{ transform: `translateY(${parallaxOffsets[0]}px)` }}
      >
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-glow rounded-full opacity-20 animate-leaf-float"></div>
        <div className="absolute top-1/4 right-16 w-24 h-24 bg-gradient-glow rounded-full opacity-15 animate-leaf-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-gradient-glow rounded-full opacity-25 animate-leaf-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-glow rounded-full opacity-30 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Additional mid-background layer */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-5 parallax-bg"
        style={{ transform: `translateY(${parallaxOffsets[1]}px)` }}
      >
        <div className="absolute top-32 right-32 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-primary/5 rounded-full blur-xl"></div>
      </div>

      {/* Theme Toggle and Particle Toggle */}
      <div className="absolute top-6 left-16 z-20 flex gap-2">
        <button
          onClick={onToggleTheme}
          className="p-3 rounded-2xl border border-border glass hover:scale-105 transition-all duration-300 group"
          title="Toggle light/dark"
        >
          <Sun className="w-5 h-5 hidden dark:block text-primary group-hover:rotate-180 transition-transform duration-500" />
          <Moon className="w-5 h-5 dark:hidden text-primary group-hover:-rotate-180 transition-transform duration-500" />
        </button>

        <button
          onClick={toggleParticles}
          className={`p-3 rounded-2xl border border-border glass hover:scale-105 transition-all duration-300 group ${settings.particlesEnabled ? 'bg-primary/20' : 'bg-muted/20'
            }`}
          title="Toggle floating leaves"
        >
          <Sparkles className={`w-5 h-5 transition-all duration-500 ${settings.particlesEnabled
            ? 'text-primary group-hover:rotate-12'
            : 'text-muted-foreground group-hover:scale-110'
            }`} />
        </button>
      </div>

      {/* Full-Width Hero Section with Vanilla-Tilt Title */}
      <div className="w-full relative z-10 mt-8 mb-16">
        {/* Hero Content Container - No background image here */}
        <div className="hero-container">
          {/* Animated SafeLeafKitchen Title with Parallax Letters */}
          <div className="text-center mb-8">
            <div
              ref={titleRef}
              className="hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6 inline-block whitespace-nowrap"
              style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
            >
              <div ref={lettersRef} className="parallax-letters-container" />
            </div>
          </div>

          {/* Content Section with Enhanced Readability */}
          <div className="hero-content">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge with subtle floating effect */}
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 group cursor-default">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">{t('landing.hero.badge')}</span>
              </div>

              <p className="text-lg md:text-xl leading-relaxed mb-6 max-w-3xl mx-auto text-muted-foreground">
                {t('landing.tagline')}
              </p>
              <a
                href="/downloads/Recipes.pdf"
                download
                className="inline-block px-6 py-3 mt-4 bg-gradient-to-r from-green-600 to-amber-800 text-white rounded-md hover:opacity-90 transition-opacity"
              >
                <BookOpen className="w-4 h-4 mr-2 inline-block align-middle" />
                Download Recipes Cookbook
              </a>

              <div className="flex items-center gap-2 mb-8 justify-center">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm font-medium">{t('landing.hero.trusted')}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
                <button
                  onClick={onNavigateToScan}
                  className="btn-organic px-8 py-4 text-lg font-semibold text-primary-foreground flex items-center gap-3 justify-center hover:scale-105 transition-all duration-300 shadow-glow group"
                >
                  <Scan className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  {t('landing.scanNow')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button
                  onClick={onNavigateToChat}
                  className="px-8 py-4 rounded-2xl border border-border text-foreground glass hover:scale-105 transition-all duration-300 flex items-center gap-3 justify-center group"
                >
                  <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  {t('landing.askAssistant')}
                </button>
                <button
                  onClick={onNavigateToLeaves}
                  className="px-8 py-4 rounded-2xl bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground font-semibold flex items-center gap-3 justify-center hover:scale-105 transition-all duration-300 shadow-glow group"
                >
                  <Leaf className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  {t('landing.leavesEncyclopedia')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm justify-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{t('landing.hero.leafSpecies')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{t('landing.hero.scientificParams')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{t('landing.hero.moroccanRecipes')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Tutorial Section */}
      <div
        className="w-full max-w-4xl mb-20"
        style={{ transform: `translateY(${parallaxOffsets[1]}px)` }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.video.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.video.subtitle')}</p>
        </div>

        <div className="glass rounded-3xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 group">
          <div className="aspect-video bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center relative">
            {videoError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-20">
                <p className="text-muted-foreground mb-4">{t('landing.video.error')}</p>
                <button
                  onClick={() => {
                    setVideoError(false);
                    setVideoKey(prev => prev + 1);
                  }}
                  className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <video
                key={videoKey}
                onError={(e) => {
                  logger.error('Video error:', e.currentTarget.error);
                  setVideoError(true);
                }}
                onCanPlay={() => logger.debug('Video can play')}
                onLoadedData={() => logger.debug('Video loaded data')}
                className="w-full h-full object-cover"
                controls
                preload="auto"
                autoPlay
                muted
                playsInline
                src="/videos/safeleafkitchen-tutorial.mp4"
              >
                <source src="/videos/safeleafkitchen-tutorial.mp4" type="video/mp4" />
              </video>
            )}

            {/* Video overlay for better visual integration */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${videoError ? 'hidden' : ''}`} />
          </div>

          {/* Video description */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                <div className="w-0 h-0 border-l-[8px] border-l-primary-foreground border-y-[6px] border-y-transparent ml-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.video.watchTitle')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t('landing.video.description')}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-foreground">{t('landing.video.features.scanning')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-foreground">{t('landing.video.features.chat')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-foreground">{t('landing.video.features.recipes')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Problem Section with Subtle Parallax */}
      <div
        className="w-full max-w-6xl mb-20"
        style={{ transform: `translateY(${parallaxOffsets[1]}px)` }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.problem.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t('landing.problem.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center group">
            <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl font-bold text-destructive">⅓</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.problem.foodWasted.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.problem.foodWasted.desc')}</p>
          </div>

          <div className="text-center group">
            <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.problem.leavesDiscarded.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.problem.leavesDiscarded.desc')}</p>
          </div>

          <div className="text-center group">
            <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.problem.moneyLost.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.problem.moneyLost.desc')}</p>
          </div>

          <div className="text-center group">
            <div className="w-20 h-20 bg-destructive/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">❓</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.problem.unknownValue.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.problem.unknownValue.desc')}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Value Propositions with Subtle Parallax */}
      <div
        className="w-full max-w-6xl grid md:grid-cols-3 gap-6 mb-20"
        style={{ transform: `translateY(${parallaxOffsets[2]}px)` }}
      >
        <button onClick={onNavigateToScan} className="glass p-6 rounded-3xl text-center group hover:scale-105 hover:shadow-glow transition-all duration-300 border border-border/50">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-6 transition-transform duration-300 shadow-organic">
            <Scan className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.smartScanning')}</h3>
          <p className="text-sm text-muted-foreground">{t('landing.valueProps.scanning.desc')}</p>
        </button>

        <button onClick={onNavigateToRecipes} className="glass p-6 rounded-3xl text-center group hover:scale-105 hover:shadow-glow transition-all duration-300 border border-border/50">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-6 transition-transform duration-300 shadow-organic">
            <ChefHat className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.recipeIdeas')}</h3>
          <p className="text-sm text-muted-foreground">{t('landing.valueProps.recipes.desc')}</p>
        </button>

        <button onClick={onNavigateToChat} className="glass p-6 rounded-3xl text-center group hover:scale-105 hover:shadow-glow transition-all duration-300 border border-border/50">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-6 transition-transform duration-300 shadow-organic">
            <MessageCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.chatAndNutrition')}</h3>
          <p className="text-sm text-muted-foreground">{t('landing.valueProps.chat.desc')}</p>
        </button>
      </div>

      {/* Enhanced Context Cards */}
      <div className="w-full max-w-6xl grid md:grid-cols-3 gap-6 mb-20">
        <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('landing.moroccanHouseholds')}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('landing.moroccanBody')}
          </p>
        </div>

        <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Globe2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('landing.globalImpact')}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('landing.globalBody')}
          </p>
        </div>

        <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('landing.scienceBacked')}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('landing.scienceBody')}
          </p>
        </div>
      </div>

      {/* Success Metrics & Impact with Subtle Parallax */}
      <div
        className="w-full max-w-6xl mb-20"
        style={{ transform: `translateY(${parallaxOffsets[1]}px)` }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.metrics.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.metrics.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center glass p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">2.1M</div>
            <div className="text-sm text-muted-foreground mb-1">{t('landing.metrics.units.tonnesYear')}</div>
            <h3 className="text-lg font-semibold text-foreground">{t('landing.metrics.coproducts.title')}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t('landing.metrics.coproducts.desc')}</p>
          </div>

          <div className="text-center glass p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">30.8%</div>
            <div className="text-sm text-muted-foreground mb-1">{t('landing.metrics.units.proteinContent')}</div>
            <h3 className="text-lg font-semibold text-foreground">{t('landing.metrics.nutritional.title')}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t('landing.metrics.nutritional.desc')}</p>
          </div>

          <div className="text-center glass p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">120</div>
            <div className="text-sm text-muted-foreground mb-1">{t('landing.metrics.units.madSavedPerKg')}</div>
            <h3 className="text-lg font-semibold text-foreground">{t('landing.metrics.economic.title')}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t('landing.metrics.economic.desc')}</p>
          </div>
        </div>
      </div>

      {/* Enhanced How it Works */}
      <div className="w-full max-w-6xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.howItWorks')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.howItWorks.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-3xl border border-border/50 text-center group hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground group-hover:rotate-12 transition-transform duration-300">1</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.howItWorks.step1.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.hiw.1')}</p>
          </div>

          <div className="glass p-6 rounded-3xl border border-border/50 text-center group hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground group-hover:rotate-12 transition-transform duration-300">2</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.howItWorks.step2.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.hiw.2')}</p>
          </div>

          <div className="glass p-6 rounded-3xl border border-border/50 text-center group hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground group-hover:rotate-12 transition-transform duration-300">3</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.howItWorks.step3.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.hiw.3')}</p>
          </div>

          <div className="glass p-6 rounded-3xl border border-border/50 text-center group hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground group-hover:rotate-12 transition-transform duration-300">4</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('landing.howItWorks.step4.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('landing.hiw.4')}</p>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="w-full max-w-6xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.audience.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.audience.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="glass p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Star className="w-6 h-6 text-primary" />
              {t('landing.audience.primary.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary">👩‍👧‍👦</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('landing.audience.ecoFamilies.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.audience.ecoFamilies.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                  <ChefHat className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('landing.audience.homeCooks.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.audience.homeCooks.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('landing.audience.healthFocused.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.audience.healthFocused.desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border border-border/50">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-accent" />
              {t('landing.audience.secondary.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-accent">🎓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('landing.audience.students.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.audience.students.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mt-0.5">
                  <Building2 className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('landing.audience.restaurants.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.audience.restaurants.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-accent">📱</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('landing.audience.influencers.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.audience.influencers.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Partners Section */}
      <div className="w-full max-w-6xl mb-16">
        <div className="glass p-8 rounded-3xl border border-border/50 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{t('landing.partners')}</h3>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            {t('landing.partnersBody')}
          </p>
        </div>
      </div>

      {/* Team Carousel Section */}
      <div className="w-full max-w-6xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.team.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t('landing.team.subtitle')}</p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group hidden sm:flex"
            aria-label="Previous team members"
          >
            <ChevronLeft className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group hidden sm:flex"
            aria-label="Next team members"
          >
            <ChevronRight className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
          </button>

          {/* Carousel Track */}
          <div
            className="overflow-hidden mx-0 sm:mx-14"
            onTouchStart={(e) => {
              const touchStart = e.touches[0].clientX;
              const handleTouchEnd = (endEvent: TouchEvent) => {
                const touchEnd = endEvent.changedTouches[0].clientX;
                const diff = touchStart - touchEnd;
                if (Math.abs(diff) > 50) { // minimum swipe distance
                  if (diff > 0) {
                    nextSlide();
                  } else {
                    prevSlide();
                  }
                }
                document.removeEventListener('touchend', handleTouchEnd);
              };
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTeamSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className={`grid gap-6 px-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
                    }`}>
                    {teamMembers.slice(slideIndex * itemsPerSlide, slideIndex * itemsPerSlide + itemsPerSlide).map((member, memberIndex) => (
                      <div
                        key={member.name}
                        className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group text-center hover:scale-105 hover:shadow-glow"
                      >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition-transform duration-300 ${member.type === 'online'
                          ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground'
                          : 'bg-gradient-primary text-primary-foreground'
                          }`}>
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-1">{member.name}</h4>
                        <p className={`text-sm font-semibold mb-2 ${member.type === 'online' ? 'text-accent' : 'text-primary'
                          }`}>{member.role}</p>
                        <p className="text-xs text-muted-foreground">{member.specialty}</p>
                        {member.type === 'online' && (
                          <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-accent/20 rounded-full">
                            <Globe2 className="w-3 h-3 text-accent" />
                            <span className="text-xs text-accent font-medium">{t('landing.team.online')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${currentTeamSlide === index
                  ? 'bg-primary shadow-glow'
                  : 'bg-border hover:bg-primary/50'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Acknowledgments Section */}
      <div className="w-full max-w-6xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.acknowledgments.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t('landing.acknowledgments.subtitle')}</p>
        </div>

        {/* Organizers & Sponsors */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">{t('landing.acknowledgments.organizers')}</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group text-center hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                <img
                  src="/images/logos/fao.svg"
                  alt="FAO Logo"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-primary rounded-full flex items-center justify-center">
                  <Globe2 className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">FAO</h4>
              <p className="text-sm text-muted-foreground">{t('landing.acknowledgments.fao.desc')}</p>
            </div>

            <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/330 transition-all duration-300 group text-center hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                <img
                  src="/images/logos/brightidea.svg"
                  alt="BrightIdea Logo"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-primary rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">BrightIdea</h4>
              <p className="text-sm text-muted-foreground">{t('landing.acknowledgments.brightidea.desc')}</p>
            </div>

            <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group text-center hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                <img
                  src="/images/logos/innovation-hub.svg"
                  alt="Innovation Hub Logo"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-primary rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Innovation Hub</h4>
              <p className="text-sm text-muted-foreground">{t('landing.acknowledgments.innovationhub.desc')}</p>
            </div>

            <div className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-300 group text-center hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                <img
                  src="/images/logos/universites.svg"
                  alt="Universités Logo"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-primary rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Universités</h4>
              <p className="text-sm text-muted-foreground">{t('landing.acknowledgments.universities.desc')}</p>
            </div>
          </div>
        </div>

        {/* Special Thanks */}
        <div className="glass p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent text-center">
          <h3 className="text-2xl font-bold text-foreground mb-6">{t('landing.acknowledgments.specialThanks')}</h3>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-foreground leading-relaxed mb-4">
              <span className="font-semibold text-primary">FAO Hack4SafeFood Challenge 2025</span> {t('landing.acknowledgments.faoHack')}
            </p>
            <div className="w-16 h-1 bg-gradient-primary mx-auto mt-6"></div>
          </div>
        </div>
      </div>

      {/* Value Proposition & Access */}
      <div className="w-full max-w-6xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.access.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.access.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative">
            <div className="absolute -top-4 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">{t('landing.access.mostPopular')}</div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">{t('landing.access.freeAccess')}</h3>
              <div className="text-4xl font-bold text-primary mb-2">0<span className="text-lg text-muted-foreground">MAD</span></div>
              <p className="text-sm text-muted-foreground">{t('landing.access.perfectStart')}</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>{t('landing.access.features.aiScans')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>{t('landing.access.features.basicRecipes')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>{t('landing.access.features.nutritionalInfo')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>{t('landing.access.features.basicTracking')}</span>
              </li>
            </ul>
            <button
              onClick={onNavigateToScan}
              className="w-full btn-organic py-3 text-center font-semibold text-primary-foreground hover:scale-105 transition-all duration-300"
            >
              {t('landing.access.startFree')}
            </button>
          </div>

          <div className="glass p-8 rounded-3xl border border-border/50">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">{t('landing.access.premiumFeatures')}</h3>
              <div className="text-3xl font-bold text-foreground mb-2">{t('landing.access.comingSoon')}</div>
              <p className="text-sm text-muted-foreground">{t('landing.access.enhancedExperience')}</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <Star className="w-5 h-5 text-accent" />
                <span>{t('landing.access.features.unlimitedScans')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Star className="w-5 h-5 text-accent" />
                <span>{t('landing.access.features.exclusiveRecipes')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Star className="w-5 h-5 text-accent" />
                <span>{t('landing.access.features.advancedAnalytics')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Star className="w-5 h-5 text-accent" />
                <span>{t('landing.access.features.familyAccounts')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Star className="w-5 h-5 text-accent" />
                <span>{t('landing.access.features.priorityAccess')}</span>
              </li>
            </ul>
            <button className="w-full px-6 py-3 rounded-2xl border border-border glass text-center font-medium transition-all duration-300 opacity-75 cursor-not-allowed">
              {t('landing.access.notifyWhenAvailable')}
            </button>
          </div>
        </div>
      </div>

      {/* Community & Future Features */}
      <div className="w-full max-w-6xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('landing.future.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.future.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-3xl border border-border/50 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-4 right-4 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium">{t('landing.future.title')}</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('landing.future.communityHub.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing.future.communityHub.desc')}</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.shareRecipes')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.joinChallenges')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.getTips')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.followInfluencers')}
              </li>
            </ul>
          </div>

          <div className="glass p-8 rounded-3xl border border-border/50 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-4 right-4 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium">{t('landing.future.beta')}</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('landing.future.wasteTracker.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('landing.future.wasteTracker.desc')}</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.trackCO2')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.monitorSavings')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.visualizeImpact')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.future.features.setGoals')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom CTA */}
      <div className="w-full max-w-6xl">
        <div className="glass p-8 rounded-3xl border border-border/50 text-center">
          <blockquote className="text-xl md:text-2xl font-medium text-foreground mb-2 italic">
            {t('landing.bottomCtaQuote')}
          </blockquote>
          <div className="w-16 h-1 bg-gradient-primary mx-auto mb-8"></div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onNavigateToScan}
              className="btn-organic px-8 py-4 text-lg font-semibold text-primary-foreground flex items-center gap-3 hover:scale-105 transition-all duration-300 shadow-glow group"
            >
              <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              {t('landing.startScanning')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            <div className="flex gap-3">
              <button
                onClick={onNavigateToRecipes}
                className="px-6 py-3 rounded-2xl border border-border glass hover:scale-105 transition-all duration-300 text-sm font-medium"
              >
                {t('landing.exploreRecipes')}
              </button>
              <button
                onClick={onNavigateToLeaves}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground font-medium rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-glow text-sm"
              >
                <Leaf className="w-4 h-4 transition-transform group-hover:rotate-12" />
                {t('landing.leavesEncyclopedia')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Attribution removed to keep a single footer */}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto mt-10 mb-4 text-center relative z-20">
        <div className="pt-4 text-sm text-foreground/80">
          <span>© {new Date().getFullYear()} SafeLeafKitchen</span>
          <span className="mx-2">•</span>
          <button
            onClick={() => setShowAbout(true)}
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            About
          </button>
        </div>
      </footer>

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAbout(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative glass rounded-3xl border border-border/60 max-w-md w-full p-6 text-left shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <h3 className="text-xl font-bold text-foreground">About SafeLeafKitchen</h3>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                SafeLeafKitchen is a research-driven initiative founded on the scientific vision of
                <a href="https://www.researchgate.net/profile/Jamila-Elbiyad" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline ml-1">
                  Dr. Jamila El Biyad
                </a>, whose work is the primary driver behind the application. Her research at the intersection of food safety, nutrition, ecology, and resource valuation directly inspired the creation of this platform.
              </p>
              <p>
                By translating scientific research into an accessible digital tool, SafeLeafKitchen serves consumers, researchers, and nutrition professionals, while contributing to improved public health, ecological sustainability, and the economic valorization of Moroccan natural resources.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm"
                aria-label="Close about dialog"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}