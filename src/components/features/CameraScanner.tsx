import { useState, useRef, useEffect } from "react";
import { X, Camera, RotateCcw } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8)
        .replace('data:image/jpeg;base64,', '');

      // Send to Roboflow API
      const result = await APIService.detectLeaf(base64Image);
      
      toast.dismiss();
      
      if (result.predictions && result.predictions.length > 0) {
        onDetection(result.predictions);
        toast.success("Leaf detected successfully!");
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

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 glass">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h3 className="text-white font-medium">Scan Leaf</h3>
        
        <button
          onClick={toggleCamera}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
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
          <div className="relative w-64 h-64">
            {/* Scanning frame */}
            <div className="absolute inset-0 border-2 border-primary rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl"></div>
            </div>
            
            {/* Scanning animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse rounded-3xl"></div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-32 text-center">
          <p className="text-white/80 text-sm">
            Position the leaf within the frame
          </p>
        </div>
      </div>

      {/* Capture button */}
      <div className="p-6 flex justify-center">
        <button
          onClick={captureAndAnalyze}
          disabled={isScanning}
          className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-leaf disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110"
        >
          {isScanning ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </button>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}