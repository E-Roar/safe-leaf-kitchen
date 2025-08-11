import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PWAInstallButton from './PWAInstallButton';
import { Leaf, Camera, MessageCircle, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onNavigateToChat: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToChat }) => {
  return (
    <div className="min-h-screen bg-gradient-hero moroccan-pattern relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center mb-8 space-y-6">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="w-12 h-12 text-primary-glow leaf-animation" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SafeLeaf Kitchen
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            مطبخ الورقة الآمنة
          </p>
          
          <p className="text-lg text-foreground/80 max-w-xl mx-auto">
            Discover the nutritional power of Moroccan leafy vegetables with AI-powered identification and personalized recipes
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="glass-card p-6 text-center organic-border hover:scale-105 transition-spring">
            <Camera className="w-8 h-8 text-primary-glow mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Leaf Scanner</h3>
            <p className="text-sm text-muted-foreground">
              Instantly identify vegetable leaves with AI-powered camera detection
            </p>
          </Card>
          
          <Card className="glass-card p-6 text-center organic-border-alt hover:scale-105 transition-spring">
            <MessageCircle className="w-8 h-8 text-primary-glow mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nutrition Chat</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized nutrition advice and authentic Moroccan recipes
            </p>
          </Card>
          
          <Card className="glass-card p-6 text-center organic-border hover:scale-105 transition-spring">
            <Sparkles className="w-8 h-8 text-primary-glow mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Traditional Wisdom</h3>
            <p className="text-sm text-muted-foreground">
              Blend modern nutrition science with traditional Moroccan cooking
            </p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button 
            variant="hero" 
            size="xl" 
            onClick={onNavigateToChat}
            className="min-w-48"
          >
            Start Exploring
          </Button>
          
          <PWAInstallButton />
        </div>

        {/* Moroccan Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30l15-15v30l-15-15zm0 0l-15 15h30l-15-15z' fill='%234ade80' fill-opacity='0.1'/%3E%3C/svg%3E")`
          }} />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;