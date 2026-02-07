"use client";

import { useState } from "react";

export default function JoinQueuePage({
  params
}: {
  params: { id: string };
}) {
  const shopId = params.id;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div style={{ width: "100%", maxWidth: 500 }}>
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
        <p style={{ opacity: 0.75, marginBottom: 20 }}>
          Enter your details to join the live queue.
        </p>

        <div style={{ display: "grid", gap: 14 }}>
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
          />

          <button
            disabled={loading}
            style={{
              background: "rgba(77,163,255,0.25)",
              border: "1px solid rgba(77,163,255,0.45)",
              color: "#e6f2ff",
              padding: "12px 14px",
              borderRadius: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 6
            }}
            onClick={() => {
              alert("Next step: insert into queue");
            }}
          >
            {loading ? "Joining..." : "Join Queue"}
          </button>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none"
};
