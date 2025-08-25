import { Leaf, Scan, ChefHat, MessageCircle, Users, Globe2, ShieldCheck, Building2, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onNavigateToChat: () => void;
  onNavigateToRecipes?: () => void;
  onNavigateToScan?: () => void;
  onNavigateToLeaves?: () => void;
}

export default function LandingPage({ onNavigateToChat, onNavigateToRecipes, onNavigateToScan, onNavigateToLeaves }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-12 relative">
      {/* Hero */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center mb-14">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            SafeLeaf<span className="text-primary">Kitchen</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
            Scannez • Découvrez • Cuisinez — AI that helps Moroccan households transform commonly discarded vegetable leaves into nutritious, affordable meals.
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            1.3 billion tonnes of food are wasted each year, causing 3.3 Gt CO₂-eq emissions and wasting 250 km³ of water. In the NENA region, 69 million people face undernourishment while 83% of countries face severe water stress. SafeLeafKitchen turns overlooked leaves into value — for health, wallets, and the planet.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={onNavigateToScan}
              className="btn-organic px-6 py-3 text-base font-semibold text-primary-foreground flex items-center gap-2"
            >
              <Scan className="w-5 h-5" />
              Scan Now
            </button>
            <button
              onClick={onNavigateToChat}
              className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Ask the Assistant
            </button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Sources: FAO Food Waste (2011), FAO SOFI (2023), FAO Water Stress (2021)
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
          <p className="text-xs md:text-sm text-muted-foreground">Smart Scanning</p>
        </button>
        <button onClick={onNavigateToRecipes} className="text-center group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto group-hover:scale-105 transition-transform">
            <ChefHat className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">Recipe Ideas</p>
        </button>
        <button onClick={onNavigateToChat} className="text-center group">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto group-hover:scale-105 transition-transform">
            <MessageCircle className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">Chat & Nutrition Facts</p>
        </button>
      </div>

      {/* Moroccan context */}
      <div className="w-full max-w-5xl grid md:grid-cols-3 gap-4 mb-12">
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-foreground font-semibold"><Users className="w-4 h-4" /> For Moroccan households</div>
          <p className="text-sm text-muted-foreground">
            Morocco cultivates ~8.7M hectares and supports ~4M agricultural jobs. Co-products reach ~2.1M tonnes/year, with a potential economic value near €420M. SafeLeafKitchen helps families valorize edible leaves using trusted recipes and safety guidance.
          </p>
        </div>
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-foreground font-semibold"><Globe2 className="w-4 h-4" /> Global impact</div>
          <p className="text-sm text-muted-foreground">
            Cutting avoidable waste by even 20% across targeted users reduces emissions and pressure on water and land. Community adoption through cooperatives can scale traceability and local value chains.
          </p>
        </div>
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-foreground font-semibold"><ShieldCheck className="w-4 h-4" /> Science-backed</div>
          <p className="text-sm text-muted-foreground">
            AI recognition for 9 species with 129 validated scientific parameters. Nutrition examples: Turnip leaves up to 30.8% protein; Beet leaves ~2840 mg Ca/100g; Kohlrabi leaves rich in antioxidants.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-xl font-semibold mb-3">How it works</h2>
        <div className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <div className="glass p-4 rounded-xl">1. Scan with your smartphone</div>
          <div className="glass p-4 rounded-xl">2. AI identifies the leaf</div>
          <div className="glass p-4 rounded-xl">3. Analyze nutrition profile</div>
          <div className="glass p-4 rounded-xl">4. Cook with guided recipes</div>
        </div>
      </div>

      {/* Partners */}
      <div className="w-full max-w-5xl mb-10">
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3 font-semibold text-foreground"><Building2 className="w-4 h-4" /> Partners</div>
          <div className="text-sm text-muted-foreground">
            Led with support from FAO (Food and Agriculture Organization) with technology and research partners in Morocco and beyond. Cooperative integration and traceability by design.
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground max-w-xl">
          “Together, let’s transform today’s waste into tomorrow’s resources for a sustainable food future.”
        </p>
        <div className="flex gap-3">
          <button onClick={onNavigateToScan} className="btn-organic px-5 py-3 text-sm font-semibold text-primary-foreground flex items-center gap-2">
            Start Scanning <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onNavigateToRecipes} className="px-5 py-3 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors">
            Explore Recipes
          </button>
          <button onClick={onNavigateToLeaves} className="px-5 py-3 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors">
            Leaves Encyclopedia
          </button>
        </div>
      </div>
    </div>
  );
}