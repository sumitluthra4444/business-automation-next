import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const shopId = String(body.shopId || "").trim();
    const employeeId = String(body.employeeId || "").trim();
    const queueEntryId = body.queueEntryId ? String(body.queueEntryId).trim() : null;
    const bookingId = body.bookingId ? String(body.bookingId).trim() : null;

    if (!shopId || !employeeId || (!queueEntryId && !bookingId)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };

    // optional: prevent multiple open sessions per employee
    const openRes = await fetch(
      `${supabaseUrl}/rest/v1/service_sessions?shop_id=eq.${shopId}&employee_id=eq.${employeeId}&finished_at=is.null&select=id&limit=1`,
      { headers, cache: "no-store" }
    );
    const openJson = await openRes.json();
    if (Array.isArray(openJson) && openJson.length > 0) {
      return NextResponse.json({ error: "You already have an active service." }, { status: 409 });
    }

    // create session
    const create = await fetch(`${supabaseUrl}/rest/v1/service_sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        shop_id: shopId,
        employee_id: employeeId,
        queue_entry_id: queueEntryId,
        booking_id: bookingId
      })
    });
    if (!create.ok) return NextResponse.json({ error: await create.text() }, { status: 500 });

    // if queue entry: optionally mark as "arrived" or "in_service" (if your constraint allows)
    // Keeping it simple: do nothing here; we can add a proper in_service status later.

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
