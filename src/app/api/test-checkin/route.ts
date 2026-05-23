import { NextResponse } from "next/server";
import { verifyAndCheckIn } from "@/app/actions/check-in";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const session = searchParams.get("session") || "Day 1 - Afternoon";
  
  if (!ref) return NextResponse.json({ error: "Missing ref" });
  
  try {
    const res = await verifyAndCheckIn(ref, session);
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
