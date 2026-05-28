import { NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError } from "@/lib/api-error";
import { getBrandingSettings, saveBrandingSettings } from "@/lib/branding";

const brandingUpdateSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  companyAddress: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function GET() {
  try {
    const settings = await getBrandingSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const settings = await saveBrandingSettings(brandingUpdateSchema.parse(body));
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err);
  }
}