import { supabase } from "../lib/supabase";

type Shop = {
  id: string;
  name: string;
  suburb: string;
};

export default async function Home() {
  const { data: shops, error } = await supabase
    .from("shops")
    .select("id,name,suburb")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0b0b",
        color: "white",
        display: "flex",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "2.2rem", margin: 0 }}>Business Automation</h1>
          <p style={{ color: "#4da3ff", marginTop: 8, marginBottom: 0 }}>
            Sydney (Metro) • Prototype
          </p>
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            Choose a shop to join queue or book (coming next).
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255,0,0,0.12)",
              border: "1px solid rgba(255,0,0,0.25)",
              padding: 14,
              borderRadius: 16
            }}
          >
            <b>Supabase error:</b> {error.message}
            <div style={{ opacity: 0.8, marginTop: 8 }}>
              Check your Vercel env vars:
              <br />
              <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </div>
          </div>
        )}

        {!error && (!shops || shops.length === 0) && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              padding: 14,
              borderRadius: 16
            }}
          >
            No shops found yet.
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {(shops as Shop[] | null)?.map((s) => (
            <a
              key={s.id}
              href={`/shop/${s.id}`}
              style={{
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: 16,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 650 }}>
                    {s.name}
                  </div>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>{s.suburb}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: "rgba(77,163,255,0.16)",
                      border: "1px solid rgba(77,163,255,0.35)",
                      color: "#8cc7ff",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 650,
                      fontSize: 12
                    }}
                  >
                    WAIT • TBC
                  </div>
                  <div style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>
                    Tap to view
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
