import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = String(searchParams.get("shopId") || "").trim();
    const date = String(searchParams.get("date") || "").trim(); // YYYY-MM-DD

    if (!shopId || !date) {
      return NextResponse.json({ error: "Missing shopId or date" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

    // queue (queued + arrived)
    const qRes = await fetch(
      `${supabaseUrl}/rest/v1/queue_entries?shop_id=eq.${shopId}&status=in.(queued,arrived)&select=id,status,created_at,customers(first_name,last_name),services(name,duration_minutes)&order=created_at.asc&limit=30`,
      { headers, cache: "no-store" }
    );
    const qJson = await qRes.json();
    const queueRaw = Array.isArray(qJson) ? qJson : [];

    // compute ETA running
    let running = 0;
    const queue = queueRaw.map((q: any) => {
      const duration = Number(q?.services?.duration_minutes ?? 0) || 0;
      const item = {
        id: q.id,
        status: q.status,
        eta_minutes: running,
        customer: q.customers || { first_name: "?", last_name: "?" },
        service: q.services || { name: "Service", duration_minutes: duration }
      };
      running += duration;
      return item;
    });

    // today bookings (booked only)
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const bRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?shop_id=eq.${shopId}&status=eq.booked&start_at=gte.${dayStart.toISOString()}&start_at=lte.${dayEnd.toISOString()}&select=id,start_at,customers(first_name,last_name),services(name)&order=start_at.asc&limit=30`,
      { headers, cache: "no-store" }
    );
    const bJson = await bRes.json();
    const bookings = (Array.isArray(bJson) ? bJson : []).map((b: any) => ({
      id: b.id,
      start_at: b.start_at,
      customer: b.customers || { first_name: "?", last_name: "?" },
      service: b.services || { name: "Service" }
    }));

    return NextResponse.json({ ok: true, queue, bookings });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
