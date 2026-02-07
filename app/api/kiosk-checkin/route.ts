import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shopId = String(body.shopId || "").trim();
    const lastNameInput = String(body.lastName || "").trim();
    const phone = String(body.phone || "").trim();

    if (!shopId || !lastNameInput || !phone) {
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

    // 1) Find customer by phone
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?phone=eq.${encodeURIComponent(
        phone
      )}&select=id,first_name,last_name&limit=1`,
      { headers, cache: "no-store" }
    );

    const custJson = await custRes.json();
    const customer = Array.isArray(custJson) ? custJson[0] : null;

    if (!customer?.id) {
      return NextResponse.json(
        { error: "Customer not found. Please join queue first." },
        { status: 404 }
      );
    }

    // 2) Validate last name (case-insensitive)
    const dbLastName = String(customer.last_name || "").trim().toLowerCase();
    const inputLastName = lastNameInput.toLowerCase();

    if (dbLastName !== inputLastName) {
      return NextResponse.json(
        { error: "Last name does not match phone number." },
        { status: 401 }
      );
    }

    // 3) Find latest queued entry for this customer + shop
    const qeRes = await fetch(
      `${supabaseUrl}/rest/v1/queue_entries?shop_id=eq.${shopId}&customer_id=eq.${customer.id}&status=eq.queued&select=id,created_at&order=created_at.desc&limit=1`,
      { headers, cache: "no-store" }
    );

    const qeJson = await qeRes.json();
    const qe = Array.isArray(qeJson) ? qeJson[0] : null;

    if (!qe?.id) {
      return NextResponse.json(
        { error: "No active queued booking found for this customer." },
        { status: 404 }
      );
    }

    // 4) Update entry -> checked_in
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/queue_entries?id=eq.${qe.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "arrived",
          checked_in_at: new Date().toISOString()
        })
      }
    );

    if (!patchRes.ok) {
      const err = await patchRes.text();
      return NextResponse.json(
        { error: `Failed to check in: ${err}` },
        { status: 500 }
      );
    }

    const patched = await patchRes.json();
    const updated = Array.isArray(patched) ? patched[0] : null;

    return NextResponse.json({
      ok: true,
      queueEntryId: updated?.id || qe.id
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
