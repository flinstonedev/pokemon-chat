"use client";

import { ComponentAgentResponse } from "@/lib/generic-ui-schema";
import { ComponentUIRenderer } from "./ComponentUIRenderer";
import { useResults } from "./ResultsProvider";

// Extended response type that includes echoed data from visualize-data API
interface ModelResponseWithData extends ComponentAgentResponse {
  data?: Record<string, unknown>;
}

interface InteractiveUIRendererProps {
  modelResponse: ModelResponseWithData;
}

export function InteractiveUIRenderer({
  modelResponse,
}: InteractiveUIRendererProps) {
  const { latestResult } = useResults();

  if (!modelResponse || !modelResponse.ui) {
    return null;
  }

  // Use data from the model response (if echoed) or fallback to latestResult from context
  const componentData = modelResponse.data || latestResult?.data || {};

  return (
    <ComponentUIRenderer component={modelResponse.ui} data={componentData} />
  );
}
