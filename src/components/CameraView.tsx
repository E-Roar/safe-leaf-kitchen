import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Scan, RotateCcw } from 'lucide-react';
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

            <Button
              variant="floating"
              size="icon-lg"
              onClick={capture}
              disabled={isScanning}
              className="backdrop-blur-sm"
            >
              {isScanning ? (
                <div className="w-6 h-6 border-2 border-primary-glow border-t-transparent rounded-full animate-spin" />
              ) : (
                <Scan className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-glow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-foreground font-medium">Analyzing leaf...</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CameraView;