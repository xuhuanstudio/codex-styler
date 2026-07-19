import { useEffect, useState } from "react";
import { analyzeCompanionEdges, type EdgeAnalysisState } from "./edge-analysis";
import type { ExtractedFrame } from "./media";
import type { CompanionCreatorProject } from "./model";
import { edgeReviewFingerprint } from "./quality-review";

export function useEdgeAnalysis(
  project: CompanionCreatorProject,
  frames: ExtractedFrame[],
  enabled: boolean,
): EdgeAnalysisState {
  const [state, setState] = useState<EdgeAnalysisState>({ status: "idle" });
  const signature = enabled ? edgeReviewFingerprint(project) : "disabled";

  useEffect(() => {
    if (!enabled || !project.sharedCrop || frames.length === 0) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "running" });
    void analyzeCompanionEdges(project, frames, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setState({ status: "ready", result });
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: reason instanceof Error ? reason.message : String(reason),
        });
      });
    return () => controller.abort();
    // The compact fingerprint captures every output-affecting project field.
    // Frame identity is still included because restored blobs may arrive later.
  }, [enabled, frames, signature]);

  return state;
}
