import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function h(preferReturn = false) {
  return {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
    ...(preferReturn ? { Prefer: "return=representation" } : {})
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = String(searchParams.get("shopId") || "").trim();
    if (!shopId) return NextResponse.json({ error: "Missing shopId" }, { status: 400 });

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shops?id=eq.${shopId}&select=tv_left_percent,tv_ad_rotation_seconds&limit=1`,
      { headers: h(), cache: "no-store" }
    );

    const json = await res.json();
    if (!res.ok) {
      const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const row = Array.isArray(json) ? json[0] : null;
    return NextResponse.json({
      ok: true,
      tv_left_percent: row?.tv_left_percent ?? 70,
      tv_ad_rotation_seconds: row?.tv_ad_rotation_seconds ?? 10
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const shopId = String(body.shopId || "").trim();
    const tv_left_percent = Number(body.tv_left_percent);
    const tv_ad_rotation_seconds = Number(body.tv_ad_rotation_seconds);

    if (!shopId) return NextResponse.json({ error: "Missing shopId" }, { status: 400 });

    const left = Number.isFinite(tv_left_percent) ? tv_left_percent : 70;
    const rot = Number.isFinite(tv_ad_rotation_seconds) ? tv_ad_rotation_seconds : 10;

    // clamp
    const leftClamped = Math.min(90, Math.max(30, left));
    const rotClamped = Math.min(60, Math.max(3, rot));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/shops?id=eq.${shopId}`, {
      method: "PATCH",
      headers: h(true),
      body: JSON.stringify({
        tv_left_percent: leftClamped,
        tv_ad_rotation_seconds: rotClamped
      })
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const row = Array.isArray(json) ? json[0] : null;
    return NextResponse.json({
      ok: true,
      tv_left_percent: row?.tv_left_percent ?? leftClamped,
      tv_ad_rotation_seconds: row?.tv_ad_rotation_seconds ?? rotClamped
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
