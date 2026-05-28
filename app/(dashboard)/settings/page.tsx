"use client";

import { useEffect, useState } from "react";
import { CircleCheckBig, RotateCcw, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_PDF_SETTINGS,
  loadPdfSettings,
  savePdfSettings,
  type PdfSettings,
} from "@/lib/pdf-settings";

type FieldName = keyof PdfSettings;

function SelectField({
  label,
  value,
  onChange,
  children,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        {children}
      </select>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 transition-colors hover:border-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500/30"
      />
      <span>
        <span className="block text-sm font-medium text-slate-100">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-400">{description}</span>
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Load the persisted browser preference after mount so the server render stays stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadPdfSettings());
    setReady(true);
  }, []);

  function updateField<K extends FieldName>(field: K, value: PdfSettings[K]) {
    setSettings((current) => {
      const next = { ...current, [field]: value } as PdfSettings;
      savePdfSettings(next);
      setSavedAt(new Date());
      return next;
    });
  }

  function handleReset() {
    setSettings(DEFAULT_PDF_SETTINGS);
    savePdfSettings(DEFAULT_PDF_SETTINGS);
    setSavedAt(new Date());
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Tune the default PDF layout used when generating salary slips.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={handleReset}
          disabled={!ready}
        >
          Reset defaults
        </Button>
      </div>

      <Card className="border-indigo-500/20 bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <Settings2 className="mt-0.5 h-5 w-5 text-indigo-300" />
          <div>
            <p className="text-sm font-semibold text-indigo-100">PDF layout</p>
            <p className="mt-1 text-sm text-indigo-200/80">
              These preferences are stored in your browser and only affect newly generated PDFs.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Branding"
          description="Set company name and address that appear on generated PDFs. These values are stored in your browser by default."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Company name"
            value={settings.companyName ?? ""}
            onChange={(e) => updateField("companyName", e.target.value)}
            placeholder={process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Company"}
          />

          <Input
            label="Company address"
            value={settings.companyAddress ?? ""}
            onChange={(e) => updateField("companyAddress", e.target.value)}
            placeholder="Street, City, State, Country"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Page format"
          description="Control the page size, orientation, and margins used by the generator."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Paper size"
            value={settings.pageSize}
            onChange={(value) => updateField("pageSize", value as PdfSettings["pageSize"])}
            hint="Use Letter if your team prints on US-standard paper."
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </SelectField>

          <SelectField
            label="Orientation"
            value={settings.orientation}
            onChange={(value) => updateField("orientation", value as PdfSettings["orientation"])}
            hint="Landscape gives the table more horizontal room."
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </SelectField>

          <SelectField
            label="Margin"
            value={String(settings.margin)}
            onChange={(value) => updateField("margin", Number(value) as PdfSettings["margin"])}
            hint="Smaller margins fit more content on the page."
          >
            <option value="32">Tight</option>
            <option value="50">Standard</option>
            <option value="64">Spacious</option>
          </SelectField>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Document details"
          description="Show or hide optional content in the generated PDF."
        />

        <div className="grid gap-3">
          <ToggleField
            label="Show company address"
            description="Hide this if the company name alone is enough for your slips."
            checked={settings.showCompanyAddress}
            onChange={(value) => updateField("showCompanyAddress", value)}
          />
          <ToggleField
            label="Show footer note"
            description="Includes the generated-on line and the computer-generated disclaimer."
            checked={settings.showFooterNote}
            onChange={(value) => updateField("showFooterNote", value)}
          />
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <CircleCheckBig className="h-3.5 w-3.5 text-emerald-400" />
        {savedAt
          ? `Saved locally at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
          : "Changes save automatically in this browser."}
      </div>
    </div>
  );
}