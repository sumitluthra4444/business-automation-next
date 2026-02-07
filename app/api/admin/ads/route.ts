import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function headers(preferReturn = false) {
  return {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
    ...(preferReturn ? { Prefer: "return=representation" } : {})
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
      `${SUPABASE_URL}/rest/v1/ads?shop_id=eq.${shopId}&select=id,title,image_url,video_url,is_active,created_at&order=created_at.desc`,
      { headers: headers(), cache: "no-store" }
    );

    const json = await res.json();
    if (!res.ok) {
      const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

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
    const videoUrl = String(body.videoUrl || "").trim();

    if (!shopId || (!title && !imageUrl && !videoUrl)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/ads`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({
        shop_id: shopId,
        title: title || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        is_active: true
      })
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

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
      headers: headers(true),
      body: JSON.stringify({ is_active })
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = typeof json?.message === "string" ? json.message : JSON.stringify(json);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ad: Array.isArray(json) ? json[0] : json });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
