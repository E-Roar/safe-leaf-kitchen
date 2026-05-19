/**
 * ScanResultsFeed
 *
 * Renders the ranked results of a parallel 9-model leaf scan as
 * interactive chat-feed buttons. Each button navigates to the
 * detected leaf's encyclopedia page.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Info, Zap, AlertTriangle } from "lucide-react";
import type { ParallelScanResponse, LeafScanResult } from "@/services/parallelScanService";

interface ScanResultsFeedProps {
  response: ParallelScanResponse;
  onLeafSelect: (leafId: number, leafName: string) => void;
}

const MEDAL = ["🥇", "🥈", "🥉"];
const DEFAULT_VISIBLE = 3;

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const hue = confidence > 0.7 ? 142 : confidence > 0.4 ? 48 : 0; // green / yellow / red
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `hsl(${hue}, 72%, 55%)`,
          }}
        />
      </div>
      <span className="text-xs font-mono text-white/70 w-12 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
}

function ResultButton({
  result,
  index,
  onSelect,
}: {
  result: LeafScanResult;
  index: number;
  onSelect: () => void;
}) {
  const medal = index < 3 ? MEDAL[index] : `#${index + 1}`;
  const isLowConfidence = result.confidence < 0.15;

  return (
    <button
      onClick={onSelect}
      disabled={isLowConfidence}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 text-left group
        ${isLowConfidence
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-white/10 active:scale-[0.98] cursor-pointer"
        }
      `}
    >
      <span className="text-lg w-8 text-center shrink-0">{medal}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">
            {result.leafName}
          </span>
          {result.predictionCount > 3 && (
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          )}
        </div>
        <ConfidenceBar confidence={result.confidence} />
      </div>
    </button>
  );
}

export default function ScanResultsFeed({
  response,
  onLeafSelect,
}: ScanResultsFeedProps) {
  const [expanded, setExpanded] = useState(false);

  const { ranked, tieBreakApplied, modelsResponded, modelsFailed, scanDurationMs } =
    response;

  // Filter out zero-confidence results for display
  const meaningful = ranked.filter((r) => r.confidence > 0);
  const visibleResults = expanded
    ? meaningful
    : meaningful.slice(0, DEFAULT_VISIBLE);
  const hasMore = meaningful.length > DEFAULT_VISIBLE;

  if (meaningful.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 p-4 max-w-sm backdrop-blur-md">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">No leaves detected</span>
        </div>
        <p className="text-xs text-white/50">
          {modelsResponded} model{modelsResponded !== 1 ? "s" : ""} analyzed the
          image but found no matching leaves. Try repositioning the leaf in
          better lighting.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-900/60 to-slate-900/80 border border-emerald-500/20 overflow-hidden max-w-sm backdrop-blur-md">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            🌿 Scan Results
          </h3>
          <span className="text-[10px] text-white/40 font-mono">
            {modelsResponded} model{modelsResponded !== 1 ? "s" : ""} ·{" "}
            {scanDurationMs ? `${(scanDurationMs / 1000).toFixed(1)}s` : "—"}
          </span>
        </div>
        {modelsFailed > 0 && (
          <p className="text-[10px] text-amber-400/70 mt-0.5">
            ⚠️ {modelsFailed} model{modelsFailed !== 1 ? "s" : ""} unavailable
          </p>
        )}
      </div>

      {/* Results list */}
      <div className="px-2 py-1.5 space-y-0.5">
        {visibleResults.map((result, i) => (
          <ResultButton
            key={result.leafId}
            result={result}
            index={i}
            onSelect={() => onLeafSelect(result.leafId, result.leafName)}
          />
        ))}
      </div>

      {/* Expand / Tie-break footer */}
      <div className="px-4 pb-3 pt-1 flex items-center justify-between">
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Show all {meaningful.length} results
              </>
            )}
          </button>
        )}

        {tieBreakApplied && (
          <div className="flex items-center gap-1 text-[10px] text-white/30 group relative">
            <Info className="w-3 h-3" />
            <span>Tie-break applied</span>
            <div className="absolute bottom-full right-0 mb-1 w-48 p-2 rounded-lg bg-slate-800 border border-white/10 text-white/60 text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              Two or more models returned similar confidence scores. A
              tie-breaking algorithm using prediction count, avg confidence,
              nutritional density, and model version was used to rank them.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
