"use client";

import { useEffect, useState } from "react";

type QueueEntry = {
  id: string;
  status: string;
  created_at: string;
  eta_minutes: number;
  customer: {
    first_name: string;
    last_name: string;
  };
  service: {
    name: string;
  };
};

type Ad = {
  id: string;
  title: string;
  image_url: string | null;
};

export default function TVPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adIndex, setAdIndex] = useState(0);

  // TV settings (from DB via /api/tv)
  const [split, setSplit] = useState(70);
  const [rotateSec, setRotateSec] = useState(10);

  const [err, setErr] = useState<string | null>(null);

  // Fetch queue + TV config
  async function load() {
    try {
      const res = await fetch(`/api/tv?shopId=${shopId}`, { cache: "no-store" });
      const text = await res.text();

      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("TV API returned HTML (route missing or server error).");
      }

      if (!res.ok) throw new Error(json?.error || "Failed to load TV data");

      setQueue(json.queue || []);
      setAds(json.ads || []);

      // Clamp split and rotation so TV never breaks
      const s = Number(json.tv_left_percent ?? 70);
      const r = Number(json.tv_ad_rotation_seconds ?? 10);

      const sClamped = Math.min(90, Math.max(30, Number.isFinite(s) ? s : 70));
      const rClamped = Math.min(60, Math.max(3, Number.isFinite(r) ? r : 10));

      setSplit(sClamped);
      setRotateSec(rClamped);

      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    }
  }

  // Auto refresh queue + settings
  useEffect(() => {
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [shopId]);

  // Rotate ads (rebuild interval when rotateSec changes)
  useEffect(() => {
    if (!ads.length) return;

    const i = setInterval(() => {
      setAdIndex((x) => (x + 1) % ads.length);
    }, rotateSec * 1000);

    return () => clearInterval(i);
  }, [ads, rotateSec]);

  // Keep ad index valid if ads length changes
  useEffect(() => {
    if (adIndex >= ads.length) setAdIndex(0);
  }, [ads.length, adIndex]);

  return (
    <main style={page}>
      <div style={{ ...left, width: `${split}%` }}>
        <h1 style={title}>Now Serving</h1>

        {err && (
          <div style={errorBox}>
            <b>TV error:</b> {err}
          </div>
        )}

        {queue.length === 0 && <div style={empty}>No customers in queue</div>}

        {queue.map((q, i) => (
          <div key={q.id} style={row}>
            <div style={pos}>{i + 1}</div>

            <div>
              <div style={name}>
                {q.customer.first_name}{" "}
                {q.customer.last_name ? q.customer.last_name[0] : ""}
              </div>

              <div style={service}>
                {q.service.name} • ETA {q.eta_minutes}m
              </div>
            </div>

            <div style={status}>{(q.status || "").toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ ...right, width: `${100 - split}%` }}>
        {ads.length === 0 ? (
          <div style={adPlaceholder}>
            <div>YOUR AD HERE</div>
            <div style={{ fontSize: 18, opacity: 0.6 }}>Sponsored space</div>
          </div>
        ) : (
          <div style={adBox}>
            {ads[adIndex]?.image_url ? (
              <img
                src={ads[adIndex].image_url!}
                alt={ads[adIndex].title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={adText}>{ads[adIndex]?.title}</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== styles ===== */

const page: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  background: "#000",
  color: "white",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const left: React.CSSProperties = {
  padding: 32
};

const right: React.CSSProperties = {
  background: "#0b0b0b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const title: React.CSSProperties = {
  fontSize: "3rem",
  marginBottom: 24
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.10)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginBottom: 16,
  maxWidth: 700
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  padding: "16px 0",
  borderBottom: "1px solid rgba(255,255,255,0.1)"
};

const pos: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  width: 50
};

const name: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700
};

const service: React.CSSProperties = {
  opacity: 0.7
};

const status: React.CSSProperties = {
  marginLeft: "auto",
  fontWeight: 800,
  opacity: 0.8
};

const empty: React.CSSProperties = {
  opacity: 0.6,
  fontSize: 22
};

const adPlaceholder: React.CSSProperties = {
  textAlign: "center",
  fontSize: 36,
  fontWeight: 900,
  opacity: 0.4
};

const adBox: React.CSSProperties = {
  width: "100%",
  height: "100%"
};

const adText: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 900,
  textAlign: "center",
  padding: 24
};
