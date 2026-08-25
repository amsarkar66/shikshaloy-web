"use client";

import { useState, type ReactNode } from "react";
import { FadingDividerGrid } from "@/components/marketing/fading-divider-grid";
import { DemoPreviewChrome } from "@/components/marketing/demo-preview-chrome";

export interface ShowcaseFeature {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  content: ReactNode;
}

export function DemoFeatureShowcase({ features }: { features: ShowcaseFeature[] }) {
  const [activeId, setActiveId] = useState(features[0]?.id);
  const active = features.find((f) => f.id === activeId) ?? features[0];

  return (
    <div>
      <FadingDividerGrid items={features} activeId={activeId} onSelect={setActiveId} className="mb-10" />

      {active && (
        <DemoPreviewChrome
          label={active.label}
          description={active.description}
          icon={active.icon}
          content={active.content}
        />
      )}
    </div>
  );
}
