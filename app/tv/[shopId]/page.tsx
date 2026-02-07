"use client";

import React, { useEffect, useMemo, useState } from "react";

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

type BookingEntry = {
  id: string;
  status: "booked";
  created_at: string; // we store start_at here from API for simplicity
  start_at?: string;
  eta_minutes: number; // minutes until appointment
  customer: {
    first_name: string;
    last_name: string;
  };
  service: {
    name: string;
    duration_minutes?: number;
  };
};

type Ad = {
  id: string;
  title: string;
  image_url: string | null;
  video_url?: string | null;
};

export default function TVPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const [split, setSplit] = useState(70);
  const [rotateSec, setRotateSec] = useState(10);

  // Fetch queue + bookings + TV config + ads
  async function load() {
    const res = await fetch(`/api/tv?shopId=${shopId}`, { cache: "no-store" });
    const json = await res.json();

    setQueue(json.queue || []);
    setBookings(json.bookings || []);
    setAds(json.ads || []);
    setSplit(json.tv_left_percent || 70);
    setRotateSec(json.tv_ad_rotation_seconds || 10);
  }

  // Auto refresh
  useEffect(() => {
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [shopId]);

  // Rotate ads
  useEffect(() => {
    if (!ads.length) return;
    const i = setInterval(
      () => setAdIndex((x) => (x + 1) % ads.length),
      Math.max(3, rotateSec) * 1000
    );
    return () => clearInterval(i);
  }, [ads, rotateSec]);

  const leftWidth = `${split}%`;
  const rightWidth = `${100 - split}%`;

  const nowServing = useMemo(() => {
    // show arrived/checked_in first, then queued
    const score = (s: string) => {
      const v = (s || "").toLowerCase();
      if (v === "arrived" || v === "checked_in") return 0;
      if (v === "queued") return 1;
      return 2;
    };
    return [...queue].sort((a, b) => score(a.status) - score(b.status));
  }, [queue]);

  return (
    <main style={page}>
      <div style={{ ...left, width: leftWidth }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <h1 style={title}>Now Serving</h1>
          <div style={subtle}>
            Auto-refresh • {new Date().toLocaleTimeString()}
          </div>
        </div>

        {nowServing.length === 0 ? (
          <div style={empty}>No customers in queue</div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {nowServing.slice(0, 10).map((q, i) => (
              <div key={q.id} style={row}>
                <div style={pos}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={name}>
                    {q.customer.first_name}{" "}
                    {q.customer.last_name ? q.customer.last_name[0] : ""}
                  </div>
                  <div style={service}>
                    {q.service.name} • ETA {q.eta_minutes}m
                  </div>
                </div>
                <div style={pill(q.status)}>
                  {q.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 26 }} />

        <h2 style={sectionTitle}>Today’s Bookings</h2>

        {bookings.length === 0 ? (
          <div style={emptySmall}>No upcoming bookings today</div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {bookings.slice(0, 8).map((b) => (
              <div key={b.id} style={rowSmall}>
                <div style={clock}>
                  {formatTime(b.start_at || b.created_at)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={nameSmall}>
                    {b.customer.first_name}{" "}
                    {b.customer.last_name ? b.customer.last_name[0] : ""}
                  </div>
                  <div style={serviceSmall}>{b.service.name}</div>
                </div>
                <div style={pill("booked")}>
                  IN {Math.max(0, b.eta_minutes)}m
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...right, width: rightWidth }}>
        {ads.length === 0 ? (
          <div style={adPlaceholder}>
            <div>YOUR AD HERE</div>
            <div style={{ fontSize: 18, opacity: 0.6 }}>Sponsored space</div>
          </div>
        ) : (
          <div style={adBox}>
            {ads[adIndex]?.video_url ? (
              <video
                key={ads[adIndex].video_url}
                src={ads[adIndex].video_url}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : ads[adIndex]?.image_url ? (
              <img
                src={ads[adIndex].image_url}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={adText}>{ads[adIndex]?.title || "Ad"}</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== helpers ===== */

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function pill(status: string): React.CSSProperties {
  const s = (status || "").toLowerCase();
  const base: React.CSSProperties = {
    marginLeft: "auto",
    fontWeight: 900,
    letterSpacing: 0.6,
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    opacity: 0.9,
    whiteSpace: "nowrap"
  };

  if (s === "arrived" || s === "checked_in") {
    return {
      ...base,
      background: "rgba(77,163,255,0.18)",
      border: "1px solid rgba(77,163,255,0.35)",
      color: "#bfe4ff"
    };
  }

  if (s === "queued") {
    return {
      ...base,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.85)"
    };
  }

  if (s === "booked") {
    return {
      ...base,
      background: "rgba(160,255,120,0.10)",
      border: "1px solid rgba(160,255,120,0.25)",
      color: "rgba(210,255,195,0.9)"
    };
  }

  return base;
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
  padding: 32,
  overflow: "hidden"
};

const right: React.CSSProperties = {
  background: "#0b0b0b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const title: React.CSSProperties = {
  fontSize: "3rem",
  margin: 0
};

const subtle: React.CSSProperties = {
  opacity: 0.55,
  fontSize: 14
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  opacity: 0.85,
  letterSpacing: 0.2
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
  fontWeight: 800,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 520
};

const service: React.CSSProperties = {
  opacity: 0.7
};

const empty: React.CSSProperties = {
  opacity: 0.6,
  fontSize: 22,
  marginTop: 18
};

const emptySmall: React.CSSProperties = {
  opacity: 0.55,
  fontSize: 16,
  marginTop: 10
};

const rowSmall: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)"
};

const clock: React.CSSProperties = {
  width: 86,
  fontWeight: 900,
  opacity: 0.85,
  fontSize: 16
};

const nameSmall: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 520
};

const serviceSmall: React.CSSProperties = {
  opacity: 0.65,
  fontSize: 14
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
  textAlign: "center"
};
