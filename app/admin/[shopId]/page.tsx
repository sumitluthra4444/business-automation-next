"use client";

import { useEffect, useState } from "react";

type Dash = {
  shop: { id: string; name: string; suburb: string } | null;
  stats: {
    total_active: number;
    queued: number;
    arrived: number;
    avg_eta_minutes: number;
    last_refresh: string;
  };
};

export default function AdminDashboard({
  params
}: {
  params: { shopId: string };
}) {
  const shopId = params.shopId;

  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/dashboard?shopId=${shopId}`, {
  cache: "no-store"
});

const text = await res.text();
let json: any;
try {
  json = JSON.parse(text);
} catch {
  throw new Error("API returned HTML (route missing or server error). Check /api/admin/dashboard");
}

if (!res.ok) throw new Error(json?.error || "Failed to load dashboard");
setData(json);

    if (!res.ok) throw new Error(json?.error || "Failed to load dashboard");
    setData(json);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    const i = setInterval(() => load().catch(() => {}), 5000); // auto refresh
    return () => clearInterval(i);
  }, [shopId]);

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2.2rem" }}>Admin Dashboard</h1>
            <div style={{ opacity: 0.75, marginTop: 8 }}>
              {data?.shop ? (
                <>
                  <b>{data.shop.name}</b> • {data.shop.suburb}
                </>
              ) : (
                <>Shop: <b>{shopId}</b></>
              )}
            </div>
          </div>

          <a
            href={`/tv/${shopId}`}
            style={{
              textDecoration: "none",
              ...btn,
              padding: "12px 16px"
            }}
          >
            Open TV Screen →
          </a>
        </div>

        {err && <div style={errorBox}><b>Error:</b> {err}</div>}

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 18 }}>
          <div style={card}>
            <div style={label}>Active Queue</div>
            <div style={big}>{data?.stats.total_active ?? "-"}</div>
            <div style={small}>Queued + Arrived</div>
          </div>

          <div style={card}>
            <div style={label}>Queued</div>
            <div style={big}>{data?.stats.queued ?? "-"}</div>
            <div style={small}>Not checked-in yet</div>
          </div>

          <div style={card}>
            <div style={label}>Arrived</div>
            <div style={big}>{data?.stats.arrived ?? "-"}</div>
            <div style={small}>Checked-in at kiosk</div>
          </div>

          <div style={card}>
            <div style={label}>Avg ETA</div>
            <div style={big}>{data ? `${data.stats.avg_eta_minutes}m` : "-"}</div>
            <div style={small}>Based on service durations</div>
          </div>
        </div>

        <div style={{ marginTop: 18, opacity: 0.8 }}>
          Quick Actions
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 12 }}>
          <a href={`/admin/${shopId}/services`} style={linkCard}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Services</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Add/edit durations, slack time, prices
            </div>
          </a>

          <a href={`/admin/${shopId}/ads`} style={linkCard}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Ads</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Manage sponsored ads shown on TV
            </div>
          </a>

          <a href={`/admin/${shopId}/tv-settings`} style={linkCard}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>TV Settings</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Split screen %, ad rotation seconds
            </div>
          </a>

          <div style={{ ...linkCard, opacity: 0.55, cursor: "not-allowed" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Bookings (next)</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Availability, future appointments
            </div>
          </div>

          <div style={{ ...linkCard, opacity: 0.55, cursor: "not-allowed" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Employees (next)</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Clock in/out, start/stop service
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, opacity: 0.65, fontSize: 13 }}>
          Auto-refresh: {data?.stats.last_refresh ? new Date(data.stats.last_refresh).toLocaleTimeString() : "-"}
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
  borderRadius: 18
};

const linkCard: React.CSSProperties = {
  ...card,
  textDecoration: "none",
  color: "inherit",
  display: "block"
};

const label: React.CSSProperties = { opacity: 0.7, fontWeight: 800 };
const big: React.CSSProperties = { fontSize: 42, fontWeight: 950, marginTop: 8 };
const small: React.CSSProperties = { opacity: 0.65, marginTop: 6 };

const btn: React.CSSProperties = {
  background: "rgba(77,163,255,0.22)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  borderRadius: 14,
  fontWeight: 900
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};
