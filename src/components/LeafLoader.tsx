import React from 'react';
import { Leaf } from 'lucide-react';

export const LeafLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <Leaf className="w-16 h-16 text-primary-glow mx-auto leaf-animation" />
          <div className="absolute inset-0 w-16 h-16 mx-auto">
            <div className="w-full h-full border-4 border-primary-glow/30 border-t-primary-glow rounded-full animate-spin" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          SafeLeafKitchen
        </h2>
        <p className="text-muted-foreground">Loading your nutrition companion...</p>
      </div>
    </div>
  );
};

export default LeafLoader;