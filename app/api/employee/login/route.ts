import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const shopId = String(body.shopId || "").trim();
    const pin = String(body.pin || "").trim();

    if (!shopId || !pin) {
      return NextResponse.json({ error: "Missing shopId or pin" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

    // find employee by shop + pin
    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?shop_id=eq.${shopId}&pin=eq.${encodeURIComponent(pin)}&is_active=eq.true&select=id,name,role&limit=1`,
      { headers, cache: "no-store" }
    );
    const empJson = await empRes.json();
    const employee = Array.isArray(empJson) ? empJson[0] : null;

    if (!employee?.id) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // check if clocked in
    const attRes = await fetch(
      `${supabaseUrl}/rest/v1/employee_attendance?shop_id=eq.${shopId}&employee_id=eq.${employee.id}&clock_out_at=is.null&select=id&limit=1`,
      { headers, cache: "no-store" }
    );
    const attJson = await attRes.json();
    const clockedIn = Array.isArray(attJson) && attJson.length > 0;

    return NextResponse.json({ ok: true, employee, clockedIn });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
