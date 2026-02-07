import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shopId = String(body.shopId || "").trim();
    const serviceId = String(body.serviceId || "").trim();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phone = String(body.phone || "").trim();

    if (!shopId || !serviceId || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // 1) Find existing customer by phone
    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?phone=eq.${encodeURIComponent(
        phone
      )}&select=id,first_name,last_name&limit=1`,
      { headers, cache: "no-store" }
    );

    let customer = null as null | { id: string; first_name: string; last_name: string };
    const found = await findRes.json();
    if (Array.isArray(found) && found.length > 0) customer = found[0];

    // 2) Create customer if not found
    if (!customer) {
      const createRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone
        })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        return NextResponse.json(
          { error: `Customer create failed: ${err}` },
          { status: 500 }
        );
      }

      const created = await createRes.json();
      customer = created?.[0] || null;
    }

    if (!customer?.id) {
      return NextResponse.json(
        { error: "Customer resolution failed" },
        { status: 500 }
      );
    }

    // 3) Create queue entry
    const queueRes = await fetch(`${supabaseUrl}/rest/v1/queue_entries`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        shop_id: shopId,
        customer_id: customer.id,
        service_id: serviceId,
        status: "queued"
      })
    });

    if (!queueRes.ok) {
      const err = await queueRes.text();
      return NextResponse.json(
        { error: `Queue create failed: ${err}` },
        { status: 500 }
      );
    }

    const queueCreated = await queueRes.json();
    const queueEntry = queueCreated?.[0] || null;

    return NextResponse.json({
      ok: true,
      customerId: customer.id,
      queueEntryId: queueEntry?.id || null
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
