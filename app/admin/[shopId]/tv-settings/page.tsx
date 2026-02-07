"use client";

import { useEffect, useState } from "react";

type TvSettings = {
  tv_left_percent: number;
  tv_ad_rotation_seconds: number;
};

export default function TvSettingsPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;

  const [settings, setSettings] = useState<TvSettings>({
    tv_left_percent: 70,
    tv_ad_rotation_seconds: 10
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setOk(null);
    const res = await fetch(`/api/admin/tv-settings?shopId=${shopId}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load TV settings");
    setSettings({
      tv_left_percent: json.tv_left_percent ?? 70,
      tv_ad_rotation_seconds: json.tv_ad_rotation_seconds ?? 10
    });
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setErr(e.message);
      setLoading(false);
    });
  }, [shopId]);

  async function save() {
    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const res = await fetch(`/api/admin/tv-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...settings })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save");

      setOk("Saved ✅");
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setSaving(false);
      setTimeout(() => setOk(null), 2000);
    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>TV Settings</h1>
        <p style={{ opacity: 0.75, marginTop: 8 }}>
          Shop: <b>{shopId}</b>
        </p>

        {err && <div style={errorBox}><b>Error:</b> {err}</div>}
        {ok && <div style={okBox}>{ok}</div>}

        {loading ? (
          <div style={card}>Loading…</div>
        ) : (
          <div style={card}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={label}>Left panel % (Queue side)</div>
                <input
                  type="number"
                  min={30}
                  max={90}
                  value={settings.tv_left_percent}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, tv_left_percent: Number(e.target.value) }))
                  }
                  style={input}
                />
                <div style={hint}>Try 70 for queue / 30 for ads. Allowed 30–90.</div>
              </div>

              <div>
                <div style={label}>Ad rotation seconds</div>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={settings.tv_ad_rotation_seconds}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, tv_ad_rotation_seconds: Number(e.target.value) }))
                  }
                  style={input}
                />
                <div style={hint}>How often ads rotate on TV.</div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                style={{ ...btn, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>

              <a
                href={`/tv/${shopId}`}
                style={{ textDecoration: "none", ...btn, textAlign: "center" }}
              >
                Open TV Screen →
              </a>
            </div>
          </div>
        )}
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

const label: React.CSSProperties = { fontWeight: 900, opacity: 0.9, marginBottom: 8 };
const hint: React.CSSProperties = { opacity: 0.65, fontSize: 13, marginTop: 6 };

const input: React.CSSProperties = {
  width: "100%",
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
  cursor: "pointer"
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};

const okBox: React.CSSProperties = {
  background: "rgba(0,255,120,0.10)",
  border: "1px solid rgba(0,255,120,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};
