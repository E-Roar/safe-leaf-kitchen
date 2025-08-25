import { useState, useRef, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { APIService } from "@/services/apiService";
import { toast } from "sonner";

interface CameraScannerProps {
  onClose: () => void;
  onDetection: (detections: any[]) => void;
}

export default function CameraScanner({ onClose, onDetection }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [longPressActive, setLongPressActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
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
        try { await videoRef.current.play(); } catch {}
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

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
        await new Promise(r => setTimeout(r, 200));
      }
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.dismiss();
        toast.error("Camera not ready. Please try again.");
        console.warn("CameraScanner: video dimensions are 0");
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
      console.debug("Roboflow response:", result);
      
      toast.dismiss();
      
      if (result.predictions && result.predictions.length > 0) {
        onDetection(result.predictions);
        toast.success("Leaf detected successfully!");
        // Automatically close camera when leaf is detected
        setTimeout(() => {
          onClose();
        }, 1000); // Small delay to show success message
      } else {
        onDetection([]);
        toast.error("No leaves detected in image");
      }
    } catch (error) {
      console.error("Detection error:", error);
      toast.dismiss();
      toast.error("Failed to analyze image");
    } finally {
      setIsScanning(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleLongPressStart = () => {
    if (isScanning) return;
    
    longPressTimerRef.current = setTimeout(() => {
      setLongPressActive(true);
      captureAndAnalyze();
    }, 800); // 800ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressActive(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Floating Header Buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors bg-black/20 backdrop-blur-sm pointer-events-auto"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        <button
          onClick={toggleCamera}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors bg-black/20 backdrop-blur-sm pointer-events-auto"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative w-48 h-48 sm:w-64 sm:h-64 cursor-pointer select-none"
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
          >
            {/* Scanning frame */}
            <div className={`absolute inset-0 border-2 rounded-3xl transition-all duration-300 ${
              longPressActive ? 'border-white scale-105' : 'border-primary'
            }`}>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl"></div>
            </div>
            
            {/* Scanning animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse rounded-3xl"></div>
            )}

            {/* Long press indicator */}
            {longPressActive && !isScanning && (
              <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-24 sm:translate-y-32 text-center">
          <p className="text-white/80 text-xs sm:text-sm px-4">
            Position the leaf within the frame and long press to scan
          </p>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}