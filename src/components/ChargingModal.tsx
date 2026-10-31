"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Zap,
  Battery,
  DollarSign,
  Clock,
  MapPin,
  Wifi,
  CheckCircle2,
  Activity,
  StopCircle,
  ChevronRight,
} from "lucide-react";
import type { Station } from "@/lib/stationData";

/* ── Client-side simulation fallback (used on static exports / GitHub Pages) ── */
const STATION_RATES: Record<string, number> = {
  "st-001": 8.5, "st-002": 7.9, "st-003": 9.2,
  "st-004": 7.5, "st-005": 8.8, "st-006": 9.5,
};
const STATION_POWER: Record<string, number> = {
  "st-001": 150, "st-002": 120, "st-003": 250,
  "st-004": 75,  "st-005": 180, "st-006": 100,
};

function clientSimulate(body: {
  action: string;
  stationId: string;
  sessionId?: string | null;
  vehicleBattery?: number;
}) {
  const { action, stationId, vehicleBattery = 22 } = body;
  const maxPower = STATION_POWER[stationId] ?? 120;
  const rate = STATION_RATES[stationId] ?? 8.5;
  const batteryCapacity = 75;

  if (action === "start") {
    return {
      success: true,
      sessionId: `ses-${Date.now()}`,
      stationId,
      action: "start",
      batteryPercent: vehicleBattery,
      energyTransferred: 0,
      cost: 0,
      powerDraw: maxPower * 0.95,
      chargingSpeed: maxPower >= 150 ? "DC Fast Charge" : "AC Level 2",
      estimatedTimeRemaining: Math.round(((100 - vehicleBattery) / 100) * 3600),
      status: "active",
      message: `Session started at ${maxPower}kW.`,
      timestamp: new Date().toISOString(),
    };
  }

  if (action === "tick") {
    const powerFactor = vehicleBattery < 80 ? 1.0 : 1.0 - (vehicleBattery - 80) / 100;
    const effectivePower = maxPower * powerFactor * (0.9 + Math.random() * 0.1);
    const tickRate = 3 / 3600;
    const energyThisTick = effectivePower * tickRate;
    const batteryGain = (energyThisTick / batteryCapacity) * 100;
    const newBattery = Math.min(100, vehicleBattery + batteryGain);
    const totalEnergy = ((newBattery - 20) / 100) * batteryCapacity;
    const totalCost = Math.max(0, totalEnergy) * rate;
    const isComplete = newBattery >= 100;

    return {
      success: true,
      sessionId: body.sessionId ?? "local",
      stationId,
      action: "tick",
      batteryPercent: Math.round(newBattery * 10) / 10,
      energyTransferred: Math.round(Math.max(0, totalEnergy) * 100) / 100,
      cost: Math.round(Math.max(0, totalCost) * 100) / 100,
      powerDraw: Math.round(effectivePower * 10) / 10,
      chargingSpeed: maxPower >= 150 ? "DC Fast Charge" : "AC Level 2",
      estimatedTimeRemaining: isComplete ? 0 : Math.round(((100 - newBattery) / 100) * batteryCapacity / effectivePower * 3600),
      status: isComplete ? "complete" : "active",
      message: isComplete ? "⚡ Vehicle charged to 100%! Ready to drive." : `Charging at ${Math.round(effectivePower)}kW…`,
      timestamp: new Date().toISOString(),
    };
  }

  // stop
  const energy = Math.max(0, ((vehicleBattery - 20) / 100) * batteryCapacity);
  return {
    success: true,
    sessionId: body.sessionId ?? "local",
    stationId,
    action: "stop",
    batteryPercent: vehicleBattery,
    energyTransferred: Math.round(energy * 100) / 100,
    cost: Math.round(energy * rate * 100) / 100,
    powerDraw: 0,
    chargingSpeed: "Stopped",
    estimatedTimeRemaining: 0,
    status: "stopped",
    message: `Session ended. ${Math.round(energy * 10) / 10} kWh delivered.`,
    timestamp: new Date().toISOString(),
  };
}

interface ChargingModalProps {
  station: Station;
  onClose: () => void;
}

interface SimState {
  sessionId: string | null;
  isRunning: boolean;
  batteryPercent: number;
  energyTransferred: number;
  cost: number;
  powerDraw: number;
  chargingSpeed: string;
  estimatedTimeRemaining: number;
  status: "idle" | "active" | "complete" | "stopped";
  message: string;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getBatteryColor(pct: number): string {
  if (pct >= 80) return "#10b981";
  if (pct >= 40) return "#06b6d4";
  return "#f59e0b";
}

export default function ChargingModal({ station, onClose }: ChargingModalProps) {
  const [sim, setSim] = useState<SimState>({
    sessionId: null,
    isRunning: false,
    batteryPercent: 22,
    energyTransferred: 0,
    cost: 0,
    powerDraw: 0,
    chargingSpeed: station.connectorType,
    estimatedTimeRemaining: 0,
    status: "idle",
    message: "",
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const callSimulate = useCallback(
    async (action: "start" | "tick" | "stop", extra: object = {}) => {
      const body = {
        action,
        stationId: station.id,
        sessionId: sim.sessionId,
        vehicleBattery: sim.batteryPercent,
        ...extra,
      };

      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("API unavailable");
        return res.json();
      } catch {
        // Client-side simulation fallback for static hosting (GitHub Pages)
        return clientSimulate(body);
      }
    },
    [station.id, sim.sessionId, sim.batteryPercent]
  );

  const startCharging = async () => {
    const data = await callSimulate("start", { vehicleBattery: sim.batteryPercent });
    if (!mountedRef.current) return;
    if (data.success) {
      setSim((prev) => ({
        ...prev,
        sessionId: data.sessionId,
        isRunning: true,
        status: "active",
        powerDraw: data.powerDraw,
        chargingSpeed: data.chargingSpeed,
        estimatedTimeRemaining: data.estimatedTimeRemaining,
        message: data.message,
      }));
    }
  };

  const stopCharging = async () => {
    if (tickRef.current) clearInterval(tickRef.current);
    const data = await callSimulate("stop", { vehicleBattery: sim.batteryPercent });
    if (!mountedRef.current) return;
    setSim((prev) => ({
      ...prev,
      isRunning: false,
      status: "stopped",
      powerDraw: 0,
      energyTransferred: data.energyTransferred,
      cost: data.cost,
      message: data.message,
    }));
  };

  // Auto-tick loop
  useEffect(() => {
    if (!sim.isRunning || sim.status !== "active") return;

    tickRef.current = setInterval(async () => {
      if (!mountedRef.current) return;

      const tickBody = {
        action: "tick" as const,
        stationId: station.id,
        sessionId: sim.sessionId,
        vehicleBattery: sim.batteryPercent,
      };

      let data;
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tickBody),
        });
        if (!res.ok) throw new Error("API unavailable");
        data = await res.json();
      } catch {
        data = clientSimulate(tickBody);
      }

      if (!mountedRef.current) return;

      setSim((prev) => ({
        ...prev,
        batteryPercent: data.batteryPercent,
        energyTransferred: data.energyTransferred,
        cost: data.cost,
        powerDraw: data.powerDraw,
        estimatedTimeRemaining: data.estimatedTimeRemaining,
        status: data.status,
        message: data.message,
        isRunning: data.status === "active",
      }));

      if (data.status === "complete") {
        if (tickRef.current) clearInterval(tickRef.current);
      }
    }, 400);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.isRunning, sim.status, station.id]);

  const batteryColor = getBatteryColor(sim.batteryPercent);
  const isComplete = sim.status === "complete";
  const isStopped = sim.status === "stopped";

  const statusColor = {
    Available: "text-emerald-400",
    Charging: "text-cyan-400",
    Maintenance: "text-amber-400",
  }[station.status];

  const statusDot = {
    Available: "bg-emerald-400",
    Charging: "bg-cyan-400",
    Maintenance: "bg-amber-400",
  }[station.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="animate-scale-in relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-hi)",
          boxShadow: "0 0 60px rgba(0,229,160,0.08), 0 30px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Hero: photo LEFT + mini map RIGHT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 200, position: "relative" }}>
          {/* Photo */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src={station.photo}
              alt={station.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65) saturate(1.1)" }}
              onError={(e) => {
                // Fallback to OSM tile of real location
                const el = e.currentTarget as HTMLImageElement;
                const z = 16, lat = station.coordinates.lat, lng = station.coordinates.lng;
                const n = Math.pow(2, z);
                const xt = Math.floor((lng + 180) / 360 * n);
                const yt = Math.floor((1 - Math.log(Math.tan(lat * Math.PI/180) + 1/Math.cos(lat * Math.PI/180)) / Math.PI) / 2 * n);
                el.src = `https://tile.openstreetmap.org/${z}/${xt}/${yt}.png`;
                el.style.filter = "invert(100%) hue-rotate(180deg) brightness(0.85)";
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, var(--bg-1))" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, var(--bg-1) 100%)" }} />
            {/* Photo label */}
            <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
              📷 Station Photo
            </div>
          </div>

          {/* Mini OSM map iframe — real location, no key needed */}
          <div style={{ position: "relative", overflow: "hidden", background: "#0a0d12" }}>
            <iframe
              title={`Map of ${station.name}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${station.coordinates.lng - 0.008}%2C${station.coordinates.lat - 0.006}%2C${station.coordinates.lng + 0.008}%2C${station.coordinates.lat + 0.006}&layer=mapnik&marker=${station.coordinates.lat}%2C${station.coordinates.lng}`}
              style={{
                width: "100%", height: "100%", border: "none",
                filter: "invert(100%) hue-rotate(180deg) brightness(0.85) saturate(0.6)",
              }}
              loading="lazy"
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 60%, var(--bg-1))" }} />
            {/* Map label */}
            <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
              🗺️ Live Map
            </div>
          </div>

          {/* Overlaid station info — center bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "12px 20px",
            background: "linear-gradient(to top, var(--bg-1) 60%, transparent)",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div>
              {/* Status badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 8px", borderRadius: 3, marginBottom: 6,
                background: `${station.status === "Available" ? "rgba(0,229,160,0.15)" : station.status === "Charging" ? "rgba(56,189,248,0.15)" : "rgba(251,146,60,0.15)"}`,
                border: `1px solid ${station.status === "Available" ? "rgba(0,229,160,0.4)" : station.status === "Charging" ? "rgba(56,189,248,0.4)" : "rgba(251,146,60,0.4)"}`,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: station.status === "Available" ? "#00e5a0" : station.status === "Charging" ? "#38bdf8" : "#fb923c",
                }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: station.status === "Available" ? "#00e5a0" : station.status === "Charging" ? "#38bdf8" : "#fb923c" }}>
                  {station.status}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1 }}>{station.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <MapPin size={10} style={{ color: "var(--text-3)" }} />
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{station.location}</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 4,
                background: "rgba(0,0,0,0.6)", border: "1px solid var(--border-hi)",
                color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Station quick-stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Max Power", value: `${station.powerOutput}kW`, icon: Zap, color: "text-emerald-400" },
              { label: "Rate", value: `฿${station.pricingRate}/kWh`, icon: DollarSign, color: "text-cyan-400" },
              { label: "Ports", value: `${station.totalPorts} total`, icon: Wifi, color: "text-violet-400" },
              { label: "Uptime", value: `${station.uptime}%`, icon: Activity, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="glass rounded-xl p-3 text-center"
              >
                <Icon size={14} className={`${color} mx-auto mb-1`} />
                <div className="text-sm font-bold text-white">{value}</div>
                <div className="text-xs text-white/40">{label}</div>
              </div>
            ))}
          </div>

          {/* ---- SIMULATION AREA ---- */}
          {isComplete ? (
            /* SUCCESS STATE */
            <div className="rounded-2xl p-6 text-center space-y-4"
              style={{
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.08)",
              }}
            >
              <div className="flex justify-center animate-float">
                <div className="p-4 rounded-full"
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold neon-text-emerald">
                  Vehicle Charged Successfully! ⚡
                </h3>
                <p className="text-sm text-white/50 mt-1">
                  Your EV is ready to hit the road.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Energy", value: `${sim.energyTransferred} kWh` },
                  { label: "Total Cost", value: `฿${sim.cost.toFixed(2)}` },
                  { label: "Battery", value: "100%" },
                ].map(({ label, value }) => (
                  <div key={label} className="glass rounded-xl p-3 text-center">
                    <div className="font-bold neon-text-emerald">{value}</div>
                    <div className="text-xs text-white/40">{label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                }}
              >
                Close Dashboard
              </button>
            </div>
          ) : isStopped ? (
            /* STOPPED STATE */
            <div className="rounded-2xl p-6 text-center space-y-4 glass">
              <StopCircle size={36} className="text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-amber-400">Session Ended</h3>
              <p className="text-sm text-white/50">{sim.message}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3 text-center">
                  <div className="font-bold text-white">{sim.energyTransferred} kWh</div>
                  <div className="text-xs text-white/40">Energy Delivered</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="font-bold text-cyan-400">฿{sim.cost.toFixed(2)}</div>
                  <div className="text-xs text-white/40">Total Cost</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white/80 glass border border-white/10 hover:bg-white/5 transition-all duration-200"
              >
                Close
              </button>
            </div>
          ) : sim.status === "active" ? (
            /* CHARGING ACTIVE STATE */
            <div className="space-y-4">
              {/* Battery progress */}
              <div className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(6, 182, 212, 0.04)",
                  border: "1px solid rgba(6, 182, 212, 0.15)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/70">Battery Level</span>
                  <span className="font-mono font-bold text-lg" style={{ color: batteryColor }}>
                    {sim.batteryPercent.toFixed(1)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-6 rounded-full overflow-hidden bg-white/5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                    style={{
                      width: `${sim.batteryPercent}%`,
                      background: `linear-gradient(90deg, ${batteryColor}cc, ${batteryColor})`,
                      boxShadow: `0 0 12px ${batteryColor}99`,
                    }}
                  />
                  {/* Shimmer on bar */}
                  {sim.batteryPercent < 100 && (
                    <div
                      className="absolute inset-y-0 rounded-full shimmer-bg"
                      style={{ width: `${sim.batteryPercent}%` }}
                    />
                  )}
                  {/* Percentage label inside bar */}
                  {sim.batteryPercent > 15 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">
                      {sim.batteryPercent.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Live stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass rounded-xl p-3 text-center">
                    <Zap size={14} className="text-emerald-400 mx-auto mb-1" />
                    <div className="font-mono font-bold text-sm text-white">
                      {sim.powerDraw.toFixed(1)}
                      <span className="text-xs text-white/40"> kW</span>
                    </div>
                    <div className="text-xs text-white/40">Power Draw</div>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <Battery size={14} className="text-cyan-400 mx-auto mb-1" />
                    <div className="font-mono font-bold text-sm text-white">
                      {sim.energyTransferred.toFixed(2)}
                      <span className="text-xs text-white/40"> kWh</span>
                    </div>
                    <div className="text-xs text-white/40">Transferred</div>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <DollarSign size={14} className="text-amber-400 mx-auto mb-1" />
                    <div className="font-mono font-bold text-sm text-white">
                      ฿{sim.cost.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40">Cost</div>
                  </div>
                </div>

                {/* ETA */}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>Est. remaining: {formatTime(sim.estimatedTimeRemaining)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={11} className="text-cyan-400" />
                    <span className="text-cyan-400">{sim.chargingSpeed}</span>
                  </div>
                </div>
              </div>

              {/* Stop button */}
              <button
                onClick={stopCharging}
                className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <StopCircle size={16} />
                Stop Charging Session
              </button>
            </div>
          ) : (
            /* IDLE / START STATE */
            <div className="space-y-4">
              {/* Connector info */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl glass">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-emerald-400" />
                  <span className="text-sm text-white/70">Connector</span>
                </div>
                <span className="text-sm font-semibold text-white">{station.connectorType}</span>
              </div>

              {/* Initial battery indicator */}
              <div className="rounded-2xl p-5 space-y-3"
                style={{
                  background: "rgba(16, 185, 129, 0.04)",
                  border: "1px solid rgba(16, 185, 129, 0.12)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Vehicle Battery</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {sim.batteryPercent}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${sim.batteryPercent}%`,
                      background: "linear-gradient(90deg, #10b981aa, #10b981)",
                    }}
                  />
                </div>
                <p className="text-xs text-white/40">
                  Estimated charge to 100%: ~{formatTime(Math.round(((100 - sim.batteryPercent) / 100) * 75 / station.powerOutput * 3600))}
                </p>
              </div>

              {/* Start button */}
              <button
                onClick={startCharging}
                disabled={station.status === "Maintenance"}
                className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    station.status === "Maintenance"
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #10b981, #06b6d4)",
                  boxShadow:
                    station.status === "Maintenance"
                      ? "none"
                      : "0 0 30px rgba(16, 185, 129, 0.35)",
                  color: "white",
                }}
              >
                <Zap size={18} />
                {station.status === "Maintenance"
                  ? "Station Under Maintenance"
                  : "Start Charging Session"}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
