import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function h() {
  return {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = String(searchParams.get("shopId") || "").trim();

    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/services?shop_id=eq.${shopId}&select=id,name,duration_minutes,slack_minutes,price,is_active&order=created_at.asc`,
      { headers: h(), cache: "no-store" }
    );

    const json = await res.json();
    if (!res.ok) {
  const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
  return NextResponse.json({ error: msg }, { status: 500 });
}


    return NextResponse.json({
      ok: true,
      services: Array.isArray(json) ? json : []
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shopId = String(body.shopId || "").trim();
    const name = String(body.name || "").trim();
    const duration_minutes = Number(body.duration_minutes);
    const slack_minutes = Number(body.slack_minutes ?? 0);
    const price = Number(body.price);

    if (!shopId || !name || !Number.isFinite(duration_minutes) || !Number.isFinite(price)) {
      return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/services`, {
      method: "POST",
      headers: h(),
      body: JSON.stringify({
        shop_id: shopId,
        name,
        duration_minutes,
        slack_minutes: Number.isFinite(slack_minutes) ? slack_minutes : 0,
        price,
        is_active: true
      })
    });

    const json = await res.json();
    if (!res.ok) {
  const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
  return NextResponse.json({ error: msg }, { status: 500 });
}


    return NextResponse.json({
      ok: true,
      service: Array.isArray(json) ? json[0] : json
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Allow updating: is_active OR core fields (future-proof)
    const patch: any = {};
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (body.duration_minutes !== undefined) patch.duration_minutes = Number(body.duration_minutes);
    if (body.slack_minutes !== undefined) patch.slack_minutes = Number(body.slack_minutes);
    if (body.price !== undefined) patch.price = Number(body.price);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/services?id=eq.${id}`, {
      method: "PATCH",
      headers: h(),
      body: JSON.stringify(patch)
    });

    const json = await res.json();
    if (!res.ok) {
  const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
  return NextResponse.json({ error: msg }, { status: 500 });
}


    return NextResponse.json({
      ok: true,
      service: Array.isArray(json) ? json[0] : json
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
