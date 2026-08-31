"use client";

import { useState } from "react";
import { saveDraftSection } from "@/lib/site-settings/actions";
import type { SiteSettings } from "@/lib/site-settings/types";
import { FieldLabel, SaveRow, SectionCard, TextInput, ToggleRow, useDraftSave } from "../_field-kit";

export function HeaderSection({ value }: { value: SiteSettings["header"] }) {
  const [form, setForm] = useState(value);
  const { run, pending, error, saved } = useDraftSave((v: SiteSettings["header"]) => saveDraftSection("header", v));

  return (
    <SectionCard title="Header" description="The top navigation bar shown on every page of your public site.">
      <ToggleRow
        label='Show "Apply Now" button'
        description="A call-to-action button in the header, linking to your admissions page."
        checked={form.showApplyCta}
        onCheckedChange={(showApplyCta) => setForm((f) => ({ ...f, showApplyCta }))}
      />
      {form.showApplyCta && (
        <div>
          <FieldLabel>Button label</FieldLabel>
          <TextInput
            value={form.ctaLabel}
            onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
            placeholder="Apply Now"
            maxLength={40}
          />
        </div>
      )}
      <SaveRow pending={pending} error={error} saved={saved} onSave={() => run(form)} />
    </SectionCard>
  );
}
