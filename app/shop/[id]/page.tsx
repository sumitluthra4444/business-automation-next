"use client";

import { useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
};

export default function JoinQueuePage({ params }: { params: { id: string } }) {
  const shopId = params.id;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [success, setSuccess] = useState<{
    queueEntryId: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        setLoadingServices(true);
        setErr(null);

        const res = await fetch(`/api/shop?id=${shopId}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Failed to load services");

        if (!cancelled) {
          const svcs = (json.services || []) as Service[];
          setServices(svcs);

          // default to first service
          if (svcs.length > 0) setServiceId(svcs[0].id);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      phone.trim().length >= 8 &&
      serviceId.length > 0 &&
      !loading &&
      !loadingServices
    );
  }, [firstName, lastName, phone, serviceId, loading, loadingServices]);

  async function submit() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch("/api/join-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          serviceId,
          firstName,
          lastName,
          phone
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Join queue failed");
      }

      setSuccess({ queueEntryId: json.queueEntryId || null });
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main style={pageStyle}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <h2 style={{ fontSize: "1.9rem", marginBottom: 6 }}>
            You’re in the queue.
          </h2>
          <p style={{ opacity: 0.8, marginBottom: 18 }}>
            Show this screen at the kiosk to check-in.
          </p>

          <div
            style={{
              background: "rgba(77,163,255,0.14)",
              border: "1px solid rgba(77,163,255,0.28)",
              padding: 16,
              borderRadius: 18
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Queue Ref</div>
            <div style={{ opacity: 0.9, wordBreak: "break-all" }}>
              {success.queueEntryId || "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <a href={`/shop/${shopId}`} style={{ textDecoration: "none" }}>
              <button style={secondaryBtn}>Back to shop</button>
            </a>
            <a href="/" style={{ textDecoration: "none" }}>
              <button style={primaryBtn}>Back to home</button>
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <a
          href={`/shop/${shopId}`}
          style={{
            color: "#8cc7ff",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 18
          }}
        >
          ← Back
        </a>

        <h2 style={{ fontSize: "1.8rem", marginBottom: 6 }}>Join Queue</h2>
        <p style={{ opacity: 0.75, marginBottom: 16 }}>
          Enter your details to join the live queue.
        </p>

        {err && (
          <div
            style={{
              background: "rgba(255,0,0,0.12)",
              border: "1px solid rgba(255,0,0,0.25)",
              padding: 14,
              borderRadius: 16,
              marginBottom: 14
            }}
          >
            <b>Error:</b> {err}
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle}>
            Service
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              style={inputStyle}
              disabled={loadingServices}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} • {s.duration_minutes}m • ${s.price}
                </option>
              ))}
            </select>
          </label>

          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            inputMode="tel"
          />

          <button
            disabled={!canSubmit}
            style={{
              ...primaryBtn,
              opacity: canSubmit ? 1 : 0.5
            }}
            onClick={() => {
  const firstService = services?.[0]?.id;
  if (!firstService) return alert("No services found for this shop");
  window.location.href = `/shop/${shopId}/book?serviceId=${firstService}`;
}}

          >
            {loading ? "Joining..." : "Join Queue"}
          </button>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#0b0b0b",
  color: "white",
  display: "flex",
  justifyContent: "center",
  padding: "32px 16px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontSize: 13,
  opacity: 0.85
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none"
};

const primaryBtn: React.CSSProperties = {
  background: "rgba(77,163,255,0.25)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "12px 14px",
  borderRadius: 16,
  fontWeight: 800,
  cursor: "pointer"
};

const secondaryBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  padding: "12px 14px",
  borderRadius: 16,
  fontWeight: 800,
  cursor: "pointer"
};
