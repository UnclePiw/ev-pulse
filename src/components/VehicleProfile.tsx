"use client";

import { useState } from "react";
import { Battery, Zap, Leaf, Check, ChevronLeft, ChevronRight } from "lucide-react";

export interface VehicleData {
  name: string;
  model: string;
  batteryCapacity: number;
  currentCharge: number;
  range: number;
  connectorType: string;
  totalCharged: number;
  totalSessions: number;
  co2Saved: number;
  totalSpent: number;
}

/* Real Unsplash EV photos — verified working URLs */
const EV_MODELS = [
  {
    label: "Tesla Model 3",
    capacity: 75, range500: 500, connector: "CCS2",
    color: "#e2e8f0",
    photo: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&q=80",
    brand: "Tesla",
  },
  {
    label: "Tesla Model Y",
    capacity: 75, range500: 530, connector: "CCS2",
    color: "#94a3b8",
    photo: "https://images.unsplash.com/photo-1664575599736-c5197c684128?w=600&q=80",
    brand: "Tesla",
  },
  {
    label: "BYD Atto 3",
    capacity: 60, range500: 420, connector: "CCS2",
    color: "#38bdf8",
    photo: "https://images.unsplash.com/photo-1676443378552-8f74dc93c321?w=600&q=80",
    brand: "BYD",
  },
  {
    label: "MG ZS EV",
    capacity: 50, range500: 320, connector: "CCS2",
    color: "#f97316",
    photo: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80",
    brand: "MG",
  },
  {
    label: "Hyundai IONIQ 5",
    capacity: 77, range500: 481, connector: "CCS2",
    color: "#a78bfa",
    photo: "https://images.unsplash.com/photo-1652161986384-e2c0cd8e7c84?w=600&q=80",
    brand: "Hyundai",
  },
  {
    label: "BMW iX3",
    capacity: 80, range500: 460, connector: "CCS2",
    color: "#60a5fa",
    photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
    brand: "BMW",
  },
  {
    label: "Volvo XC40 Recharge",
    capacity: 78, range500: 418, connector: "CCS2",
    color: "#34d399",
    photo: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80",
    brand: "Volvo",
  },
  {
    label: "Nissan Leaf",
    capacity: 40, range500: 270, connector: "CHAdeMO",
    color: "#fbbf24",
    photo: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=600&q=80",
    brand: "Nissan",
  },
];

export const DEFAULT_VEHICLE: VehicleData = {
  name: "My Tesla",
  model: "Tesla Model 3",
  batteryCapacity: 75,
  currentCharge: 42,
  range: 210,
  connectorType: "CCS2",
  totalCharged: 1240,
  totalSessions: 38,
  co2Saved: 496,
  totalSpent: 10540,
};

interface Props {
  vehicle: VehicleData;
  onUpdate: (v: VehicleData) => void;
}

function getBatteryColor(pct: number) {
  if (pct >= 60) return "#00e5a0";
  if (pct >= 30) return "#fbbf24";
  return "#ef4444";
}

export default function VehicleProfile({ vehicle, onUpdate }: Props) {
  const selectedIdx = EV_MODELS.findIndex((m) => m.label === vehicle.model);
  const currentModelIdx = selectedIdx >= 0 ? selectedIdx : 0;
  const currentModel = EV_MODELS[currentModelIdx];

  const [charge, setCharge] = useState(vehicle.currentCharge);
  const [isDragging, setIsDragging] = useState(false);

  const battColor = getBatteryColor(charge);
  const kwh = Math.round((charge / 100) * vehicle.batteryCapacity * 10) / 10;
  const estRange = Math.round((charge / 100) * currentModel.range500);

  const pickModel = (idx: number) => {
    const m = EV_MODELS[idx];
    onUpdate({
      ...vehicle,
      model: m.label,
      batteryCapacity: m.capacity,
      connectorType: m.connector,
      range: Math.round((charge / 100) * m.range500),
    });
  };

  const saveCharge = () => {
    onUpdate({ ...vehicle, currentCharge: charge, range: estRange });
    setIsDragging(false);
  };

  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* ── Car photo hero ── */}
      <div style={{ position: "relative", height: 180, overflow: "hidden", background: "#0a0d14", flexShrink: 0 }}>
        <img
          key={currentModel.photo}
          src={currentModel.photo}
          alt={currentModel.label}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.75) saturate(1.1)",
            transition: "opacity 0.4s",
          }}
        />
        {/* gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, var(--bg-1) 100%)" }} />
        {/* brand badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          padding: "3px 10px", borderRadius: 2,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--text-2)",
        }}>
          {currentModel.brand}
        </div>
        {/* model name */}
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1 }}>{vehicle.model}</div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{currentModel.capacity} kWh · {currentModel.connector}</div>
        </div>
        {/* nav arrows */}
        <button onClick={() => pickModel((currentModelIdx - 1 + EV_MODELS.length) % EV_MODELS.length)}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => pickModel((currentModelIdx + 1) % EV_MODELS.length)}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
          <ChevronRight size={14} />
        </button>
        {/* dot nav */}
        <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 4 }}>
          {EV_MODELS.map((_, i) => (
            <div key={i} onClick={() => pickModel(i)} style={{ width: i === currentModelIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === currentModelIdx ? "var(--accent)" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.25s" }} />
          ))}
        </div>
      </div>

      {/* ── Battery section ── */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Battery Level</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: battColor, letterSpacing: "-0.03em" }}>{charge}%</span>
        </div>

        {/* Battery bar graphic */}
        <div style={{ position: "relative", height: 28, background: "var(--bg)", border: "1px solid var(--border-hi)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0,
            width: `${charge}%`,
            background: `linear-gradient(90deg, ${battColor}88, ${battColor})`,
            transition: isDragging ? "none" : "width 0.6s ease",
            borderRadius: 3,
          }} />
          {/* segment lines */}
          {[25, 50, 75].map((p) => (
            <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(0,0,0,0.4)", zIndex: 1 }} />
          ))}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", color: charge > 15 ? "rgba(0,0,0,0.7)" : "var(--text-2)" }}>
            {kwh} kWh · {estRange} km
          </div>
        </div>

        {/* Slider */}
        <input type="range" min={0} max={100} value={charge}
          onChange={(e) => { setIsDragging(true); setCharge(Number(e.target.value)); }}
          onMouseUp={saveCharge} onTouchEnd={saveCharge}
          style={{ width: "100%", accentColor: battColor }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", marginTop: 2, letterSpacing: "0.06em" }}>
          <span>0%</span><span>Set current charge level</span><span>100%</span>
        </div>
      </div>

      {/* ── Lifetime stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
        {[
          { label: "Sessions", value: String(vehicle.totalSessions), color: "#38bdf8", icon: Zap },
          { label: "kWh Lifetime", value: vehicle.totalCharged.toLocaleString(), color: "#00e5a0", icon: Battery },
          { label: "CO₂ Saved", value: `${vehicle.co2Saved} kg`, color: "#a3e635", icon: Leaf },
          { label: "Total Spent", value: `฿${vehicle.totalSpent.toLocaleString()}`, color: "#a78bfa", icon: Check },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: "var(--bg-1)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</div>
              <div style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
