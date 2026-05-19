declare module "inferencejs" {
  export class CVImage {
    constructor(source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement);
  }

  export interface RFObjectDetectionPrediction {
    class: string;
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  export class InferenceEngine {
    startWorker(
      modelSlug: string,
      version: number,
      publishableKey: string,
      options?: unknown[]
    ): Promise<number>;
    infer(workerId: number, image: CVImage): Promise<RFObjectDetectionPrediction[]>;
    stopWorker(workerId: number): Promise<void>;
  }

  export interface YOLOOptions {
    confidence?: number;
    iou?: number;
  }
}
