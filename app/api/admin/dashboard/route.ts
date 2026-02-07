import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function h() {
  return {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json"
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = String(searchParams.get("shopId") || "").trim();

    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    // Shop info
    const shopRes = await fetch(
      `${SUPABASE_URL}/rest/v1/shops?id=eq.${shopId}&select=id,name,suburb&limit=1`,
      { headers: h(), cache: "no-store" }
    );
    const shopJson = await shopRes.json();
    const shop = Array.isArray(shopJson) ? shopJson[0] : null;

    // Active queue entries (queued + arrived), with service duration for ETA calc
    const qRes = await fetch(
      `${SUPABASE_URL}/rest/v1/queue_entries?shop_id=eq.${shopId}&status=in.(queued,arrived)&select=id,status,created_at,services(duration_minutes)&order=created_at.asc&limit=50`,
      { headers: h(), cache: "no-store" }
    );
    const qJson = await qRes.json();
    const rows = Array.isArray(qJson) ? qJson : [];

    const queued = rows.filter((r: any) => r.status === "queued").length;
    const arrived = rows.filter((r: any) => r.status === "arrived").length;
    const total_active = rows.length;

    // avg ETA based on running sum (same idea as TV)
    let running = 0;
    const etas: number[] = [];
    for (const r of rows) {
      etas.push(running);
      const dur = Number(r?.services?.duration_minutes ?? 0) || 0;
      running += dur;
    }
    const avg_eta_minutes =
      etas.length > 0 ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : 0;

    return NextResponse.json({
      ok: true,
      shop,
      stats: {
        total_active,
        queued,
        arrived,
        avg_eta_minutes,
        last_refresh: new Date().toISOString()
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
