"use client";

import { useState } from "react";
import { saveDraftSection } from "@/lib/site-settings/actions";
import type { SiteSettings } from "@/lib/site-settings/types";
import { FieldLabel, SaveRow, SectionCard, TextInput, ToggleRow, useDraftSave } from "../_field-kit";

export function FooterSection({ value }: { value: SiteSettings["footer"] }) {
  const [form, setForm] = useState(value);
  const { run, pending, error, saved } = useDraftSave((v: SiteSettings["footer"]) => saveDraftSection("footer", v));

  return (
    <SectionCard title="Footer" description="Shown at the bottom of every page of your public site.">
      <div>
        <FieldLabel hint="A short line shown above your contact details. Leave blank to hide.">Tagline</FieldLabel>
        <TextInput
          value={form.tagline ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value || null }))}
          placeholder="Empowering the next generation."
          maxLength={140}
        />
      </div>
      <ToggleRow
        label="Show quick links"
        description="A column of shortcut links (About, Admissions, Contact, etc.)."
        checked={form.showQuickLinks}
        onCheckedChange={(showQuickLinks) => setForm((f) => ({ ...f, showQuickLinks }))}
      />
      <SaveRow pending={pending} error={error} saved={saved} onSave={() => run(form)} />
    </SectionCard>
  );
}
