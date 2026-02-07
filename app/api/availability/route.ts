import { NextResponse } from "next/server";

function toInt(x: any, fallback: number) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60 * 1000);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const shopId = String(searchParams.get("shopId") || "").trim();
    const serviceId = String(searchParams.get("serviceId") || "").trim();
    const date = String(searchParams.get("date") || "").trim(); // YYYY-MM-DD

    if (!shopId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing shopId, serviceId, or date" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json"
    };

    // 1) Load shop hours
    const shopRes = await fetch(
      `${supabaseUrl}/rest/v1/shops?id=eq.${shopId}&select=id,name,open_time,close_time&limit=1`,
      { headers, cache: "no-store" }
    );
    const shopJson = await shopRes.json();
    const shop = Array.isArray(shopJson) ? shopJson[0] : null;

    const openTime = String(shop?.open_time || "09:00"); // "HH:mm"
    const closeTime = String(shop?.close_time || "18:00");

    // 2) Load service duration
    const svcRes = await fetch(
      `${supabaseUrl}/rest/v1/services?id=eq.${serviceId}&select=id,duration_minutes,name&limit=1`,
      { headers, cache: "no-store" }
    );
    const svcJson = await svcRes.json();
    const svc = Array.isArray(svcJson) ? svcJson[0] : null;

    const duration = toInt(svc?.duration_minutes, 20);
    const step = 10; // slot granularity (mins) for MVP

    // 3) Compute day start/end in UTC (simple MVP)
    // We’ll treat date input as local-like but stored as ISO. Good enough for prototype.
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // 4) Fetch existing bookings for that day
    const bookingsRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?shop_id=eq.${shopId}&status=eq.booked&start_at=gte.${dayStart.toISOString()}&start_at=lte.${dayEnd.toISOString()}&select=id,start_at,end_at`,
      { headers, cache: "no-store" }
    );
    const bookingsJson = await bookingsRes.json();
    const bookings = Array.isArray(bookingsJson) ? bookingsJson : [];

    // helper overlap
    const overlaps = (start: Date, end: Date) => {
      const s = start.getTime();
      const e = end.getTime();
      return bookings.some((b: any) => {
        const bs = new Date(b.start_at).getTime();
        const be = new Date(b.end_at).getTime();
        return s < be && e > bs;
      });
    };

    // 5) Build available slots between open and close
    const [oh, om] = openTime.split(":").map((x) => toInt(x, 0));
    const [ch, cm] = closeTime.split(":").map((x) => toInt(x, 0));

    const openAt = new Date(dayStart);
    openAt.setUTCHours(oh, om, 0, 0);

    const closeAt = new Date(dayStart);
    closeAt.setUTCHours(ch, cm, 0, 0);

    const slots: { start: string; end: string }[] = [];
    for (
      let cur = new Date(openAt);
      cur.getTime() + duration * 60 * 1000 <= closeAt.getTime();
      cur = addMinutes(cur, step)
    ) {
      const start = cur;
      const end = addMinutes(cur, duration);

      if (!overlaps(start, end)) {
        slots.push({ start: start.toISOString(), end: end.toISOString() });
      }
    }

    return NextResponse.json({
      ok: true,
      shop: { id: shopId, name: shop?.name || "" },
      service: { id: serviceId, name: svc?.name || "", duration_minutes: duration },
      date,
      open_time: openTime,
      close_time: closeTime,
      step_minutes: step,
      slots
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
