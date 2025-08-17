import { Leaf, Scan, ChefHat } from "lucide-react";

interface LandingPageProps {
  onNavigateToChat: () => void;
}

export default function LandingPage({ onNavigateToChat }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Floating leaf icon */}
      <div className="mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center shadow-leaf animate-leaf-float">
            <Leaf className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 bg-gradient-glow rounded-full opacity-60 animate-pulse-glow"></div>
        </div>
      </div>

      {/* App title and description */}
      <div className="text-center mb-12 max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
          SafeLeaf
          <span className="text-primary">Kitchen</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Discover the nutritional power of nature's greens with AI-powered leaf scanning and personalized cooking insights
        </p>
      </div>

      {/* Features preview */}
      <div className="grid grid-cols-3 gap-4 mb-12 max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto">
            <Scan className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs text-muted-foreground">Smart Scanning</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto">
            <ChefHat className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs text-muted-foreground">Recipe Ideas</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 mx-auto">
            <Leaf className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs text-muted-foreground">Nutrition Facts</p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onNavigateToChat}
        className="btn-organic px-8 py-4 text-lg font-semibold text-primary-foreground glow group relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          Start Exploring
          <Leaf className="w-5 h-5 transition-transform group-hover:rotate-12" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      {/* Subtle bottom text */}
      <p className="text-xs text-muted-foreground mt-8 text-center max-w-xs">
        Scan leaves, discover nutrition, and get personalized recipes for a healthier lifestyle
      </p>
    </div>
  );
}