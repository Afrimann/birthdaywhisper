export const revalidate = 86400;

import { NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({
      banks: banks.map((b) => ({ name: b.name, code: b.code })),
    });
  } catch {
    return NextResponse.json({ error: "Could not load banks" }, { status: 502 });
  }
}
