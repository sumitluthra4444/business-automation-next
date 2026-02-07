"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Slot = { start: string; end: string };

export default function BookPage({ params }: { params: { id: string } }) {
  const shopId = params.id;
  const sp = useSearchParams();
  const serviceId = sp.get("serviceId") || "";

  const todayISO = useMemo(() => {
    const d = new Date();
    // YYYY-MM-DD (local-ish)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [date, setDate] = useState(todayISO);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<Slot | null>(null);

  // customer details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [bookingOk, setBookingOk] = useState<string | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);

  async function loadSlots() {
    try {
      setLoading(true);
      setErr(null);
      setSelected(null);

      if (!serviceId) {
        setErr("Missing serviceId (go back and choose a service).");
        setSlots([]);
        return;
      }

      const res = await fetch(
        `/api/availability?shopId=${shopId}&serviceId=${serviceId}&date=${date}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load availability");

      setSlots(json.slots || []);
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, shopId, serviceId]);

  async function confirmBooking() {
    try {
      setBookingBusy(true);
      setBookingOk(null);
      setErr(null);

      if (!selected) throw new Error("Please select a time slot.");
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        throw new Error("Please enter First name, Last name and Phone.");
      }

      const res = await fetch(`/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          serviceId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          startAt: selected.start
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Booking failed");

      setBookingOk(`✅ Booking confirmed for ${new Date(selected.start).toLocaleString()}`);
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBookingBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <a href={`/shop/${shopId}`} style={back}>
          ← Back to shop
        </a>

        <h1 style={h1}>Book Appointment</h1>

        {!serviceId && (
          <div style={errorBox}>
            Missing <b>serviceId</b>. Go back and select a service first.
          </div>
        )}

        {err && (
          <div style={errorBox}>
            <b>Error:</b> {err}
          </div>
        )}

        {bookingOk && <div style={okBox}>{bookingOk}</div>}

        <div style={card}>
          <div style={label}>Select date</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={input}
          />

          <div style={{ marginTop: 16, ...label }}>Available times</div>

          {loading ? (
            <div style={{ opacity: 0.7, marginTop: 10 }}>Loading slots…</div>
          ) : slots.length === 0 ? (
            <div style={{ opacity: 0.7, marginTop: 10 }}>
              No slots available for this date.
            </div>
          ) : (
            <div style={slotsGrid}>
              {slots.map((s) => {
                const isSel = selected?.start === s.start;
                return (
                  <button
                    key={s.start}
                    onClick={() => setSelected(s)}
                    style={{
                      ...slotBtn,
                      ...(isSel ? slotBtnOn : {})
                    }}
                    type="button"
                  >
                    {new Date(s.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>
            Your details
          </div>

          <div style={formGrid}>
            <input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={input}
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={input}
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={input}
              inputMode="tel"
            />
          </div>

          <button
            onClick={confirmBooking}
            disabled={bookingBusy || !selected}
            style={{
              ...btn,
              opacity: bookingBusy || !selected ? 0.55 : 1
            }}
          >
            {bookingBusy ? "Booking..." : "Confirm Booking"}
          </button>

          {selected && (
            <div style={{ opacity: 0.7, marginTop: 10 }}>
              Selected:{" "}
              <b>{new Date(selected.start).toLocaleString()}</b>
            </div>
          )}
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

const back: React.CSSProperties = {
  color: "#8cc7ff",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: 14
};

const h1: React.CSSProperties = {
  margin: 0,
  fontSize: "2.2rem",
  fontWeight: 950
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 18,
  marginTop: 16
};

const label: React.CSSProperties = { fontWeight: 900, opacity: 0.9 };

const input: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none"
};

const slotsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
  marginTop: 12
};

const slotBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  padding: "12px 10px",
  borderRadius: 14,
  fontWeight: 900,
  cursor: "pointer"
};

const slotBtnOn: React.CSSProperties = {
  background: "rgba(77,163,255,0.22)",
  border: "1px solid rgba(77,163,255,0.45)"
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginTop: 10
};

const btn: React.CSSProperties = {
  marginTop: 14,
  width: "100%",
  background: "rgba(77,163,255,0.22)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "12px 14px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer"
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};

const okBox: React.CSSProperties = {
  background: "rgba(0,255,120,0.10)",
  border: "1px solid rgba(0,255,120,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};
