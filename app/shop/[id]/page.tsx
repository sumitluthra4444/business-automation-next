"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
};

type Shop = {
  id: string;
  name: string;
  suburb: string;
};

export default function ShopPage({ params }: { params: { id: string } }) {
  const shopId = params.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/shop?id=${shopId}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Failed to load shop");

        if (!cancelled) {
          setShop(json.shop);
          setServices(json.services || []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

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
        <a
          href="/"
          style={{
            color: "#8cc7ff",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 18
          }}
        >
          ← Back
        </a>

        {loading && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              padding: 16,
              borderRadius: 18
            }}
          >
            Loading shop...
          </div>
        )}

        {err && (
          <div
            style={{
              background: "rgba(255,0,0,0.12)",
              border: "1px solid rgba(255,0,0,0.25)",
              padding: 14,
              borderRadius: 16,
              marginBottom: 16
            }}
          >
            <b>Error:</b> {err}
          </div>
        )}

        {!loading && shop && (
          <>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                padding: 18,
                borderRadius: 18,
                marginBottom: 16
              }}
            >
              <div style={{ fontSize: "1.6rem", fontWeight: 750 }}>
                {shop.name}
              </div>
              <div style={{ opacity: 0.75, marginTop: 6 }}>
                {shop.suburb} • Sydney Metro
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button
                  style={{
                    background: "rgba(77,163,255,0.20)",
                    border: "1px solid rgba(77,163,255,0.40)",
                    color: "#cfe9ff",
                    padding: "10px 14px",
                    borderRadius: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  onClick={() => alert("Next step: Join Queue flow")}
                >
                  Join Queue
                </button>

                <button
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "white",
                    padding: "10px 14px",
                    borderRadius: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  onClick={() => alert("Next step: Booking flow")}
                >
                  Book Appointment
                </button>
              </div>
            </div>

            <div style={{ marginTop: 10, marginBottom: 10, opacity: 0.8 }}>
              Services
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {services.map((svc) => (
                <div
                  key={svc.id}
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
                    <div style={{ fontWeight: 700 }}>{svc.name}</div>
                    <div style={{ opacity: 0.75, marginTop: 4 }}>
                      {svc.duration_minutes} mins
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>${svc.price}</div>
                    <div style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>
                      Wait: TBC
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
