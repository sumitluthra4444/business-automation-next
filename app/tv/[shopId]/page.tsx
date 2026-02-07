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
  const [split, setSplit] = useState(70);
  const [rotateSec, setRotateSec] = useState(10);

  // Fetch queue + TV config
  async function load() {
    const res = await fetch(`/api/tv?shopId=${shopId}`, {
      cache: "no-store"
    });
    const json = await res.json();

    setQueue(json.queue || []);
    setAds(json.ads || []);
    setSplit(json.tv_left_percent || 70);
    setRotateSec(json.tv_ad_rotation_seconds || 10);
  }

  // Auto refresh queue
  useEffect(() => {
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [shopId]);

  // Rotate ads
  useEffect(() => {
    if (!ads.length) return;
    const i = setInterval(
      () => setAdIndex((i) => (i + 1) % ads.length),
      rotateSec * 1000
    );
    return () => clearInterval(i);
  }, [ads, rotateSec]);

  return (
    <main style={page}>
      <div style={{ ...left, width: `${split}%` }}>
        <h1 style={title}>Now Serving</h1>

        {queue.length === 0 && (
          <div style={empty}>No customers in queue</div>
        )}

        {queue.map((q, i) => (
          <div key={q.id} style={row}>
            <div style={pos}>{i + 1}</div>
            <div>
              <div style={name}>
                {q.customer.first_name} {q.customer.last_name[0]}
              </div>
              <div style={service}>
  {q.service.name} • ETA {q.eta_minutes}m
</div>
            </div>
            <div style={status}>{q.status.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ ...right, width: `${100 - split}%` }}>
        {ads.length === 0 ? (
          <div style={adPlaceholder}>
            <div>YOUR AD HERE</div>
            <div style={{ fontSize: 18, opacity: 0.6 }}>
              Sponsored space
            </div>
          </div>
        ) : (
          <div style={adBox}>
            {ads[adIndex].image_url ? (
              <img
                src={ads[adIndex].image_url}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={adText}>{ads[adIndex].title}</div>
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
  textAlign: "center"
};
