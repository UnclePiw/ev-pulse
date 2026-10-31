"use client";

import { useState } from "react";
import { Calendar, Clock, Bell, Trash2, Plus, CheckCircle2 } from "lucide-react";
import type { Station } from "@/lib/stationData";

interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  date: string;
  time: string;
  targetPct: number;
  reminder: boolean;
  status: "upcoming" | "completed";
}

interface Props {
  stations: Station[];
}

export default function ChargeScheduler({ stations }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([
    { id: "b1", stationId: "st-001", stationName: "Bangkok Central Hub", date: "2026-11-01", time: "08:00", targetPct: 80, reminder: true, status: "upcoming" },
    { id: "b2", stationId: "st-005", stationName: "Pattaya Coastal Station", date: "2026-11-03", time: "14:30", targetPct: 90, reminder: false, status: "upcoming" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ stationId: stations[0]?.id ?? "", date: "", time: "09:00", targetPct: 80, reminder: true });

  const set = (k: string, v: string | number | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const addBooking = () => {
    if (!form.date || !form.stationId) return;
    const station = stations.find((s) => s.id === form.stationId);
    setBookings([...bookings, {
      id: `b-${Date.now()}`,
      stationId: form.stationId,
      stationName: station?.name ?? "—",
      date: form.date,
      time: form.time,
      targetPct: form.targetPct,
      reminder: form.reminder,
      status: "upcoming",
    }]);
    setShowForm(false);
    setForm({ stationId: stations[0]?.id ?? "", date: "", time: "09:00", targetPct: 80, reminder: true });
  };

  const remove = (id: string) => setBookings((p) => p.filter((b) => b.id !== id));

  const upcoming = bookings.filter((b) => b.status === "upcoming");

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={16} style={{ color: "#38bdf8" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Charge Scheduler</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>Book a slot · get reminded</div>
          </div>
        </div>
        <button className="btn-accent" style={{ fontSize: 10, padding: "6px 12px" }} onClick={() => setShowForm(!showForm)}>
          <Plus size={12} /> Book Slot
        </button>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Booking form */}
        {showForm && (
          <div style={{ padding: 14, borderRadius: "var(--r-md)", background: "var(--bg-2)", border: "1px solid var(--border-hi)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Station</label>
                <select className="ev-input" value={form.stationId} onChange={(e) => set("stationId", e.target.value)}>
                  {stations.filter((s) => s.status !== "Maintenance").map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Target Battery</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="range" min={50} max={100} step={5} value={form.targetPct}
                    onChange={(e) => set("targetPct", Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", minWidth: 32 }}>{form.targetPct}%</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Date</label>
                <input type="date" className="ev-input" value={form.date} onChange={(e) => set("date", e.target.value)}
                  style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Time</label>
                <input type="time" className="ev-input" value={form.time} onChange={(e) => set("time", e.target.value)}
                  style={{ colorScheme: "dark" }} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.reminder} onChange={(e) => set("reminder", e.target.checked)}
                style={{ accentColor: "var(--accent)" }} />
              <span style={{ fontSize: 11, color: "var(--text-2)" }}>Remind me 30 min before</span>
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-accent" style={{ fontSize: 10 }} onClick={addBooking} disabled={!form.date}>
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* Bookings list */}
        {upcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: "var(--text-3)" }}>
            No upcoming bookings. Schedule your next charge!
          </div>
        ) : (
          upcoming.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r-md)", background: "var(--bg-2)", border: "1px solid var(--border-hi)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 40 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color: "#38bdf8", lineHeight: 1 }}>
                  {new Date(b.date).getDate()}
                </span>
                <span style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.06em" }}>
                  {new Date(b.date).toLocaleString("en", { month: "short" }).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>{b.stationName}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--text-3)", alignItems: "center" }}>
                  <Clock size={10} />
                  <span>{b.time}</span>
                  <span>·</span>
                  <span>Target {b.targetPct}%</span>
                  {b.reminder && <Bell size={10} style={{ color: "#fbbf24" }} />}
                </div>
              </div>
              <button onClick={() => remove(b.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 4, transition: "color 0.15s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)")}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
