"use client";

import { useEffect, useMemo, useState } from "react";

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

type Slot = { start: string; end: string };

export default function ShopPage({ params }: { params: { id: string } }) {
  const shopId = params.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // live wait time
  const [waitMins, setWaitMins] = useState<number>(0);

  // modal control
  const [open, setOpen] = useState<null | "queue" | "book">(null);

  // form
  const [serviceId, setServiceId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // booking fields
  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [date, setDate] = useState(todayISO);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotStart, setSlotStart] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function resetForm() {
    setServiceId(services?.[0]?.id || "");
    setFirstName("");
    setLastName("");
    setPhone("");
    setDate(todayISO);
    setSlots([]);
    setSlotStart("");
    setErr(null);
  }

  // Load shop/services
  useEffect(() => {
    let cancelled = false;

    async function loadShop() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/shop?id=${shopId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load shop");

        if (!cancelled) {
          setShop(json.shop);
          setServices(json.services || []);
          setServiceId((json.services?.[0]?.id as string) || "");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadShop();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  // Live wait time from TV API (sums durations via ETA already)
  useEffect(() => {
    let cancelled = false;

    async function loadWait() {
      try {
        const res = await fetch(`/api/tv?shopId=${shopId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) return;

        const q = Array.isArray(json.queue) ? json.queue : [];
        if (q.length === 0) {
          if (!cancelled) setWaitMins(0);
          return;
        }

        // queue items already have eta_minutes; compute last person end ETA
        const last = q[q.length - 1];
        const lastEta = Number(last?.eta_minutes ?? 0) || 0;
        const lastDur = Number(last?.service?.duration_minutes ?? 0) || 0;
        const total = Math.max(0, lastEta + lastDur);

        if (!cancelled) setWaitMins(total);
      } catch {
        // ignore
      }
    }

    loadWait();
    const i = setInterval(loadWait, 5000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [shopId]);

  // Load availability slots when booking modal open + service/date changes
  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      if (open !== "book") return;
      if (!serviceId) return;

      try {
        setErr(null);
        setSlots([]);
        setSlotStart("");

        const res = await fetch(
          `/api/availability?shopId=${shopId}&serviceId=${serviceId}&date=${date}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load availability");

        const s = Array.isArray(json.slots) ? json.slots : [];
        if (!cancelled) {
          setSlots(s);
          setSlotStart(s?.[0]?.start || "");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Unknown error");
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [open, serviceId, date, shopId]);

  function openQueue() {
    resetForm();
    setOpen("queue");
  }

  function openBook() {
    resetForm();
    setOpen("book");
  }

  function closeModal() {
    setOpen(null);
    setErr(null);
  }

  async function submitQueue() {
    try {
      setBusy(true);
      setErr(null);

      if (!serviceId) throw new Error("Please select a service.");
      if (!firstName.trim() || !lastName.trim() || !phone.trim())
        throw new Error("Please enter First name, Last name and Phone.");

      const res = await fetch(`/api/join-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          serviceId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim()
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to join queue");

      setToast("✅ Added to queue!");
      closeModal();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 1800);
    }
  }

  async function submitBooking() {
    try {
      setBusy(true);
      setErr(null);

      if (!serviceId) throw new Error("Please select a service.");
      if (!firstName.trim() || !lastName.trim() || !phone.trim())
        throw new Error("Please enter First name, Last name and Phone.");
      if (!slotStart) throw new Error("Please select a time.");

      const res = await fetch(`/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          serviceId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          startAt: slotStart
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Booking failed");

      setToast("✅ Booking confirmed!");
      closeModal();
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 1800);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <a href="/" style={back}>
          ← Back
        </a>

        {loading ? (
          <div style={card}>Loading…</div>
        ) : err && !open ? (
          <div style={errorBox}>
            <b>Error:</b> {err}
          </div>
        ) : shop ? (
          <>
            <div style={hero}>
              <div>
                <div style={heroTitle}>{shop.name}</div>
                <div style={heroSub}>
                  {shop.suburb} • Sydney Metro
                </div>
              </div>

              <div style={pillRow}>
                <div style={pill}>
                  Live Wait: <b style={{ marginLeft: 6 }}>{waitMins}m</b>
                </div>
                <a href={`/tv/${shopId}`} target="_blank" rel="noreferrer" style={{ ...pill, textDecoration: "none" }}>
                  TV View →
                </a>
              </div>
            </div>

            <div style={tiles}>
              <button onClick={openQueue} style={tilePrimary} type="button">
                <div style={tileTop}>
                  <div style={tileTitle}>Join Queue</div>
                  <div style={tileBadge}>WAIT {waitMins}m</div>
                </div>
                <div style={tileDesc}>
                  Walk-in style. Get a spot instantly and check-in when you arrive.
                </div>
              </button>

              <button onClick={openBook} style={tileGhost} type="button">
                <div style={tileTop}>
                  <div style={tileTitle}>Book Appointment</div>
                  <div style={tileBadgeGhost}>Choose time</div>
                </div>
                <div style={tileDesc}>
                  Pick service + date/time. We’ll hold the slot for you.
                </div>
              </button>
            </div>
          </>
        ) : (
          <div style={card}>Shop not found.</div>
        )}

        {toast && <div style={toastBox}>{toast}</div>}

        {open && (
          <div style={overlay} onMouseDown={closeModal}>
            <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
              <div style={modalHead}>
                <div>
                  <div style={modalTitle}>
                    {open === "queue" ? "Join Queue" : "Book Appointment"}
                  </div>
                  <div style={{ opacity: 0.7, marginTop: 6 }}>
                    {shop?.name} • {shop?.suburb}
                  </div>
                </div>
                <button onClick={closeModal} style={xBtn} type="button">
                  ✕
                </button>
              </div>

              {err && (
                <div style={errorBoxSmall}>
                  <b>Error:</b> {err}
                </div>
              )}

              <div style={formGrid}>
                <div style={field}>
                  <div style={label}>Service</div>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    style={select}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} • {s.duration_minutes}m • ${s.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={row2}>
                  <div style={field}>
                    <div style={label}>First name</div>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={input} placeholder="Adam" />
                  </div>
                  <div style={field}>
                    <div style={label}>Last name</div>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={input} placeholder="Smith" />
                  </div>
                </div>

                <div style={field}>
                  <div style={label}>Phone</div>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} placeholder="04xx xxx xxx" inputMode="tel" />
                </div>

                {open === "book" && (
                  <div style={row2}>
                    <div style={field}>
                      <div style={label}>Date</div>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />
                    </div>

                    <div style={field}>
                      <div style={label}>Time</div>
                      <select
                        value={slotStart}
                        onChange={(e) => setSlotStart(e.target.value)}
                        style={select}
                      >
                        {slots.length === 0 ? (
                          <option value="">No times available</option>
                        ) : (
                          slots.map((s) => (
                            <option key={s.start} value={s.start}>
                              {new Date(s.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}

                <div style={summary}>
                  <div style={{ opacity: 0.7 }}>Selected</div>
                  <div style={{ fontWeight: 950, marginTop: 6 }}>
                    {selectedService?.name || "Service"}{" "}
                    {open === "queue"
                      ? `• Wait ~${waitMins}m`
                      : slotStart
                      ? `• ${new Date(slotStart).toLocaleString()}`
                      : ""}
                  </div>
                </div>

                <button
                  onClick={open === "queue" ? submitQueue : submitBooking}
                  disabled={busy || (open === "book" && !slotStart)}
                  style={{ ...cta, opacity: busy || (open === "book" && !slotStart) ? 0.6 : 1 }}
                  type="button"
                >
                  {busy
                    ? "Please wait…"
                    : open === "queue"
                    ? "Confirm & Join Queue"
                    : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== styles (clean iOS-ish, black + electric blue) ===== */

const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#0b0b0b",
  color: "white",
  display: "flex",
  justifyContent: "center",
  padding: "28px 16px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const back: React.CSSProperties = {
  color: "#8cc7ff",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: 14,
  fontWeight: 800
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

const heroTitle: React.CSSProperties = { fontSize: "1.8rem", fontWeight: 950, letterSpacing: "-0.02em" };
const heroSub: React.CSSProperties = { opacity: 0.75, marginTop: 6 };

const pillRow: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" };

const pill: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: "10px 12px",
  borderRadius: 999,
  fontWeight: 900,
  color: "white"
};

const tiles: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12
};

const tileBase: React.CSSProperties = {
  borderRadius: 22,
  padding: 18,
  textAlign: "left",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.10)",
  transition: "transform 0.1s ease"
};

const tilePrimary: React.CSSProperties = {
  ...tileBase,
  background: "rgba(77,163,255,0.16)",
  border: "1px solid rgba(77,163,255,0.30)"
};

const tileGhost: React.CSSProperties = {
  ...tileBase,
  background: "rgba(255,255,255,0.05)"
};

const tileTop: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
const tileTitle: React.CSSProperties = { fontSize: 20, fontWeight: 950 };
const tileDesc: React.CSSProperties = { marginTop: 10, opacity: 0.75, lineHeight: 1.4 };

const tileBadge: React.CSSProperties = {
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(77,163,255,0.35)",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 950,
  color: "#cfe9ff",
  whiteSpace: "nowrap"
};

const tileBadgeGhost: React.CSSProperties = {
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.16)",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 950,
  whiteSpace: "nowrap"
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 18
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

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.62)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
  zIndex: 60
};

const modal: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "rgba(15,15,15,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 22,
  padding: 16,
  backdropFilter: "blur(14px)"
};

const modalHead: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" };
const modalTitle: React.CSSProperties = { fontSize: 22, fontWeight: 950, letterSpacing: "-0.02em" };

const xBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  borderRadius: 14,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950
};

const formGrid: React.CSSProperties = { marginTop: 14, display: "grid", gap: 12 };

const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const field: React.CSSProperties = { display: "grid", gap: 8 };

const label: React.CSSProperties = { fontWeight: 900, opacity: 0.9, fontSize: 13, letterSpacing: "0.02em" };

const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none",
  fontWeight: 800
};

const select: React.CSSProperties = {
  ...input,
  appearance: "none"
};

const summary: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 12,
  borderRadius: 16
};

const cta: React.CSSProperties = {
  marginTop: 2,
  background: "rgba(77,163,255,0.24)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "12px 14px",
  borderRadius: 16,
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

const errorBoxSmall: React.CSSProperties = {
  background: "rgba(255,0,0,0.10)",
  border: "1px solid rgba(255,0,0,0.22)",
  padding: 12,
  borderRadius: 16,
  marginTop: 12
};
