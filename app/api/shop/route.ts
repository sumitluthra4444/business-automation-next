import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("id");

  if (!shopId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json"
  };

  // Fetch shop
  const shopRes = await fetch(
    `${supabaseUrl}/rest/v1/shops?id=eq.${shopId}&select=id,name,suburb&limit=1`,
    { headers, cache: "no-store" }
  );
  const shopData = await shopRes.json();

  // Fetch services
  const svcRes = await fetch(
    `${supabaseUrl}/rest/v1/services?shop_id=eq.${shopId}&select=id,name,duration_minutes,price&order=duration_minutes.asc`,
    { headers, cache: "no-store" }
  );
  const servicesData = await svcRes.json();

  return NextResponse.json({
    shop: shopData?.[0] ?? null,
    services: Array.isArray(servicesData) ? servicesData : []
  });
}
