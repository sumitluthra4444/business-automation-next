"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  slack_minutes: number;
  price: number;
  is_active: boolean;
};

export default function ServicesAdminPage({
  params
}: {
  params: { shopId: string };
}) {
  const shopId = params.shopId;

  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState<number>(20);
  const [slack, setSlack] = useState<number>(0);
  const [price, setPrice] = useState<number>(45);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/services?shopId=${shopId}`, {
      cache: "no-store"
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load services");
    setServices(json.services || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [shopId]);

  async function addService() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`/api/admin/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          name,
          duration_minutes: duration,
          slack_minutes: slack,
          price
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add service");

      setName("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleService(id: string, is_active: boolean) {
    try {
      setErr(null);
      const res = await fetch(`/api/admin/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update service");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Services Admin</h1>
        <p style={{ opacity: 0.75, marginTop: 8 }}>
          Shop: <b>{shopId}</b>
        </p>

        {err && <div style={errorBox}><b>Error:</b> {err}</div>}

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Add Service</div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Service name (e.g. Mens Cut)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={input}
            />

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" }}>
              <input
                type="number"
                placeholder="Duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={input}
              />
              <input
                type="number"
                placeholder="Slack"
                value={slack}
                onChange={(e) => setSlack(Number(e.target.value))}
                style={input}
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                style={input}
              />
            </div>

            <button
              onClick={addService}
              disabled={loading || name.trim().length < 2}
              style={{
                ...btn,
                opacity: loading || name.trim().length < 2 ? 0.5 : 1
              }}
            >
              {loading ? "Adding..." : "Add Service"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, marginBottom: 10, opacity: 0.8 }}>
          Existing Services
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {services.map((s) => (
            <div key={s.id} style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>{s.name}</div>
                <div style={{ opacity: 0.7, marginTop: 6 }}>
                  {s.duration_minutes}m + slack {s.slack_minutes}m • ${s.price}
                </div>
              </div>

              <button
                onClick={() => toggleService(s.id, !s.is_active)}
                style={{
                  ...btn,
                  background: s.is_active
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(77,163,255,0.22)",
                  border: s.is_active
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(77,163,255,0.45)"
                }}
              >
                {s.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#0b0b0b",
  color: "white",
  display: "flex",
  justifyContent: "center",
  padding: "32px 16px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 18,
  marginTop: 16
};

const row: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 16,
  borderRadius: 18,
  display: "flex",
  gap: 12,
  alignItems: "center"
};

const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none"
};

const btn: React.CSSProperties = {
  background: "rgba(77,163,255,0.22)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "12px 14px",
  borderRadius: 14,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap"
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};
