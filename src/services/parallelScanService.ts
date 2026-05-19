/**
 * ParallelScanService
 *
 * Calls the Supabase Edge Function `parallel-leaf-scan` to fan out a
 * single image to 8-9 specialist YOLO models. Falls back to the
 * original single-model `APIService.detectLeaf()` if the edge function
 * is unavailable.
 */

import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";

// ── Shared Types (mirrored from edge function) ─────────────────────────────

export interface LeafScanResult {
  leafId: number;
  leafName: string;
  leafNameFr: string;
  confidence: number;
  predictionCount: number;
  avgConfidence: number;
  tieBreakScore: number;
  modelVersion: number;
  predictions: Array<{
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface ParallelScanResponse {
  ranked: LeafScanResult[];
  tieBreakApplied: boolean;
  modelsResponded: number;
  modelsFailed: number;
  totalModels: number;
  scanDurationMs: number;
}

// ── Service ─────────────────────────────────────────────────────────────────

export class ParallelScanService {
  /**
   * Send an image to all specialist models via the edge function.
   * Returns a ranked list of results with confidence scores.
   */
  static async scanAllModels(
    imageBase64: string,
  ): Promise<ParallelScanResponse> {
    try {
      logger.debug("ParallelScanService: calling parallel-leaf-scan edge function");

      const { data, error } = await supabase.functions.invoke(
        "parallel-leaf-scan",
        {
          body: { imageBase64 },
        },
      );

      if (error) {
        logger.error("ParallelScanService: edge function error", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      const response = data as ParallelScanResponse;

      logger.debug("ParallelScanService: scan complete", {
        responded: response.modelsResponded,
        failed: response.modelsFailed,
        topLeaf: response.ranked[0]?.leafName ?? "none",
        topConfidence: response.ranked[0]?.confidence ?? 0,
        tieBreak: response.tieBreakApplied,
        durationMs: response.scanDurationMs,
      });

      return response;
    } catch (err) {
      logger.error("ParallelScanService: scanAllModels failed", err);
      throw err;
    }
  }
}
