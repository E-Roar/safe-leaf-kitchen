import { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCcw } from "lucide-react";
import { APIService, DetectionResult } from "@/services/apiService";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface CameraScannerProps {
  onClose: () => void;
  onDetection: (detections: DetectionResult[]) => void;
}

export default function CameraScanner({ onClose, onDetection }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [longPressActive, setLongPressActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure metadata is loaded so videoWidth/videoHeight are available
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          const handler = () => {
            video.removeEventListener('loadedmetadata', handler);
            resolve();
          };
          if (video.readyState >= 1) {
            resolve();
          } else {
            video.addEventListener('loadedmetadata', handler);
          }
        });
        try { 
          await videoRef.current.play(); 
        } catch (error) {
          logger.warn('Failed to play video', error);
        }
      }
    } catch (error) {
      logger.error("Camera access error:", error);
      toast.error("Unable to access camera");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    toast.loading("Analyzing leaf...");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set canvas dimensions to match video
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        // Wait briefly for camera to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.dismiss();
        toast.error("Camera not ready. Please try again.");
        logger.warn("CameraScanner: video dimensions are 0");
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8)
        .replace('data:image/jpeg;base64,', '');

      // Send to Roboflow API
      const result = await APIService.detectLeaf(base64Image);
      logger.debug("Roboflow response:", result);
      
      toast.dismiss();
      
      if (result.predictions && result.predictions.length > 0) {
        onDetection(result.predictions);
        toast.success("Leaf detected successfully!");
        // Automatically close camera when leaf is detected
        const timeoutId = setTimeout(() => {
          onClose();
        }, 1000); // Small delay to show success message
        
        // Cleanup timeout if component unmounts
        return () => clearTimeout(timeoutId);
      } else {
        onDetection([]);
        toast.error("No leaves detected. Try a different angle or lighting.");
      }
    } catch (error) {
      logger.error("Detection error:", error);
      toast.error("Detection failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleLongPressStart = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setLongPressActive(true);
      captureAndAnalyze();
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressActive(false);
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Camera Scanner</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/50 rounded-2xl flex items-center justify-center">
              <div className="text-white/70 text-center">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm">Position leaf in frame</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={handleFlipCamera}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            
            <button
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              disabled={isScanning}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all
                ${isScanning 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : longPressActive 
                    ? 'bg-red-500 scale-110' 
                    : 'bg-white hover:bg-gray-100'
                }
              `}
            >
              <div className="w-8 h-8 rounded-full border-4 border-gray-800"></div>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-white/80">
          <p className="text-sm">
            {isScanning 
              ? "Analyzing..." 
              : "Hold the button to scan for leaves"
            }
          </p>
        </div>
      </div>
    </div>
  );
}