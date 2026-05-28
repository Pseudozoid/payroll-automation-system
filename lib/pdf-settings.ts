import { z } from "zod";

export const pdfSettingsSchema = z.object({
  pageSize: z.enum(["A4", "Letter"]),
  orientation: z.enum(["portrait", "landscape"]),
  margin: z.number().int().min(32).max(80),
  showCompanyAddress: z.boolean(),
  showFooterNote: z.boolean(),
  companyName: z.string().max(200).optional(),
  companyAddress: z.string().max(500).optional(),
});

export type PdfSettings = z.infer<typeof pdfSettingsSchema>;

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  pageSize: "A4",
  orientation: "portrait",
  margin: 50,
  showCompanyAddress: true,
  showFooterNote: true,
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "",
  companyAddress: undefined,
};

export const PDF_SETTINGS_STORAGE_KEY = "salary-slip-settings:pdf-layout";

export function parsePdfSettings(value: unknown): PdfSettings {
  const parsed = pdfSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_PDF_SETTINGS;
}

export function loadPdfSettings(): PdfSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PDF_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(PDF_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PDF_SETTINGS;
    }

    return parsePdfSettings(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_PDF_SETTINGS;
  }
}

export function savePdfSettings(settings: PdfSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PDF_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
