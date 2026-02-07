"use client";

import { useEffect, useState } from "react";

type Ad = {
  id: string;
  title: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdsAdminPage({
  params
}: {
  params: { shopId: string };
}) {
  const shopId = params.shopId;

  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/ads?shopId=${shopId}`, {
      cache: "no-store"
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load ads");
    setAds(json.ads || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [shopId]);

  async function addAd() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`/api/admin/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          title,
          imageUrl
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add ad");

      setTitle("");
      setImageUrl("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, is_active: boolean) {
    try {
      setErr(null);
      const res = await fetch(`/api/admin/ads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update ad");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Ads Admin</h1>
        <p style={{ opacity: 0.75, marginTop: 8 }}>
          Shop: <b>{shopId}</b>
        </p>

        {err && <div style={errorBox}><b>Error:</b> {err}</div>}

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Add new Ad</div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Ad title (fallback if no image)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={input}
            />
            <input
              placeholder="Image URL (for now)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={input}
            />
            <button
              onClick={addAd}
              disabled={loading || (!title.trim() && !imageUrl.trim())}
              style={{
                ...btn,
                opacity: loading || (!title.trim() && !imageUrl.trim()) ? 0.5 : 1
              }}
            >
              {loading ? "Adding..." : "Add Ad"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, marginBottom: 10, opacity: 0.8 }}>
          Existing Ads
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {ads.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>{a.title || "(no title)"}</div>
                <div style={{ opacity: 0.7, marginTop: 6, wordBreak: "break-all" }}>
                  {a.image_url || "No image URL"}
                </div>
              </div>

              <button
                onClick={() => toggle(a.id, !a.is_active)}
                style={{
                  ...btn,
                  background: a.is_active
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(77,163,255,0.22)",
                  border: a.is_active
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(77,163,255,0.45)"
                }}
              >
                {a.is_active ? "Disable" : "Enable"}
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
