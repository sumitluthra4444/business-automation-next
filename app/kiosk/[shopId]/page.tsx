"use client";

import { useState } from "react";

export default function KioskPage({
  params
}: {
  params: { shopId: string };
}) {
  const shopId = params.shopId;

  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ queueEntryId: string } | null>(null);

  async function checkIn() {
    try {
      setLoading(true);
      setErr(null);
      setSuccess(null);

      const res = await fetch("/api/kiosk-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          lastName,
          phone
        })
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Check-in failed");

      setSuccess({ queueEntryId: json.queueEntryId });
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2.2rem" }}>Kiosk Check-in</h1>
            <p style={{ opacity: 0.75, marginTop: 8 }}>
              Enter your details to confirm you’ve arrived.
            </p>
          </div>
          <div style={{ opacity: 0.6, fontSize: 13 }}>
            Shop: <b>{shopId}</b>
          </div>
        </div>

        <div style={{ height: 14 }} />

        {err && (
          <div style={errorBox}>
            <b>Error:</b> {err}
          </div>
        )}

        {success && (
          <div style={successBox}>
            <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
              Checked in!
            </div>
            <div style={{ opacity: 0.85, marginTop: 8 }}>
              Queue Ref:{" "}
              <span style={{ fontWeight: 800, wordBreak: "break-all" }}>
                {success.queueEntryId}
              </span>
            </div>
          </div>
        )}

        <div style={cardStyle}>
          <div style={{ display: "grid", gap: 14 }}>
            <input
              placeholder="Last name (e.g. Singh)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Phone number (e.g. 04xx xxx xxx)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              inputMode="tel"
            />

            <button
              onClick={checkIn}
              disabled={loading || lastName.trim() === "" || phone.trim() === ""}
              style={{
                ...primaryBtn,
                opacity:
                  loading || lastName.trim() === "" || phone.trim() === ""
                    ? 0.5
                    : 1
              }}
            >
              {loading ? "Checking in..." : "Check in"}
            </button>

            <button
              onClick={() => {
                setLastName("");
                setPhone("");
                setErr(null);
                setSuccess(null);
              }}
              style={secondaryBtn}
            >
              Clear
            </button>
          </div>
        </div>

        <div style={{ opacity: 0.6, marginTop: 18, fontSize: 13 }}>
          Tip: Staff can help walk-ins by entering the customer here.
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
  padding: "36px 18px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 20
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: "14px 16px",
  color: "white",
  outline: "none",
  fontSize: 16
};

const primaryBtn: React.CSSProperties = {
  background: "rgba(77,163,255,0.25)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "14px 16px",
  borderRadius: 18,
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 16
};

const secondaryBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  padding: "14px 16px",
  borderRadius: 18,
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 16
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginBottom: 14
};

const successBox: React.CSSProperties = {
  background: "rgba(0,255,140,0.10)",
  border: "1px solid rgba(0,255,140,0.20)",
  padding: 16,
  borderRadius: 18,
  marginBottom: 14
};
