import { NextResponse } from "next/server";

function headers() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = String(searchParams.get("shopId") || "").trim();

    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ads?shop_id=eq.${shopId}&select=id,title,image_url,is_active,created_at&order=created_at.desc`,
      { headers: headers(), cache: "no-store" }
    );

    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: json }, { status: 500 });

    return NextResponse.json({ ok: true, ads: Array.isArray(json) ? json : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shopId = String(body.shopId || "").trim();
    const title = String(body.title || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();

    if (!shopId || (!title && !imageUrl)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/ads`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        shop_id: shopId,
        title: title || null,
        image_url: imageUrl || null,
        is_active: true
      })
    });

    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: json }, { status: 500 });

    return NextResponse.json({ ok: true, ad: Array.isArray(json) ? json[0] : json });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const is_active = Boolean(body.is_active);

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ is_active })
    });

    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: json }, { status: 500 });

    return NextResponse.json({ ok: true, ad: Array.isArray(json) ? json[0] : json });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
