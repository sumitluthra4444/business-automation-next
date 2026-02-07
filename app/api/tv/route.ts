import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = String(searchParams.get("shopId") || "").trim();

    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json"
    };

    // 1) Load shop TV settings
    const shopRes = await fetch(
      `${supabaseUrl}/rest/v1/shops?id=eq.${shopId}&select=id,name,tv_left_percent,tv_ad_rotation_seconds&limit=1`,
      { headers, cache: "no-store" }
    );
    const shopJson = await shopRes.json();
    const shop = Array.isArray(shopJson) ? shopJson[0] : null;

    // 2) Load queue (queued + arrived only)
    const queueRes = await fetch(
      `${supabaseUrl}/rest/v1/queue_entries?shop_id=eq.${shopId}&status=in.(queued,arrived,checked_in)&select=id,status,created_at,customers(first_name,last_name),services(name,duration_minutes)&order=created_at.asc&limit=20`,
      { headers, cache: "no-store" }
    );
    const queueJson = await queueRes.json();
    const queueRaw = Array.isArray(queueJson) ? queueJson : [];

    // Build ETA from queue durations
    let running = 0;
    const queue = queueRaw.map((q: any) => {
      const duration = Number(q?.services?.duration_minutes ?? 0) || 0;

      const item = {
        id: q.id,
        status: q.status,
        created_at: q.created_at,
        eta_minutes: running,
        customer: q.customers || { first_name: "?", last_name: "?" },
        service: q.services || { name: "Service", duration_minutes: duration }
      };

      running += duration;
      return item;
    });

    // 3) Load TODAY bookings (booked only)
    // Use UTC day boundaries (fine for prototype)
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    const bookingsRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?shop_id=eq.${shopId}&status=eq.booked&start_at=gte.${dayStart.toISOString()}&start_at=lte.${dayEnd.toISOString()}&select=id,start_at,end_at,customers(first_name,last_name),services(name,duration_minutes)&order=start_at.asc&limit=20`,
      { headers, cache: "no-store" }
    );
    const bookingsJson = await bookingsRes.json();
    const bookingsRaw = Array.isArray(bookingsJson) ? bookingsJson : [];

    const bookings = bookingsRaw.map((b: any) => {
      const start = new Date(b.start_at);
      const minsFromNow = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60000));

      return {
        id: b.id,
        status: "booked",
        created_at: b.start_at,
        eta_minutes: minsFromNow, // time until appointment
        start_at: b.start_at,
        customer: b.customers || { first_name: "?", last_name: "?" },
        service: b.services || { name: "Service", duration_minutes: Number(b?.services?.duration_minutes ?? 0) || 0 }
      };
    });

    // 4) Load ads for this shop (active only)
    const adsRes = await fetch(
      `${supabaseUrl}/rest/v1/ads?shop_id=eq.${shopId}&is_active=eq.true&select=id,title,image_url,video_url,is_active,created_at&order=created_at.desc&limit=10`,
      { headers, cache: "no-store" }
    );
    const adsJson = await adsRes.json();
    const ads = Array.isArray(adsJson) ? adsJson : [];

    return NextResponse.json({
      ok: true,
      tv_left_percent: shop?.tv_left_percent ?? 70,
      tv_ad_rotation_seconds: shop?.tv_ad_rotation_seconds ?? 10,
      queue,
      bookings,
      ads
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
