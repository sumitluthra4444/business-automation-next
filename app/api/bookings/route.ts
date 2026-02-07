import { NextResponse } from "next/server";

type Body = {
  shopId?: string;
  serviceId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  startAt?: string; // ISO
};

function clean(s: any) {
  return String(s || "").trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const shopId = clean(body.shopId);
    const serviceId = clean(body.serviceId);
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const phone = clean(body.phone);
    const startAt = clean(body.startAt);

    if (!shopId || !serviceId || !firstName || !lastName || !phone || !startAt) {
      return NextResponse.json(
        { error: "Missing shopId/serviceId/name/phone/startAt" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };

    // 1) Find-or-create customer (phone = key)
    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?phone=eq.${encodeURIComponent(
        phone
      )}&select=id,first_name,last_name,phone&limit=1`,
      { headers, cache: "no-store" }
    );
    const findJson = await findRes.json();
    let customer = Array.isArray(findJson) ? findJson[0] : null;

    if (!customer) {
      const createRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify([
          { first_name: firstName, last_name: lastName, phone }
        ])
      });
      const createJson = await createRes.json();
      customer = Array.isArray(createJson) ? createJson[0] : null;
    }

    if (!customer?.id) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    // 2) Load service duration
    const svcRes = await fetch(
      `${supabaseUrl}/rest/v1/services?id=eq.${serviceId}&select=id,duration_minutes,name&limit=1`,
      { headers, cache: "no-store" }
    );
    const svcJson = await svcRes.json();
    const svc = Array.isArray(svcJson) ? svcJson[0] : null;

    const duration = Number(svc?.duration_minutes ?? 20) || 20;
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // 3) Create booking (DB trigger prevents overlaps)
    const bookingRes = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify([
        {
          shop_id: shopId,
          service_id: serviceId,
          customer_id: customer.id,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          status: "booked"
        }
      ])
    });

    if (!bookingRes.ok) {
      const errJson = await bookingRes.json();
      return NextResponse.json(
        { error: errJson?.message || "Booking failed (overlap?)", raw: errJson },
        { status: 400 }
      );
    }

    const bookingJson = await bookingRes.json();
    const booking = Array.isArray(bookingJson) ? bookingJson[0] : null;

    return NextResponse.json({ ok: true, booking });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
