"use client";

import { useEffect, useMemo, useState } from "react";

type QueueEntry = {
  id: string;
  status: string;
  created_at: string;
  eta_minutes: number;
  customer: { first_name: string; last_name: string };
  service: { name: string; duration_minutes?: number };
};

type Ad = {
  id: string;
  title: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
};

export default function TVPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const [split, setSplit] = useState(70);
  const [rotateSec, setRotateSec] = useState(10);

  const activeAds = useMemo(
    () => (ads || []).filter((a) => a.is_active),
    [ads]
  );

  async function load() {
    const res = await fetch(`/api/tv?shopId=${shopId}`, { cache: "no-store" });
    const json = await res.json();
    setBookings(json.bookings || []);
    setQueue(json.queue || []);
    setAds(json.ads || []);
    setSplit(json.tv_left_percent || 70);
    setRotateSec(json.tv_ad_rotation_seconds || 10);
  }

  // Auto refresh queue + config
  useEffect(() => {
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [shopId]);

  // Rotate ads
  useEffect(() => {
    if (!activeAds.length) return;
    const i = setInterval(
      () => setAdIndex((x) => (x + 1) % activeAds.length),
      Math.max(3, rotateSec) * 1000
    );
    return () => clearInterval(i);
  }, [activeAds.length, rotateSec]);

  // Keep index safe if ads change
  useEffect(() => {
    if (!activeAds.length) setAdIndex(0);
    else if (adIndex >= activeAds.length) setAdIndex(0);
  }, [activeAds.length]);

  const currentAd = activeAds[adIndex];

  return (
    <main style={page}>
      <div style={{ ...left, width: `${split}%` }}>
        <h1 style={title}>Now Serving</h1>

        {queue.length === 0 && <div style={empty}>No customers in queue</div>}

        {queue.map((q, i) => (
          <div key={q.id} style={row}>
            <div style={pos}>{i + 1}</div>

            <div style={{ minWidth: 0 }}>
              <div style={name}>
                {q.customer.first_name} {q.customer.last_name?.[0] || ""}
              </div>
              <div style={service}>
                {q.service.name} • ETA {q.eta_minutes}m
              </div>
            </div>

            <div style={statusPill(q.status)}>
              {q.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...right, width: `${100 - split}%` }}>
        {!currentAd ? (
          <div style={adPlaceholder}>
            <div>YOUR AD HERE</div>
            <div style={{ fontSize: 18, opacity: 0.6 }}>Sponsored space</div>
          </div>
        ) : currentAd.video_url ? (
          <div style={adBox}>
            <video
              key={currentAd.id} // forces restart on rotate
              src={currentAd.video_url}
              style={adMedia}
              autoPlay
              muted
              loop
              playsInline
            />
            <div style={adBadge}>AD</div>
          </div>
        ) : currentAd.image_url ? (
          <div style={adBox}>
            <img
              src={currentAd.image_url}
              alt={currentAd.title || "ad"}
              style={adMedia}
            />
            <div style={adBadge}>AD</div>
          </div>
        ) : (
          <div style={adTextWrap}>
            <div style={adText}>{currentAd.title || "Sponsored"}</div>
            <div style={{ opacity: 0.6, marginTop: 8, fontSize: 18 }}>
              Sponsored space
            </div>
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
  justifyContent: "center",
  position: "relative"
};

const title: React.CSSProperties = {
  fontSize: "3rem",
  marginBottom: 24,
  fontWeight: 950,
  letterSpacing: "-0.02em"
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
  width: 50,
  opacity: 0.95
};

const name: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 850,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 760
};

const service: React.CSSProperties = {
  opacity: 0.7,
  marginTop: 4
};

const statusPill = (status: string): React.CSSProperties => {
  const s = (status || "").toLowerCase();
  const base: React.CSSProperties = {
    marginLeft: "auto",
    fontWeight: 950,
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 14,
    letterSpacing: "0.06em"
  };

  if (s === "checked_in" || s === "arrived")
    return {
      ...base,
      background: "rgba(0,255,120,0.10)",
      border: "1px solid rgba(0,255,120,0.25)",
      color: "#bfffe1"
    };

  if (s === "queued")
    return {
      ...base,
      background: "rgba(77,163,255,0.14)",
      border: "1px solid rgba(77,163,255,0.35)",
      color: "#cfe9ff"
    };

  return {
    ...base,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "white"
  };
};

const empty: React.CSSProperties = {
  opacity: 0.6,
  fontSize: 22
};

const adPlaceholder: React.CSSProperties = {
  textAlign: "center",
  fontSize: 36,
  fontWeight: 950,
  opacity: 0.35
};

const adBox: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative"
};

const adMedia: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
};

const adBadge: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  letterSpacing: "0.12em",
  fontSize: 12,
  opacity: 0.9
};

const adTextWrap: React.CSSProperties = {
  textAlign: "center",
  padding: 24
};

const adText: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 950,
  lineHeight: 1.05
};
