import { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCcw, Zap, Loader2, Crosshair } from "lucide-react";
import {
  roboflowInference,
  RoboflowPrediction,
} from "@/services/roboflowInference";
import { logger } from "@/lib/logger";

interface LiveCameraScannerProps {
  onClose: () => void;
  onLeafSelect: (prediction: RoboflowPrediction, snapshot: string) => void;
}

const GRID_COLOR = "rgba(34, 211, 238, 0.06)";

function getDetClassColor(className: string): string {
  const colors: Record<string, string> = {
    "beetroot": "#f43f5e",
    "carrot": "#f97316",
    "fennel": "#a78bfa",
    "kohlrabi": "#34d399",
    "leek": "#22c55e",
    "onion": "#22d3ee",
  };
  return colors[className.toLowerCase()] || "#22d3ee";
}

export default function LiveCameraScanner({ onClose, onLeafSelect }: LiveCameraScannerProps) {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [predictions, setPredictions] = useState<RoboflowPrediction[]>([]);
  const [fps, setFps] = useState(0);
  const [_selectedPred, setSelectedPred] = useState<RoboflowPrediction | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });
  const streamRef = useRef<MediaStream | null>(null);
  const cameraGenRef = useRef(0);

  const startCamera = useCallback(async () => {
    const gen = ++cameraGenRef.current;
    try {
      setCameraReady(false);
      setCameraFailed(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (gen !== cameraGenRef.current) {
        mediaStream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          const domErr = playErr as DOMException;
          if (domErr.name === 'AbortError') return;
          throw playErr;
        }
        if (gen !== cameraGenRef.current) return;
        setCameraReady(true);
      }
    } catch (error) {
      const err = error as DOMException;
      logger.error(`Camera access error: ${err.name || "Unknown"} — ${err.message || "no details"}`);
      setCameraFailed(true);
    }
  }, [facingMode]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setModelLoading(true);
      try {
        await roboflowInference.initialize();
        if (!cancelled) {
          setModelReady(true);
          logger.info("[LiveScanner] Model ready");
        }
      } catch (err) {
        logger.error("[LiveScanner] Model initialization failed:", err);
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, startCamera]);

  useEffect(() => {
    if (!cameraReady || !modelReady) return;

    let running = true;
    let frameId = 0;

    async function inferenceLoop() {
      if (!running) return;

      const video = videoRef.current;
      if (!video || video.videoWidth === 0) {
        frameId = requestAnimationFrame(inferenceLoop);
        return;
      }

      try {
        const result = await roboflowInference.detectFromVideo(video);
        if (running) {
          setPredictions(result.predictions);
          const now = performance.now();
          fpsCounterRef.current.frames++;
          if (now - fpsCounterRef.current.lastTime >= 1000) {
            setFps(fpsCounterRef.current.frames);
            fpsCounterRef.current.frames = 0;
            fpsCounterRef.current.lastTime = now;
          }
        }
      } catch (e) {
        logger.warn("[LiveScanner] Inference error:", e);
      }

      if (running) {
        frameId = requestAnimationFrame(inferenceLoop);
      }
    }

    frameId = requestAnimationFrame(inferenceLoop);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [cameraReady, modelReady]);

  const handleSelectLeaf = useCallback((pred: RoboflowPrediction) => {
    setSelectedPred(pred);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (video && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
        } else {
          canvas.width = 640;
          canvas.height = 480;
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = "#22d3ee";
          ctx.font = "bold 20px monospace";
          ctx.textAlign = "center";
          ctx.fillText("DEMO SCAN", 320, 240);
          ctx.font = "14px monospace";
          ctx.fillStyle = "#ffffff40";
          ctx.fillText(pred.class, 320, 280);
        }
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setSnapshot(dataUrl);
        setTimeout(() => {
          onLeafSelect(pred, dataUrl);
        }, 200);
      }
    }
  }, [onLeafSelect]);

  const handleFlipCamera = () => {
    roboflowInference.resetStabilizer();
    setSelectedPred(null);
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const getBboxStyle = (pred: RoboflowPrediction) => {
    const video = videoRef.current;
    if (!video) return {};

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const displayW = video.clientWidth;
    const displayH = video.clientHeight;
    const coverScale = Math.max(displayW / vw, displayH / vh);
    const offsetX = (displayW - vw * coverScale) / 2;
    const offsetY = (displayH - vh * coverScale) / 2;

    return {
      left: `${pred.bbox.x * coverScale + offsetX}px`,
      top: `${pred.bbox.y * coverScale + offsetY}px`,
      width: `${pred.bbox.width * coverScale}px`,
      height: `${pred.bbox.height * coverScale}px`,
    };
  };

  const isLoading = modelLoading || (!cameraReady && !cameraFailed);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">
              <span className="text-cyan-400">SCAN</span> v3.0
            </h2>
          </div>
          {modelReady && (
            <span className="text-[10px] font-mono text-cyan-400/70 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
              {fps} FPS
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-scan-line" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(0deg, ${GRID_COLOR} 1px, transparent 1px),
                linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="absolute inset-3 pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/60 rounded-tl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/60 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/60 rounded-br" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-cyan-400/20">
            <div className="w-full h-full rounded-full border border-cyan-400/10 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-cyan-400/60" />
            </div>
          </div>
        </div>

        <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
          {predictions.map((pred, idx) => {
            const color = getDetClassColor(pred.class);
            const style = getBboxStyle(pred);
            const pct = Math.round(pred.confidence * 100);

            return (
              <div
                key={`${pred.class}-${idx}`}
                className="absolute pointer-events-auto cursor-pointer group"
                style={style}
                onClick={() => handleSelectLeaf(pred)}
              >
                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2" style={{ borderColor: color }} />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-r-2 border-t-2" style={{ borderColor: color }} />
                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l-2 border-b-2" style={{ borderColor: color }} />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2" style={{ borderColor: color }} />

                <div
                  className="absolute inset-0 rounded-sm transition-all duration-300 group-hover:bg-white/5"
                  style={{
                    border: `1px solid ${color}`,
                    boxShadow: `0 0 12px ${color}40, inset 0 0 12px ${color}10`,
                  }}
                />

                <div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLeaf(pred);
                    }}
                    className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-lg hover:scale-105 active:scale-95 transition-all"
                    style={{
                      backgroundColor: `${color}`,
                      borderColor: `${color}`,
                      color: "#000",
                      boxShadow: `0 0 16px ${color}60`,
                    }}
                  >
                    <Zap className="w-3 h-3" />
                    {pred.class} &middot; {pct}%
                  </button>
                </div>

                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider whitespace-nowrap opacity-80"
                  style={{
                    backgroundColor: color,
                    borderColor: color,
                    color: "#000",
                  }}
                >
                  {pred.class} {pct}%
                </div>
              </div>
            );
          })}
        </div>

        {snapshot && (
          <div className="absolute inset-0 bg-white/20 pointer-events-none animate-flash" />
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
            <p className="text-white text-sm font-medium tracking-wide">
              {!cameraReady ? "STARTING CAMERA" : "INITIALIZING MODEL"}
            </p>
            <p className="text-white/40 text-xs mt-1 font-mono">
              {!cameraReady ? "requesting device access" : "connecting to inference API"}
            </p>
          </div>
        )}

        <button
          onClick={handleFlipCamera}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 flex items-center justify-center transition-all"
        >
          <RotateCcw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-mono text-white/40">
            {modelReady ? "AI" : "STANDBY"}
          </span>
        </div>
        <p className="text-[10px] text-white/30 font-mono">
          {predictions.length > 0
            ? `${predictions.length} DETECTIONS`
            : "AWAITING INPUT"}
        </p>
        <p className="text-[10px] text-white/20 font-mono">
          HOVER TO SELECT
        </p>
      </div>
    </div>
  );
}
