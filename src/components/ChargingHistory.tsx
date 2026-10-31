"use client";

import { useState } from "react";
import { History, Zap, DollarSign, MapPin, ChevronDown, ChevronUp, Leaf } from "lucide-react";

interface Session {
  id: string;
  station: string;
  location: string;
  date: string;
  duration: string;
  energy: number;
  cost: number;
  fromPct: number;
  toPct: number;
  co2Saved: number;
}

const MOCK_HISTORY: Session[] = [
  { id: "h1", station: "Bangkok Central Hub",     location: "Siam Square",       date: "Oct 30, 2026", duration: "42 min", energy: 48.2, cost: 409.7,  fromPct: 22, toPct: 86, co2Saved: 19.3 },
  { id: "h2", station: "Don Mueang Expressway",   location: "Don Mueang",        date: "Oct 28, 2026", duration: "1h 12m", energy: 62.5, cost: 575.0,  fromPct: 8,  toPct: 92, co2Saved: 25.0 },
  { id: "h3", station: "Sukhumvit Tech Park",      location: "Sukhumvit Soi 21",  date: "Oct 25, 2026", duration: "28 min", energy: 30.1, cost: 237.8,  fromPct: 45, toPct: 86, co2Saved: 12.0 },
  { id: "h4", station: "Pattaya Coastal Station",  location: "Pattaya Beach Rd",  date: "Oct 20, 2026", duration: "55 min", energy: 56.0, cost: 492.8,  fromPct: 18, toPct: 93, co2Saved: 22.4 },
  { id: "h5", station: "Phuket Airport Lounge",    location: "Phuket Airport",    date: "Oct 15, 2026", duration: "38 min", energy: 43.5, cost: 413.3,  fromPct: 30, toPct: 88, co2Saved: 17.4 },
];

export default function ChargingHistory() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? MOCK_HISTORY : MOCK_HISTORY.slice(0, 3);

  const totalEnergy = MOCK_HISTORY.reduce((s, h) => s + h.energy, 0);
  const totalCost = MOCK_HISTORY.reduce((s, h) => s + h.cost, 0);
  const totalCO2 = MOCK_HISTORY.reduce((s, h) => s + h.co2Saved, 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}
        >
          <History size={15} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm">Charging History</h3>
          <p className="text-xs text-white/35">{MOCK_HISTORY.length} sessions this month</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
        {[
          { label: "kWh", value: totalEnergy.toFixed(0), color: "#10b981", icon: Zap },
          { label: "Spent", value: `฿${Math.round(totalCost).toLocaleString()}`, color: "#a78bfa", icon: DollarSign },
          { label: "CO₂ Saved", value: `${totalCO2.toFixed(0)}kg`, color: "#a3e635", icon: Leaf },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="py-3 text-center">
            <Icon size={12} style={{ color }} className="mx-auto mb-1" />
            <div className="font-mono font-bold text-sm" style={{ color }}>{value}</div>
            <div className="text-xs text-white/25">{label}</div>
          </div>
        ))}
      </div>

      {/* Sessions */}
      <div className="divide-y divide-white/[0.04]">
        {visible.map((s) => (
          <div key={s.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">{s.station}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/35">
                  <MapPin size={9} />
                  <span>{s.location}</span>
                  <span className="text-white/20">·</span>
                  <span>{s.date}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  {/* Battery bar: fromPct → toPct */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/30 font-mono w-6 text-right">{s.fromPct}%</span>
                    <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden relative">
                      <div
                        className="absolute h-full rounded-full"
                        style={{
                          left: `${s.fromPct}%`,
                          width: `${s.toPct - s.fromPct}%`,
                          background: "linear-gradient(90deg, #06b6d4aa, #10b981)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-white/30 font-mono">{s.toPct}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono font-bold text-emerald-400">+{s.energy} kWh</div>
                <div className="text-xs text-white/40 font-mono">฿{s.cost.toFixed(0)}</div>
                <div className="text-xs text-white/25">{s.duration}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {MOCK_HISTORY.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/60 border-t border-white/5 hover:bg-white/[0.02] transition-all duration-200"
        >
          {expanded ? (
            <><ChevronUp size={12} /> Show less</>
          ) : (
            <><ChevronDown size={12} /> Show {MOCK_HISTORY.length - 3} more sessions</>
          )}
        </button>
      )}
    </div>
  );
}
