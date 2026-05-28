import { z } from "zod";

import { prisma } from "@/lib/prisma";

const brandingSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  companyAddress: z.string().trim().max(500).optional().or(z.literal("")),
});

export type BrandingSettings = {
  companyName: string;
  companyAddress?: string;
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Company",
  companyAddress: process.env.COMPANY_ADDRESS ?? undefined,
};

function normalizeBrandingSettings(
  settings: Partial<BrandingSettings> | null | undefined
): BrandingSettings {
  const companyName = settings?.companyName?.trim() || DEFAULT_BRANDING_SETTINGS.companyName;
  const companyAddress = settings?.companyAddress?.trim() || DEFAULT_BRANDING_SETTINGS.companyAddress;

  return {
    companyName,
    companyAddress: companyAddress || undefined,
  };
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const row = await prisma.brandingSettings.findUnique({
    where: { id: 1 },
  });

  return normalizeBrandingSettings(row);
}

export async function saveBrandingSettings(input: unknown): Promise<BrandingSettings> {
  const parsed = brandingSchema.parse(input);
  const normalized = normalizeBrandingSettings(parsed);

  await prisma.brandingSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName: normalized.companyName,
      companyAddress: normalized.companyAddress,
    },
    update: {
      companyName: normalized.companyName,
      companyAddress: normalized.companyAddress,
    },
  });

  return normalized;
}