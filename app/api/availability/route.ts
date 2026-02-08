import { NextResponse } from "next/server";

function toInt(x: any, fallback: number) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60 * 1000);
}

// accepts "09:00" or "09:00:00"
function parseHHMM(time: string) {
  const parts = String(time || "").split(":");
  const hh = toInt(parts[0], 9);
  const mm = toInt(parts[1], 0);
  return { hh, mm };
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

    // basic date check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format (expected YYYY-MM-DD)" },
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

    // 0) Load shop name (just for response)
    const shopRes = await fetch(
      `${supabaseUrl}/rest/v1/shops?id=eq.${shopId}&select=id,name&limit=1`,
      { headers, cache: "no-store" }
    );
    const shopJson = await shopRes.json();
    const shop = Array.isArray(shopJson) ? shopJson[0] : null;

    // 1) Load service duration
    const svcRes = await fetch(
      `${supabaseUrl}/rest/v1/services?id=eq.${serviceId}&select=id,duration_minutes,name&limit=1`,
      { headers, cache: "no-store" }
    );
    const svcJson = await svcRes.json();
    const svc = Array.isArray(svcJson) ? svcJson[0] : null;

    const duration = toInt(svc?.duration_minutes, 20);
    const step = 10; // slot granularity (mins) for MVP

    // 2) Compute the day window as [date 00:00, nextDate 00:00)
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    // day_of_week: 0=Sun..6=Sat
    const dayOfWeek = dayStart.getUTCDay();

    // 3) Load shop hours from shop_hours (this is the important fix)
    const hoursRes = await fetch(
      `${supabaseUrl}/rest/v1/shop_hours?shop_id=eq.${shopId}&day_of_week=eq.${dayOfWeek}&select=open_time,close_time,is_closed&limit=1`,
      { headers, cache: "no-store" }
    );
    const hoursJson = await hoursRes.json();
    const hours = Array.isArray(hoursJson) ? hoursJson[0] : null;

    if (!hours || hours?.is_closed) {
      return NextResponse.json({
        ok: true,
        shop: { id: shopId, name: shop?.name || "" },
        service: { id: serviceId, name: svc?.name || "", duration_minutes: duration },
        date,
        open_time: null,
        close_time: null,
        step_minutes: step,
        slots: []
      });
    }

    const openTime = String(hours.open_time);   // e.g. "09:00:00"
    const closeTime = String(hours.close_time); // e.g. "18:00:00"

    // 4) Fetch existing bookings for that day
    const bookingsRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?shop_id=eq.${shopId}&status=eq.booked&start_at=gte.${dayStart.toISOString()}&start_at=lt.${dayEnd.toISOString()}&select=id,start_at,end_at&order=start_at.asc`,
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
    const { hh: oh, mm: om } = parseHHMM(openTime);
    const { hh: ch, mm: cm } = parseHHMM(closeTime);

    const openAt = new Date(dayStart);
    openAt.setUTCHours(oh, om, 0, 0);

    const closeAt = new Date(dayStart);
    closeAt.setUTCHours(ch, cm, 0, 0);

    const slots: { start: string; end: string; label: string }[] = [];

    const pad2 = (n: number) => String(n).padStart(2, "0");
    const labelFromUTC = (dt: Date) => `${pad2(dt.getUTCHours())}:${pad2(dt.getUTCMinutes())}`;

    for (
      let cur = new Date(openAt);
      cur.getTime() + duration * 60 * 1000 <= closeAt.getTime();
      cur = addMinutes(cur, step)
    ) {
      const start = cur;
      const end = addMinutes(cur, duration);

      if (!overlaps(start, end)) {
        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: labelFromUTC(start)
        });
      }
    }

    return NextResponse.json({
      ok: true,
      shop: { id: shopId, name: shop?.name || "" },
      service: { id: serviceId, name: svc?.name || "", duration_minutes: duration },
      date,
      day_of_week: dayOfWeek,
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
