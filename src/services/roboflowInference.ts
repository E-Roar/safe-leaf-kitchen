import { logger } from "@/lib/logger";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowPrediction {
  class: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface InferenceResult {
  predictions: RoboflowPrediction[];
  inferenceTimeMs: number;
}

interface TrackedBox {
  class: string;
  confidence: number;
  bbox: BoundingBox;
  lastSeen: number;
}

class BoxStabilizer {
  private tracked: Map<string, TrackedBox> = new Map();
  private alpha = 0.65;
  private maxAge = 150;

  stabilize(predictions: RoboflowPrediction[]): RoboflowPrediction[] {
    const now = Date.now();
    const result: RoboflowPrediction[] = [];

    for (const pred of predictions) {
      const key = pred.class;
      const existing = this.tracked.get(key);

      if (existing) {
        const smooth = (old: number, next: number) =>
          this.alpha * next + (1 - this.alpha) * old;

        const stabilized: RoboflowPrediction = {
          class: pred.class,
          confidence: pred.confidence,
          bbox: {
            x: smooth(existing.bbox.x, pred.bbox.x),
            y: smooth(existing.bbox.y, pred.bbox.y),
            width: smooth(existing.bbox.width, pred.bbox.width),
            height: smooth(existing.bbox.height, pred.bbox.height),
          },
        };

        this.tracked.set(key, { ...stabilized, lastSeen: now });
        result.push(stabilized);
      } else {
        this.tracked.set(key, { ...pred, lastSeen: now });
        result.push(pred);
      }
    }

    for (const [key, val] of this.tracked) {
      if (now - val.lastSeen > this.maxAge) {
        this.tracked.delete(key);
      }
    }

    return result;
  }

  reset() {
    this.tracked.clear();
  }
}

class RoboflowInferenceService {
  private isReady = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private stabilizer = new BoxStabilizer();
  private canvas: HTMLCanvasElement | null = null;
  private apiKey: string | null = null;

  async initialize(): Promise<void> {
    if (this.isReady) return;
    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;
    this.loadPromise = this._init();
    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async _init(): Promise<void> {
    this.canvas = document.createElement("canvas");
    this.apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY || null;

    if (!this.apiKey) {
      logger.warn("[RoboflowInference] No API key configured");
    } else {
      logger.info("[RoboflowInference] Ready");
    }

    this.isReady = true;
  }

  ready(): boolean {
    return this.isReady;
  }

  loading(): boolean {
    return this.isLoading;
  }

  async detectFromVideo(video: HTMLVideoElement): Promise<InferenceResult> {
    await this.initialize();
    if (!this.canvas) throw new Error("Not initialized");

    const startTime = performance.now();
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) {
      return { predictions: [], inferenceTimeMs: 0 };
    }

    const maxDim = 640;
    let drawW: number, drawH: number;
    if (vw > vh) {
      drawW = maxDim;
      drawH = Math.round((vh / vw) * maxDim);
    } else {
      drawH = maxDim;
      drawW = Math.round((vw / vh) * maxDim);
    }

    this.canvas.width = drawW;
    this.canvas.height = drawH;
    ctx.drawImage(video, 0, 0, drawW, drawH);

    const base64 = this.canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    const raw = await this._infer(base64);

    const inferenceTimeMs = Math.round(performance.now() - startTime);

    const scaleX = vw / drawW;
    const scaleY = vh / drawH;
    const predictions = this.parsePredictions(raw.predictions || [], scaleX, scaleY);
    const stabilized = this.stabilizer.stabilize(predictions);

    return { predictions: stabilized, inferenceTimeMs };
  }

  async detectFromCanvas(canvas: HTMLCanvasElement): Promise<InferenceResult> {
    await this.initialize();

    const startTime = performance.now();
    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    const raw = await this._infer(base64);

    const inferenceTimeMs = Math.round(performance.now() - startTime);

    const cw = canvas.width;
    const ch = canvas.height;
    const predictions = this.parsePredictions(raw.predictions || [], 1, 1);

    const result = predictions.map((p) => ({
      ...p,
      bbox: {
        ...p.bbox,
        x: p.bbox.x * cw,
        y: p.bbox.y * ch,
        width: p.bbox.width * cw,
        height: p.bbox.height * ch,
      },
    }));

    return { predictions: result, inferenceTimeMs };
  }

  resetStabilizer(): void {
    this.stabilizer.reset();
  }

  async dispose(): Promise<void> {
    this.canvas = null;
    this.isReady = false;
    this.stabilizer.reset();
  }

  private async _infer(base64: string): Promise<any> {
    const apiKey = this.apiKey || import.meta.env.VITE_ROBOFLOW_API_KEY;

    if (!apiKey) {
      throw new Error("No Roboflow API key configured. Set VITE_ROBOFLOW_PUBLISHABLE_API_KEY in .env");
    }

    const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    const response = await fetch(
      `https://detect.roboflow.com/safe-leaf-kitchen/2?api_key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Roboflow API error (${response.status}): ${text}`);
    }

    return response.json();
  }

  private parsePredictions(
    raw: any[],
    scaleX: number,
    scaleY: number,
  ): RoboflowPrediction[] {
    if (!raw || !Array.isArray(raw)) return [];

    return raw
      .filter((p: any) => p && p.class && p.confidence != null)
      .map((p: any) => {
        const w = p.width * scaleX;
        const h = p.height * scaleY;
        return {
          class: p.class as string,
          confidence: p.confidence as number,
          bbox: {
            x: (p.x - p.width / 2) * scaleX,
            y: (p.y - p.height / 2) * scaleY,
            width: w,
            height: h,
          },
        };
      });
  }
}

export const roboflowInference = new RoboflowInferenceService();
