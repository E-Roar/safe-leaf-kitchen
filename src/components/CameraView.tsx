
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Scan, RotateCcw, Leaf } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';

interface CameraViewProps {
  isVisible: boolean;
  onToggleCamera: () => void;
  onLeafDetected: (detectionData: any) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isVisible,
  onToggleCamera,
  onLeafDetected
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsScanning(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture image');

      // Convert base64 to blob for API upload
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // Mock detection for now - in production this would call Roboflow API
      const mockDetection = {
        predictions: [
          {
            class: 'spinach',
            confidence: 0.92,
            x: 640,
            y: 360,
            width: 200,
            height: 150
          }
        ],
        image: imageSrc
      };

      // Simulate API delay
      setTimeout(() => {
        onLeafDetected(mockDetection);
        setIsScanning(false);
      }, 2000);

    } catch (error) {
      console.error('Error capturing/analyzing image:', error);
      setIsScanning(false);
    }
  }, [onLeafDetected]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isVisible) return null;

  return (
    <Card className="glass-card p-4 organic-border">
      <div className="relative rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            ...APP_CONFIG.CAMERA_CONSTRAINTS.video,
            facingMode
          }}
          className="w-full h-64 object-cover rounded-lg"
        />
        
        {/* Camera Controls Overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-4">
          <Button
            variant="camera"
            size="icon"
            onClick={onToggleCamera}
            className="backdrop-blur-sm"
          >
            <CameraOff className="w-5 h-5" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="camera"
              size="icon"
              onClick={toggleFacingMode}
              className="backdrop-blur-sm"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            {/* Enhanced Striking Scan Button */}
            <div className="relative">
              <Button
                variant="hero"
                size="icon-xl"
                onClick={capture}
                disabled={isScanning}
                className="backdrop-blur-sm relative overflow-hidden group transform transition-all duration-300 hover:scale-110 active:scale-95"
              >
                {/* Pulsing background effect */}
                <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-full animate-ping group-hover:opacity-40" />
                
                {/* Rotating border effect */}
                <div className="absolute inset-0 rounded-full border-2 border-primary-glow animate-spin opacity-30 group-hover:opacity-60" />
                
                {/* Button content */}
                <div className="relative z-10 flex items-center justify-center">
                  {isScanning ? (
                    <div className="w-8 h-8 border-3 border-primary-glow border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="relative">
                      <Leaf className="w-8 h-8 text-primary-glow drop-shadow-glow transform group-hover:rotate-12 transition-transform duration-300" />
                      <div className="absolute inset-0 w-8 h-8 bg-primary-glow opacity-20 rounded-full blur-sm group-hover:opacity-40 transition-opacity duration-300" />
                    </div>
                  )}
                </div>
                
                {/* Ripple effect on click */}
                <div className="absolute inset-0 rounded-full bg-primary-glow opacity-0 group-active:opacity-30 group-active:animate-ping" />
              </Button>
              
              {/* Floating text indicator */}
              {!isScanning && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-glass-bg/80 backdrop-blur-sm rounded-full border border-glass-border text-xs text-primary-glow font-medium whitespace-nowrap animate-pulse">
                  Tap to scan leaf
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scanning Overlay with enhanced animation */}
        {isScanning && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-primary-glow border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-b-transparent rounded-full animate-spin animate-reverse mx-auto" />
              </div>
              <p className="text-foreground font-medium text-lg bg-glass-bg/80 backdrop-blur-sm px-4 py-2 rounded-full border border-glass-border">
                🌿 Analyzing leaf...
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CameraView;
