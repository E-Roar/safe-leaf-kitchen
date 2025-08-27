import { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCcw } from "lucide-react";
import { APIService, DetectionResult } from "@/services/apiService";
import { logger } from "@/lib/logger";

interface CameraScannerProps {
  onClose: () => void;
  onDetection: (detections: DetectionResult[]) => void;
}

export default function CameraScanner({ onClose, onDetection }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsCameraLoading(true);
      // Stop existing stream first if it exists
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 }
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
            setIsCameraLoading(false); // Camera is ready
            resolve();
          };
          if (video.readyState >= 1) {
            setIsCameraLoading(false);
            resolve();
          } else {
            video.addEventListener('loadedmetadata', handler);
          }
        });
        try { 
          await videoRef.current.play(); 
        } catch (error) {
          logger.warn('Failed to play video', error);
          setIsCameraLoading(false);
        }
      }
    } catch (error) {
      logger.error("Camera access error:", error);
      // Removed toast error message
      setIsCameraLoading(false);
    }
  }, [facingMode]); // Only depend on facingMode

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera when component mounts or facing mode changes
  useEffect(() => {
    startCamera();
  }, [facingMode]); // Only restart when facing mode changes
  
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    // Removed toast loading message

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
        // Removed toast error message
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
      
      // Removed toast messages for success/error
      
      if (result.predictions && result.predictions.length > 0) {
        onDetection(result.predictions);
        // Removed success toast message
        // Automatically close camera when leaf is detected
        setTimeout(() => {
          onClose();
        }, 500); // Reduced delay since no message to show
      } else {
        onDetection([]);
        // Removed error toast message
      }
    } catch (error) {
      logger.error("Detection error:", error);
      // Removed toast error message
    } finally {
      setIsScanning(false);
    }
  };

  const handleFlipCamera = () => {
    setIsCameraLoading(true); // Show loading when switching cameras
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-white">Camera Scanner</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

        {/* Video Container - Responsive */}
        <div className="relative flex-1 bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Hidden canvas for image capture */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Responsive square frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 border-2 border-white/70 rounded-lg"></div>
          </div>

          {/* Responsive scan button */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={captureAndAnalyze}
              disabled={isScanning || isCameraLoading}
              className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300
                ${
                  isScanning || isCameraLoading
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-100 hover:scale-105 active:scale-95'
                }
              `}
            >
              {isScanning ? (
                <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-800 border-t-transparent rounded-full"></div>
              ) : (
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-800"></div>
              )}
            </button>
          </div>

          {/* Camera flip button - Responsive */}
          <button
            onClick={handleFlipCamera}
            disabled={isScanning || isCameraLoading}
            className="absolute top-4 right-4 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Instructions - Responsive */}
        <div className="p-4 sm:p-6 text-center text-white/80 bg-black/50 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <p className="text-sm sm:text-base">
            {isCameraLoading
              ? "Initializing camera..."
              : isScanning 
                ? "Analyzing leaf..." 
                : "Position the leaf in the square and tap to scan"
            }
          </p>
        </div>
    </div>
  );
}