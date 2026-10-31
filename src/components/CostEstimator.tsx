"use client";

import { useState, useMemo } from "react";
import { Zap, DollarSign, Clock, ChevronDown, Info } from "lucide-react";
import type { Station } from "@/lib/stationData";

interface Props {
  stations: Station[];
  vehicleBattery: number;
  vehicleCapacity: number;
}

function fmt(min: number) {
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.round(min)} min`;
  return `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`;
}

export default function CostEstimator({ stations, vehicleBattery, vehicleCapacity }: Props) {
  const [fromPct, setFromPct]   = useState(vehicleBattery);
  const [toPct,   setToPct]     = useState(Math.min(80, 100));
  const [stationId, setStation] = useState(stations[0]?.id ?? "");
  const [showFormula, setShowFormula] = useState(false);

  const station = stations.find((s) => s.id === stationId) ?? stations[0];

  const calc = useMemo(() => {
    if (!station || toPct <= fromPct) return null;
    const energyKwh  = ((toPct - fromPct) / 100) * vehicleCapacity;
    const cost       = energyKwh * station.pricingRate;
    const timeHrs    = energyKwh / station.powerOutput;
    const timeMin    = timeHrs * 60;
    const rangeAdded = Math.round(energyKwh * 6.0); // ~6 km/kWh avg
    return { energyKwh, cost, timeMin, rangeAdded };
  }, [fromPct, toPct, vehicleCapacity, station]);

  const pctDiff = toPct - fromPct;

  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 3 }}>
            Trip Planner
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            Charge Cost Estimator
          </div>
        </div>
        <button onClick={() => setShowFormula(!showFormula)}
          style={{ width: 28, height: 28, borderRadius: 4, background: showFormula ? "rgba(0,229,160,0.12)" : "var(--bg-2)", border: `1px solid ${showFormula ? "#00e5a0" : "var(--border)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: showFormula ? "#00e5a0" : "var(--text-3)" }}>
          <Info size={13} />
        </button>
      </div>

      {/* Formula explainer (collapsible) */}
      {showFormula && (
        <div style={{ padding: "12px 20px", background: "rgba(0,229,160,0.04)", borderBottom: "1px solid rgba(0,229,160,0.12)" }}>
          <div style={{ fontSize: 10, color: "var(--text-2)", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: "#00e5a0", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9 }}>How it's calculated</div>
            <div>📦 <b>Energy</b> = battery size × (target% − current%) ÷ 100</div>
            <div>💰 <b>Cost</b> = Energy (kWh) × station rate (฿/kWh)</div>
            <div>⏱️ <b>Time</b> = Energy ÷ charger power output (kW)</div>
            <div>🗺️ <b>Range added</b> ≈ Energy × 6 km/kWh (avg EV efficiency)</div>
            <div style={{ marginTop: 6, color: "var(--text-3)", fontSize: 9 }}>
              Example: Charge 40→80% on a 75kWh battery at {station?.pricingRate ?? 8.5}฿/kWh —<br/>
              30kWh × ฿{station?.pricingRate ?? 8.5} = <b style={{ color: "#00e5a0" }}>฿{Math.round(30 * (station?.pricingRate ?? 8.5))}</b>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {/* Station picker */}
        <div>
          <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 6 }}>
            Charging Station
          </label>
          <div style={{ position: "relative" }}>
            <select className="ev-input" value={stationId} onChange={(e) => setStation(e.target.value)}
              style={{ paddingRight: 28, appearance: "none" }}>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.powerOutput}kW · ฿{s.pricingRate}/kWh
                </option>
              ))}
            </select>
            <ChevronDown size={11} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          </div>
          {station && (
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 5, display: "flex", gap: 12 }}>
              <span>{station.status}</span>
              <span>{station.connectorType.split("/")[0].trim()}</span>
              <span>{station.activePorts}/{station.totalPorts} ports active</span>
            </div>
          )}
        </div>

        {/* Visual battery charge range */}
        <div>
          <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 8 }}>
            Charge Range
          </label>

          {/* Battery visual */}
          <div style={{ position: "relative", height: 32, background: "var(--bg)", border: "1px solid var(--border-hi)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
            {/* Current charge (grey) */}
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${fromPct}%`, background: "var(--bg-2)", borderRight: `2px solid #fbbf24`, transition: "width 0.2s" }} />
            {/* Added charge (accent) */}
            {calc && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${fromPct}%`, width: `${pctDiff}%`, background: "rgba(0,229,160,0.25)", borderRight: `2px solid #00e5a0`, transition: "all 0.2s" }} />
            )}
            {/* Labels */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", fontSize: 10, fontFamily: "var(--mono)", fontWeight: 700 }}>
              <span style={{ color: "#fbbf24" }}>{fromPct}%</span>
              <span style={{ color: "var(--text-3)", fontSize: 9 }}>→</span>
              <span style={{ color: "#00e5a0" }}>{toPct}%</span>
            </div>
          </div>

          {/* Dual sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>From</span>
                <span style={{ fontFamily: "var(--mono)", color: "#fbbf24" }}>{fromPct}%</span>
              </div>
              <input type="range" min={0} max={99} value={fromPct}
                onChange={(e) => { const v = +e.target.value; setFromPct(v); if (toPct <= v) setToPct(Math.min(100, v + 5)); }}
                style={{ width: "100%", accentColor: "#fbbf24" }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>To</span>
                <span style={{ fontFamily: "var(--mono)", color: "#00e5a0" }}>{toPct}%</span>
              </div>
              <input type="range" min={1} max={100} value={toPct}
                onChange={(e) => { const v = +e.target.value; setToPct(v); if (fromPct >= v) setFromPct(Math.max(0, v - 5)); }}
                style={{ width: "100%", accentColor: "#00e5a0" }} />
            </div>
          </div>
        </div>

        {/* Results */}
        {calc ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", marginTop: "auto" }}>
            {[
              { label: "Energy needed",  value: `${calc.energyKwh.toFixed(1)} kWh`, color: "#38bdf8",  desc: `${vehicleCapacity}kWh × ${pctDiff}%` },
              { label: "Estimated cost", value: `฿${Math.round(calc.cost)}`,          color: "#00e5a0",  desc: `${calc.energyKwh.toFixed(1)}kWh × ฿${station?.pricingRate}` },
              { label: "Charge time",    value: fmt(calc.timeMin),                    color: "#fbbf24",  desc: `at ${station?.powerOutput}kW` },
              { label: "Range added",    value: `~${calc.rangeAdded} km`,             color: "#a78bfa",  desc: "avg 6 km/kWh" },
            ].map(({ label, value, color, desc }) => (
              <div key={label} style={{ background: "var(--bg-1)", padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 9, color: "var(--text-3)", opacity: 0.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "var(--text-3)" }}>
            Set target charge higher than current
          </div>
        )}
      </div>
    </div>
  );
}
