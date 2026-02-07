"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function TVSettingsPage({
  params
}: {
  params: { shopId: string };
}) {
  const shopId = params.shopId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [shopName, setShopName] = useState<string>("");

  const [leftPercent, setLeftPercent] = useState<number>(70);
  const [rotateSeconds, setRotateSeconds] = useState<number>(10);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const { data, error } = await supabase
          .from("shops")
          .select("id,name,tv_left_percent,tv_ad_rotation_seconds")
          .eq("id", shopId)
          .single();

        if (error) throw error;

        if (!cancelled) {
          setShopName(data?.name || "");
          setLeftPercent(Number(data?.tv_left_percent ?? 70));
          setRotateSeconds(Number(data?.tv_ad_rotation_seconds ?? 10));
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load TV settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  async function save() {
    try {
      setSaving(true);
      setErr(null);

      const lp = Math.min(90, Math.max(10, Number(leftPercent) || 70));
      const rs = Math.min(120, Math.max(3, Number(rotateSeconds) || 10));

      const { error } = await supabase
        .from("shops")
        .update({
          tv_left_percent: lp,
          tv_ad_rotation_seconds: rs
        })
        .eq("id", shopId);

      if (error) throw error;

      setLeftPercent(lp);
      setRotateSeconds(rs);
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <a href={`/admin/${shopId}`} style={back}>
          ← Back to dashboard
        </a>

        <h1 style={h1}>TV Settings</h1>
        <div style={sub}>
          {shopName ? `${shopName} • ` : ""}Configure split screen + ad rotation
        </div>

        {loading && <div style={card}>Loading...</div>}

        {err && (
          <div style={errorBox}>
            <b>Error:</b> {err}
          </div>
        )}

        {!loading && (
          <div style={card}>
            <div style={row}>
              <div>
                <div style={label}>Left panel width (%)</div>
                <div style={hint}>
                  10–90. Left is queue list, right is ads.
                </div>
              </div>

              <input
                style={input}
                type="number"
                value={leftPercent}
                onChange={(e) => setLeftPercent(Number(e.target.value))}
                min={10}
                max={90}
              />
            </div>

            <div style={divider} />

            <div style={row}>
              <div>
                <div style={label}>Ad rotation (seconds)</div>
                <div style={hint}>
                  Minimum 3 sec. This controls how often ads rotate on TV.
                </div>
              </div>

              <input
                style={input}
                type="number"
                value={rotateSeconds}
                onChange={(e) => setRotateSeconds(Number(e.target.value))}
                min={3}
                max={120}
              />
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button style={btnPrimary} onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>

              <a
                href={`/tv/${shopId}`}
                target="_blank"
                rel="noreferrer"
                style={btnGhost}
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
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const back: React.CSSProperties = {
  color: "#8cc7ff",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: 14
};

const h1: React.CSSProperties = {
  fontSize: "2.2rem",
  margin: 0,
  fontWeight: 850
};

const sub: React.CSSProperties = {
  marginTop: 8,
  opacity: 0.75,
  marginBottom: 18
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 18
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16
};

const label: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 16
};

const hint: React.CSSProperties = {
  opacity: 0.7,
  marginTop: 4,
  fontSize: 13
};

const input: React.CSSProperties = {
  width: 140,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 750,
  outline: "none"
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.10)",
  margin: "16px 0"
};

const btnPrimary: React.CSSProperties = {
  background: "rgba(77,163,255,0.22)",
  border: "1px solid rgba(77,163,255,0.40)",
  color: "#d8f0ff",
  padding: "10px 14px",
  borderRadius: 14,
  fontWeight: 850,
  cursor: "pointer"
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  padding: "10px 14px",
  borderRadius: 14,
  fontWeight: 850,
  textDecoration: "none"
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginBottom: 16
};
