import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── 9 Specialist Model Definitions ──────────────────────────────────────────
interface ModelConfig {
  leafId: number;
  leafName: string;
  leafNameFr: string;
  workspace: string;
  project: string;
  version: number;
  /** Normalized nutritional density score (0-1) for tie-breaking */
  nutritionalDensity: number;
}

const MODELS: ModelConfig[] = [
  { leafId: 1, leafName: "Onion leaves",     leafNameFr: "Feuilles d'oignon",    workspace: "grn-ylmws",             project: "onion-cajj1",                version: 1,  nutritionalDensity: 0.65 },
  { leafId: 2, leafName: "Fennel leaves",    leafNameFr: "Feuilles de fenouil",   workspace: "leaf-vxgrf",             project: "leaf-vvdqa",                 version: 2,  nutritionalDensity: 0.72 },
  { leafId: 3, leafName: "Carrot leaves",    leafNameFr: "Fanes de carotte",      workspace: "carrot-gomsd",           project: "carrot-leaves",              version: 2,  nutritionalDensity: 0.81 },
  { leafId: 4, leafName: "Kohlrabi leaves",  leafNameFr: "Feuilles de chou-rave", workspace: "",                       project: "",                           version: 0,  nutritionalDensity: 0.77 }, // TBD — skipped if empty
  { leafId: 5, leafName: "Beet leaves",      leafNameFr: "Feuilles de betterave", workspace: "pancar-sopel",           project: "beet-zycnz",                 version: 5,  nutritionalDensity: 0.88 },
  { leafId: 6, leafName: "Radish leaves",    leafNameFr: "Fanes de radis",        workspace: "lion-xlj3t",             project: "radish-m2lim",               version: 4,  nutritionalDensity: 0.79 },
  { leafId: 7, leafName: "Leek leaves",      leafNameFr: "Feuilles de poireau",   workspace: "agrowizard",             project: "leek-detection",             version: 22, nutritionalDensity: 0.68 },
  { leafId: 8, leafName: "Turnip leaves",    leafNameFr: "Feuilles de navet",     workspace: "joshuas-projects",       project: "turnip-import-v2-gdowd",     version: 3,  nutritionalDensity: 0.74 },
  { leafId: 9, leafName: "Artichoke leaves", leafNameFr: "Feuilles d'artichaut",  workspace: "peruchon",               project: "artichoke",                  version: 1,  nutritionalDensity: 0.71 },
];

// ── Types ───────────────────────────────────────────────────────────────────
interface RoboflowPrediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LeafScanResult {
  leafId: number;
  leafName: string;
  leafNameFr: string;
  confidence: number;
  predictionCount: number;
  avgConfidence: number;
  tieBreakScore: number;
  modelVersion: number;
  predictions: RoboflowPrediction[];
}

interface ParallelScanResponse {
  ranked: LeafScanResult[];
  tieBreakApplied: boolean;
  modelsResponded: number;
  modelsFailed: number;
  totalModels: number;
  scanDurationMs: number;
}

// ── Roboflow Inference ──────────────────────────────────────────────────────
async function queryModel(
  model: ModelConfig,
  imageBase64: string,
  apiKey: string,
): Promise<LeafScanResult | null> {
  // Skip models with empty project (e.g. Kohlrabi TBD)
  if (!model.project || !model.workspace) {
    return null;
  }

  const url = `https://detect.roboflow.com/${model.project}/${model.version}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        image: imageBase64,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Model ${model.project} returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const predictions: RoboflowPrediction[] = data.predictions || [];

    if (predictions.length === 0) {
      return {
        leafId: model.leafId,
        leafName: model.leafName,
        leafNameFr: model.leafNameFr,
        confidence: 0,
        predictionCount: 0,
        avgConfidence: 0,
        tieBreakScore: 0,
        modelVersion: model.version,
        predictions: [],
      };
    }

    const topConfidence = Math.max(...predictions.map((p) => p.confidence));
    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.confidence, 0) /
      predictions.length;

    return {
      leafId: model.leafId,
      leafName: model.leafName,
      leafNameFr: model.leafNameFr,
      confidence: topConfidence,
      predictionCount: predictions.length,
      avgConfidence,
      tieBreakScore: 0, // computed later
      modelVersion: model.version,
      predictions,
    };
  } catch (err) {
    clearTimeout(timeout);
    console.error(`Model ${model.project} error:`, err);
    return null;
  }
}

// ── Tie-Breaking ────────────────────────────────────────────────────────────
const TIE_THRESHOLD = 0.005; // confidence difference that counts as a "tie"

function computeTieBreakScores(
  results: LeafScanResult[],
  models: ModelConfig[],
): void {
  if (results.length === 0) return;

  const maxPredictions = Math.max(...results.map((r) => r.predictionCount), 1);
  const maxVersion = Math.max(...models.map((m) => m.version), 1);

  for (const result of results) {
    const model = models.find((m) => m.leafId === result.leafId);
    const nutritionalDensity = model?.nutritionalDensity ?? 0.5;
    const versionRecency = result.modelVersion / maxVersion;
    const predRatio = result.predictionCount / maxPredictions;

    result.tieBreakScore =
      result.avgConfidence * 0.4 +
      predRatio * 0.3 +
      nutritionalDensity * 0.2 +
      versionRecency * 0.1;
  }
}

function rankResults(results: LeafScanResult[]): {
  ranked: LeafScanResult[];
  tieBreakApplied: boolean;
} {
  if (results.length === 0) {
    return { ranked: [], tieBreakApplied: false };
  }

  // Primary sort: descending confidence
  results.sort((a, b) => b.confidence - a.confidence);

  // Check if tie-breaking is needed (top 2+ within threshold)
  let tieBreakApplied = false;
  if (results.length >= 2) {
    const topConf = results[0].confidence;
    const tiedResults = results.filter(
      (r) => Math.abs(r.confidence - topConf) <= TIE_THRESHOLD,
    );

    if (tiedResults.length >= 2) {
      tieBreakApplied = true;
      computeTieBreakScores(results, MODELS);

      // Re-sort: within each tie group, use tieBreakScore
      results.sort((a, b) => {
        const confDiff = b.confidence - a.confidence;
        if (Math.abs(confDiff) <= TIE_THRESHOLD) {
          return b.tieBreakScore - a.tieBreakScore;
        }
        return confDiff;
      });
    }
  }

  return { ranked: results, tieBreakApplied };
}

// ── Main Handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      throw new Error("No image data provided");
    }

    const apiKey = Deno.env.get("ROBOFLOW_API_KEY");
    if (!apiKey) {
      throw new Error("ROBOFLOW_API_KEY not configured");
    }

    // Fan out to all models in parallel
    const activeModels = MODELS.filter((m) => m.project && m.workspace);
    const promises = activeModels.map((model) =>
      queryModel(model, imageBase64, apiKey),
    );
    const settled = await Promise.allSettled(promises);

    // Collect successful results
    const results: LeafScanResult[] = [];
    let failed = 0;

    for (const outcome of settled) {
      if (outcome.status === "fulfilled" && outcome.value !== null) {
        results.push(outcome.value);
      } else {
        failed++;
      }
    }

    // Rank and tie-break
    const { ranked, tieBreakApplied } = rankResults(results);

    const response: ParallelScanResponse = {
      ranked,
      tieBreakApplied,
      modelsResponded: results.length,
      modelsFailed: failed,
      totalModels: activeModels.length,
      scanDurationMs: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
