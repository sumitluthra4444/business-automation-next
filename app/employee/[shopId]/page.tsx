"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = { id: string; name: string; role: string };
type QueueItem = {
  id: string;
  status: string;
  eta_minutes: number;
  customer: { first_name: string; last_name: string };
  service: { name: string; duration_minutes?: number };
};
type BookingItem = {
  id: string;
  start_at: string;
  customer: { first_name: string; last_name: string };
  service: { name: string };
};

export default function EmployeeScreen({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;

  const [pin, setPin] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [clockedIn, setClockedIn] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  async function loadWork() {
    try {
      setErr(null);
      const res = await fetch(`/api/employee/work?shopId=${shopId}&date=${todayISO}`, {
        cache: "no-store"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load work");

      setQueue(json.queue || []);
      setBookings(json.bookings || []);
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    }
  }

  // auto refresh if logged in
  useEffect(() => {
    if (!employee) return;
    loadWork();
    const i = setInterval(loadWork, 5000);
    return () => clearInterval(i);
  }, [employee, shopId, todayISO]);

  async function login() {
    try {
      setBusy(true);
      setErr(null);

      const res = await fetch(`/api/employee/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, pin: pin.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Login failed");

      setEmployee(json.employee);
      setClockedIn(Boolean(json.clockedIn));

      setToast("✅ Logged in");
      setTimeout(() => setToast(null), 1500);
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleClock() {
    if (!employee) return;
    try {
      setBusy(true);
      setErr(null);

      const res = await fetch(`/api/employee/clock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, employeeId: employee.id, action: clockedIn ? "out" : "in" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Clock failed");

      setClockedIn(Boolean(json.clockedIn));
      setToast(clockedIn ? "✅ Clocked out" : "✅ Clocked in");
      setTimeout(() => setToast(null), 1500);
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function startFromQueue(queueEntryId: string) {
    if (!employee) return;
    try {
      setBusy(true);
      setErr(null);

      const res = await fetch(`/api/employee/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, employeeId: employee.id, queueEntryId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Start failed");

      setToast("🔥 Service started");
      setTimeout(() => setToast(null), 1500);
      loadWork();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function startFromBooking(bookingId: string) {
    if (!employee) return;
    try {
      setBusy(true);
      setErr(null);

      const res = await fetch(`/api/employee/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, employeeId: employee.id, bookingId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Start failed");

      setToast("🔥 Booking started");
      setTimeout(() => setToast(null), 1500);
      loadWork();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <div style={hero}>
          <div>
            <div style={h1}>Employee Screen</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>Shop: {shopId}</div>
          </div>
          {employee ? (
            <div style={pillRow}>
              <div style={pill}>👤 {employee.name}</div>
              <button style={pillBtn} onClick={toggleClock} disabled={busy}>
                {clockedIn ? "Clock Out" : "Clock In"}
              </button>
            </div>
          ) : null}
        </div>

        {toast && <div style={toastBox}>{toast}</div>}

        {err && (
          <div style={errorBox}>
            <b>Error:</b> {err}
          </div>
        )}

        {!employee ? (
          <div style={card}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Login (PIN)</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Prototype login only — we’ll do real auth later.
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN (e.g. 1234)"
                style={input}
                inputMode="numeric"
              />
              <button style={cta} onClick={login} disabled={busy || !pin.trim()}>
                {busy ? "Please wait…" : "Login"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={grid2}>
              <div style={panel}>
                <div style={panelTitle}>Next in Queue</div>
                {queue.length === 0 ? (
                  <div style={{ opacity: 0.7, marginTop: 10 }}>No one waiting.</div>
                ) : (
                  queue.slice(0, 5).map((q, idx) => (
                    <div key={q.id} style={row}>
                      <div style={idxBox}>{idx + 1}</div>
                      <div>
                        <div style={rowMain}>
                          {q.customer.first_name} {q.customer.last_name?.[0] || ""}
                        </div>
                        <div style={rowSub}>
                          {q.service.name} • ETA {q.eta_minutes}m
                        </div>
                      </div>
                      <button
                        style={miniBtn}
                        disabled={busy || !clockedIn}
                        onClick={() => startFromQueue(q.id)}
                      >
                        Start
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={panel}>
                <div style={panelTitle}>Today’s Bookings</div>
                {bookings.length === 0 ? (
                  <div style={{ opacity: 0.7, marginTop: 10 }}>No bookings today.</div>
                ) : (
                  bookings.slice(0, 6).map((b) => (
                    <div key={b.id} style={row}>
                      <div style={timeBox}>
                        {new Date(b.start_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      <div>
                        <div style={rowMain}>
                          {b.customer.first_name} {b.customer.last_name?.[0] || ""}
                        </div>
                        <div style={rowSub}>{b.service.name}</div>
                      </div>
                      <button
                        style={miniBtn}
                        disabled={busy || !clockedIn}
                        onClick={() => startFromBooking(b.id)}
                      >
                        Start
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {!clockedIn && (
              <div style={{ marginTop: 12, opacity: 0.75 }}>
                ⚠️ Clock in to start services.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ===== styles ===== */
const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#0b0b0b",
  color: "white",
  display: "flex",
  justifyContent: "center",
  padding: "28px 16px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const hero: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(77,163,255,0.10), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 20,
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center"
};

const h1: React.CSSProperties = { fontSize: "1.7rem", fontWeight: 950 };

const pillRow: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" };

const pill: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: "10px 12px",
  borderRadius: 999,
  fontWeight: 900
};

const pillBtn: React.CSSProperties = {
  ...pill,
  cursor: "pointer",
  background: "rgba(77,163,255,0.20)",
  border: "1px solid rgba(77,163,255,0.40)"
};

const card: React.CSSProperties = {
  marginTop: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 18
};

const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none",
  fontWeight: 800
};

const cta: React.CSSProperties = {
  background: "rgba(77,163,255,0.24)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "12px 14px",
  borderRadius: 16,
  fontWeight: 950,
  cursor: "pointer"
};

const grid2: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12
};

const panel: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 14
};

const panelTitle: React.CSSProperties = { fontWeight: 950, fontSize: 18, marginBottom: 10 };

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 0",
  borderTop: "1px solid rgba(255,255,255,0.08)"
};

const idxBox: React.CSSProperties = { width: 34, fontSize: 18, fontWeight: 950, opacity: 0.9 };
const timeBox: React.CSSProperties = { width: 60, fontWeight: 950, opacity: 0.9 };

const rowMain: React.CSSProperties = { fontWeight: 950 };
const rowSub: React.CSSProperties = { opacity: 0.7, marginTop: 3, fontSize: 13 };

const miniBtn: React.CSSProperties = {
  marginLeft: "auto",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950
};

const toastBox: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 18,
  transform: "translateX(-50%)",
  background: "rgba(0,0,0,0.65)",
  border: "1px solid rgba(255,255,255,0.16)",
  padding: "10px 14px",
  borderRadius: 999,
  fontWeight: 950,
  zIndex: 50
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16
};
