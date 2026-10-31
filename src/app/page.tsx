"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  Zap, Activity, DollarSign, Wifi, RefreshCw, MapPin, ChevronRight,
  Battery, Sun, Grid, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Bell, Star, LayoutGrid, Map, BarChart3, User, Heart,
  ChevronLeft, Settings, Menu, Leaf, Search, Filter,
} from "lucide-react";
import type { Station } from "@/lib/stationData";
import { getLiveStations, buildSummary } from "@/lib/stationData";
import ChargingModal from "@/components/ChargingModal";
import NotificationsPanel from "@/components/NotificationsPanel";
import VehicleProfile, { DEFAULT_VEHICLE } from "@/components/VehicleProfile";
import type { VehicleData } from "@/components/VehicleProfile";
import CostEstimator from "@/components/CostEstimator";
import ChargingHistory from "@/components/ChargingHistory";
import MapView from "@/components/MapView";
import WeatherWidget from "@/components/WeatherWidget";

/* ─── Types ─── */
interface SummaryData {
  totalActivePower: number; activeSessions: number; dailyRevenue: number;
  gridHealth: number; totalStations: number; availableStations: number;
  maintenanceStations: number;
}
interface EnergyPoint { time: string; solar: number; grid: number; total: number; }
type TabId = "overview" | "stations" | "map" | "analytics" | "myev";

/* ─── Generate energy history ─── */
function genHistory(): EnergyPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const t = new Date(Date.now() - (29 - i) * 60000);
    const label = t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const solar = Math.round(120 + Math.sin(i * 0.3) * 40 + Math.random() * 30);
    const grid  = Math.round(380 + Math.cos(i * 0.2) * 80 + Math.random() * 50);
    return { time: label, solar, grid, total: solar + grid };
  });
}

/* ─── Custom chart tooltip ─── */
function ChartTip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-hi)", borderRadius: 6, padding: "10px 12px", fontSize: 11 }}>
      <div style={{ color: "var(--text-3)", fontFamily: "var(--mono)", marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "var(--text-2)", textTransform: "capitalize" }}>{p.name}</span>
          <span style={{ color: p.color, fontFamily: "var(--mono)", fontWeight: 700, marginLeft: "auto", paddingLeft: 16 }}>{p.value} kW</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Live ticker ─── */
function LiveTicker({ stations }: { stations: Station[] }) {
  const items = stations.map((s) => ({
    label: s.name,
    val: s.status === "Charging" ? `${s.currentLoad}kW` : s.status,
    color: s.status === "Available" ? "#00e5a0" : s.status === "Charging" ? "#38bdf8" : "#fb923c",
  }));
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div style={{
      borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      padding: "6px 0", overflow: "hidden", position: "relative",
      background: "var(--bg-1)",
    }}>
      {/* fade edges */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to right, var(--bg-1), transparent)", zIndex: 2 }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, var(--bg-1), transparent)", zIndex: 2 }} />
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingRight: 40, fontSize: 10, letterSpacing: "0.06em" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: item.color, display: "inline-block" }} />
            <span style={{ color: "var(--text-2)" }}>{item.label}</span>
            <span style={{ color: item.color, fontFamily: "var(--mono)", fontWeight: 700 }}>{item.val}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── KPI card ─── */
function KpiCard({ num, label, sub, accent, idx }: {
  num: string; label: string; sub?: string; accent?: string; idx: number;
}) {
  return (
    <div className="card" style={{
      padding: "20px 22px",
      animationDelay: `${idx * 60}ms`,
      borderLeft: `3px solid ${accent ?? "var(--border-hi)"}`,
      transition: "border-color 0.2s, transform 0.15s",
    }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 800, color: accent ?? "var(--text-1)", letterSpacing: "-0.04em", lineHeight: 1 }}>{num}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

/* ─── Station row (list view) ─── */
function StationRow({ s, isFav, onFav, onOpen }: {
  s: Station; isFav: boolean; onFav: () => void; onOpen: () => void;
}) {
  const color = { Available: "#00e5a0", Charging: "#38bdf8", Maintenance: "#fb923c" }[s.status];
  const util  = s.totalPorts > 0 ? Math.round((s.activePorts / s.totalPorts) * 100) : 0;
  return (
    <div
      onClick={onOpen}
      style={{
        display: "grid", gridTemplateColumns: "40px 1fr 100px 120px 60px 60px 80px",
        alignItems: "center", gap: 0, padding: "0 24px",
        borderBottom: "1px solid var(--border)", cursor: "pointer",
        height: 56, transition: "background 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
    >
      {/* Status dot */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      {/* Name + loc */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
          <MapPin size={9} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.location}</span>
        </div>
      </div>
      {/* Power */}
      <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: color }}>{s.currentLoad > 0 ? `${s.currentLoad} kW` : "—"}</div>
      {/* Utilization */}
      <div style={{ paddingRight: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>util</span>
          <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-2)" }}>{util}%</span>
        </div>
        <div style={{ height: 2, background: "var(--bg)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${util}%`, background: color, transition: "width 0.8s" }} />
        </div>
      </div>
      {/* Rate */}
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)" }}>฿{s.pricingRate}</div>
      {/* Ports */}
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)" }}>{s.activePorts}/{s.totalPorts}</div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onFav} style={{
          width: 28, height: 28, border: "1px solid var(--border)", borderRadius: 4,
          background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Heart size={12} fill={isFav ? "#fbbf24" : "none"} stroke={isFav ? "#fbbf24" : "var(--text-3)"} />
        </button>
        <button onClick={onOpen} className="btn-ghost" style={{ padding: "4px 8px", fontSize: 10, gap: 4 }}>
          Open <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}

/* ─── Station card (grid view) ─── */
function StationCard({ s, isFav, onFav, onOpen }: {
  s: Station; isFav: boolean; onFav: () => void; onOpen: () => void;
}) {
  const color = { Available: "#00e5a0", Charging: "#38bdf8", Maintenance: "#fb923c" }[s.status];
  const badgeClass = { Available: "badge badge-available", Charging: "badge badge-charging", Maintenance: "badge badge-maintenance" }[s.status];
  const util  = s.totalPorts > 0 ? Math.round((s.activePorts / s.totalPorts) * 100) : 0;

  return (
    <div className="card"
      onClick={onOpen}
      style={{
        overflow: "hidden", cursor: "pointer",
        transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = color + "60";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 20px ${color}15`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "var(--border)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", background: "var(--bg-2)" }}>
        <img src={s.photo} alt={s.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65) saturate(1.05)", transition: "transform 0.5s ease" }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            const z = 15, lat = s.coordinates.lat, lng = s.coordinates.lng;
            const n = Math.pow(2, z);
            const xt = Math.floor((lng + 180) / 360 * n);
            const yt = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
            el.src = `https://tile.openstreetmap.org/${z}/${xt}/${yt}.png`;
            el.style.filter = "invert(100%) hue-rotate(180deg) brightness(0.8) saturate(0.5)";
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
        />
        {/* Dark gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)" }} />

        {/* Status badge */}
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span className={badgeClass}>
            <span className={`status-dot ${s.status.toLowerCase()}`} style={{ width: 5, height: 5 }} />
            {s.status}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          style={{
            position: "absolute", top: 10, right: 10,
            width: 28, height: 28,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.2)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)")}
        >
          <Heart size={12} fill={isFav ? "#fbbf24" : "none"} stroke={isFav ? "#fbbf24" : "rgba(255,255,255,0.7)"} />
        </button>

        {/* Power badge — bottom right */}
        <div style={{
          position: "absolute", bottom: 10, right: 12,
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          color: color, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          padding: "2px 8px", borderRadius: 4,
          border: `1px solid ${color}40`,
        }}>
          {s.powerOutput} kW
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Name + location */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 4 }}>
            {s.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={10} style={{ color: "var(--text-3)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{s.location}</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "Ports",    val: `${s.activePorts}/${s.totalPorts}`, c: s.status === "Charging" ? color : "var(--text-2)" },
            { label: "Rate",     val: `฿${s.pricingRate}`,               c: "var(--text-1)" },
            { label: "Uptime",   val: `${s.uptime}%`,                    c: "var(--text-2)" },
          ].map(({ label, val, c }) => (
            <div key={label} className="stat-cell" style={{ textAlign: "center", padding: "8px 6px" }}>
              <div className="stat-cell__label" style={{ marginBottom: 3, textAlign: "center" }}>{label}</div>
              <div className="stat-cell__value" style={{ fontSize: 13, color: c, textAlign: "center" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Utilization bar */}
        {s.status === "Charging" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>Utilization</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color }}>
                {s.currentLoad} / {s.powerOutput} kW · {util}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${util}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   SIDEBAR
════════════════════════════════════ */
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, unread, onBell }: {
  activeTab: TabId; setActiveTab: (t: TabId) => void;
  collapsed: boolean; setCollapsed: (b: boolean) => void;
  unread: number; onBell: () => void;
}) {
  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",  icon: LayoutGrid },
    { id: "stations",  label: "Stations",  icon: Zap },
    { id: "map",       label: "Live Map",  icon: Map },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "myev",      label: "My EV",     icon: User },
  ];

  return (
    <div className={`sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
      }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
              <span style={{ color: "var(--accent)" }}>EV</span>
              <span style={{ color: "var(--text-1)" }}>-Pulse</span>
            </div>
            <div style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-3)", marginTop: 3 }}>
              Grid · v3.0
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 28, height: 28, borderRadius: 4, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} style={{ color: "#000" }} />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}>
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} title={collapsed ? label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 0" : "10px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? "var(--accent-dim)" : "transparent",
                border: "none", borderRight: active ? "2px solid var(--accent)" : "2px solid transparent",
                borderLeft: "none", borderTop: "none", borderBottom: "none",
                color: active ? "var(--accent)" : "var(--text-3)",
                cursor: "pointer", width: "100%", textAlign: "left",
                fontSize: "12px", fontWeight: active ? 700 : 500,
                letterSpacing: "0.02em", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
            >
              <Icon size={15} />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ borderTop: "1px solid var(--border)", padding: collapsed ? "12px 0" : "12px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Notifications */}
        <button onClick={onBell} title={collapsed ? "Notifications" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "8px 0" : "8px 0",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "none", border: "none",
            color: "var(--text-3)", cursor: "pointer", width: "100%",
            fontSize: "12px", fontWeight: 500, position: "relative",
          }}>
          <div style={{ position: "relative" }}>
            <Bell size={15} />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 13, height: 13, borderRadius: "50%",
                background: "var(--accent)", color: "#000",
                fontSize: 8, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{unread}</span>
            )}
          </div>
          {!collapsed && "Notifications"}
        </button>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} title="Expand sidebar"
            style={{ display: "flex", justifyContent: "center", padding: "8px 0", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}>
            <Menu size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   SECTION RULE HEADER
════════════════════════════════════ */
function SectionRule({ num, title }: { num: string; title: string }) {
  return (
    <div className="section-rule">
      <span className="section-rule__num">{num}</span>
      <span className="section-rule__title">{title}</span>
      <div className="section-rule__line" />
    </div>
  );
}

/* ════════════════════════════════════
   MAIN PAGE
════════════════════════════════════ */
export default function DashboardPage() {
  const [stations,          setStations]         = useState<Station[]>([]);
  const [summary,           setSummary]          = useState<SummaryData | null>(null);
  const [energyData,        setEnergyData]       = useState<EnergyPoint[]>([]);
  const [selectedStation,   setSelectedStation]  = useState<Station | null>(null);
  const [timeString,        setTimeString]       = useState("");
  const [isRefreshing,      setIsRefreshing]     = useState(false);
  const [filterStatus,      setFilterStatus]     = useState("All");
  const [searchQ,           setSearchQ]          = useState("");
  const [activeTab,         setActiveTab]        = useState<TabId>("overview");
  const [showNotifications, setShowNotifications]= useState(false);
  const [favorites,         setFavorites]        = useState<Set<string>>(new Set(["st-001", "st-005"]));
  const [vehicle,           setVehicle]          = useState<VehicleData>(DEFAULT_VEHICLE);
  const [viewMode,          setViewMode]         = useState<"grid" | "list">("grid");
  const [collapsed,         setCollapsed]        = useState(false);
  const isFetchingRef = useRef(false);

  /* ─── Fetch ─── */
  const fetchStations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);
    try {
      let sl: Station[], sd: ReturnType<typeof buildSummary>;
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) throw new Error();
        const d = await res.json();
        sl = d.stations; sd = d.summary;
      } catch { sl = getLiveStations(); sd = buildSummary(sl); }
      setStations(sl); setSummary(sd);
      setTimeString(new Date().toLocaleTimeString());
      setEnergyData((prev) => {
        const now = new Date();
        const label = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        const solar = Math.round(120 + Math.random() * 60);
        const grid  = Math.round(sd.totalActivePower - solar);
        return [...prev, { time: label, solar: Math.max(0, solar), grid: Math.max(0, grid), total: sd.totalActivePower }].slice(-30);
      });
    } catch { /* silent */ }
    finally { setIsRefreshing(false); isFetchingRef.current = false; }
  }, []);

  useEffect(() => {
    setEnergyData(genHistory());
    fetchStations();
    const iv = setInterval(fetchStations, 5000);
    return () => clearInterval(iv);
  }, [fetchStations]);

  /* ─── Derived ─── */
  const toggleFav = (id: string) =>
    setFavorites((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const filteredStations = stations
    .filter((s) => filterStatus === "All" || s.status === filterStatus)
    .filter((s) => !searchQ || s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.location.toLowerCase().includes(searchQ.toLowerCase()));

  const gridHealthColor = (summary?.gridHealth ?? 100) >= 90 ? "#00e5a0" : (summary?.gridHealth ?? 100) >= 70 ? "#fb923c" : "#ef4444";
  const last = energyData[energyData.length - 1];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ════ SIDEBAR ════ */}
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        collapsed={collapsed} setCollapsed={setCollapsed}
        unread={2} onBell={() => setShowNotifications(true)}
      />

      {/* ════ CONTENT ════ */}
      <div className={`content-area${collapsed ? " collapsed" : ""}`} style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", height: 52,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-1)", position: "sticky", top: 0, zIndex: 30,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Current tab title */}
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
              {{
                overview: "01 — Overview",
                stations: "02 — Stations",
                map:      "03 — Live Map",
                analytics:"04 — Analytics",
                myev:     "05 — My EV",
              }[activeTab]}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", boxShadow: "0 0 6px var(--accent)" }} />
              Live
            </div>
            <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }} suppressHydrationWarning>
              {timeString || "—"}
            </span>
            <button onClick={fetchStations} disabled={isRefreshing}
              style={{ width: 28, height: 28, background: "none", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", opacity: isRefreshing ? 0.4 : 1 }}>
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Live ticker ── */}
        <LiveTicker stations={stations} />

        {/* ── Main scroll area ── */}
        <div style={{
          flex: 1,
          overflowY: activeTab === "map" ? "hidden" : "auto",
          overflowX: "hidden",
          padding: activeTab === "map" ? "24px 32px 0" : "32px",
          display: "flex",
          flexDirection: "column",
          gap: activeTab === "map" ? 16 : 32,
          minHeight: 0,
        }}>

          {/* ══════════════════════════════
              TAB 01 — OVERVIEW
          ══════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              {/* Hero greeting strip */}
              <div style={{
                padding: "20px 24px", background: "var(--bg-1)",
                border: "1px solid var(--border)", borderLeft: `3px solid var(--accent)`,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} · EV-Pulse Dashboard
                  </div>
                  <div style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {summary?.availableStations ?? 0} station{(summary?.availableStations ?? 0) !== 1 ? "s" : ""} available near you
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
                    {summary?.activeSessions ?? 0} active sessions · {summary?.totalActivePower ?? 0} kW live demand · Grid health {summary?.gridHealth ?? 100}%
                  </div>
                </div>
                <button className="btn-accent" onClick={() => setActiveTab("stations")}>
                  Find a Charger <ChevronRight size={12} />
                </button>
              </div>

              {/* KPI strip — 4 user-relevant metrics */}
              <section>
                <SectionRule num="01" title="Network at a Glance" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KpiCard idx={0} num={`${summary?.availableStations ?? 0} / ${summary?.totalStations ?? 0}`} label="Available Now"   sub="Stations open for charging"            accent="#00e5a0" />
                  <KpiCard idx={1} num={`${summary?.totalActivePower ?? 0} kW`}                                 label="Live Demand"     sub="Total power being drawn now"           accent="#38bdf8" />
                  <KpiCard idx={2} num={`${summary?.gridHealth ?? 100}%`}                                       label="Grid Health"     sub={`${summary?.maintenanceStations ?? 0} offline · ${summary?.availableStations ?? 0} ready`} accent={gridHealthColor} />
                  <KpiCard idx={3} num={`฿${stations.length > 0 ? Math.min(...stations.map((s) => s.pricingRate)).toFixed(1) : "—"}/kWh`} label="Cheapest Rate" sub={`${stations.find((s) => s.pricingRate === Math.min(...stations.map((x) => x.pricingRate)))?.name ?? "—"}`} accent="#fbbf24" />
                </div>
              </section>

              {/* Chart + quick stats */}
              <section>
                <SectionRule num="02" title="Live Power Mix" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12 }}>
                  <div className="card" style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Solar vs Grid · 30 min window</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-1)" }}>
                          {last?.total ?? 0} <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}>kW total output</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 14 }}>
                        {[["Solar", "#00e5a0", Sun], ["Grid", "#38bdf8", Grid]].map(([n, c, I]) => (
                          <div key={n as string} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: c as string }}>
                            {/* @ts-ignore */}
                            <I size={10} />
                            <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>{n as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={energyData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00e5a0" stopOpacity={0.3} /><stop offset="100%" stopColor="#00e5a0" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} /><stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 6" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} unit="kW" width={50} />
                        <Tooltip content={<ChartTip />} />
                        <Area type="monotone" dataKey="solar" name="Solar" stroke="#00e5a0" strokeWidth={1.5} fill="url(#gs)" dot={false} activeDot={{ r: 3, fill: "#00e5a0", strokeWidth: 0 }} />
                        <Area type="monotone" dataKey="grid"  name="Grid"  stroke="#38bdf8" strokeWidth={1.5} fill="url(#gg)" dot={false} activeDot={{ r: 3, fill: "#38bdf8", strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Network breakdown */}
                  <div className="card" style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Station Breakdown</div>
                    {[
                      { label: "Available",   count: summary?.availableStations ?? 0,   color: "#00e5a0", icon: CheckCircle },
                      { label: "Charging",    count: (summary?.totalStations ?? 0) - (summary?.availableStations ?? 0) - (summary?.maintenanceStations ?? 0), color: "#38bdf8", icon: Zap },
                      { label: "Maintenance", count: summary?.maintenanceStations ?? 0, color: "#fb923c", icon: AlertTriangle },
                    ].map(({ label, count, color, icon: Icon }) => (
                      <div key={label}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Icon size={12} style={{ color }} />
                            <span style={{ fontSize: 11, color: "var(--text-2)" }}>{label}</span>
                          </div>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color, letterSpacing: "-0.03em" }}>{count}</span>
                        </div>
                        <div style={{ height: 2, background: "var(--bg)", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${((count / (summary?.totalStations || 1)) * 100)}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                    {/* Energy mix compact */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: "auto" }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Energy Mix</div>
                      {last && [
                        { k: "solar", label: "Solar", color: "#00e5a0", I: Sun },
                        { k: "grid",  label: "Grid",  color: "#38bdf8", I: Grid },
                      ].map(({ k, label, color, I }) => {
                        const val = (last as unknown as Record<string,number>)[k] ?? 0;
                        const pct = last.total ? Math.round(val / last.total * 100) : 0;
                        return (
                          <div key={k} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color }}>
                                <I size={9} />{label}
                              </div>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-3)" }}>{pct}% · {val} kW</span>
                            </div>
                            <div style={{ height: 2, background: "var(--bg)", borderRadius: 1, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Station preview — nearest available first */}
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
                  <div className="section-rule" style={{ flex: 1, marginBottom: 0 }}>
                    <span className="section-rule__num">03</span>
                    <span className="section-rule__title">Available Stations</span>
                    <div className="section-rule__line" />
                  </div>
                  <button onClick={() => setActiveTab("stations")} className="btn-ghost" style={{ marginLeft: 16, flexShrink: 0 }}>
                    All stations <ChevronRight size={11} />
                  </button>
                </div>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {stations
                    .filter((s) => s.status === "Available")
                    .slice(0, 3)
                    .concat(stations.filter((s) => s.status === "Charging").slice(0, Math.max(0, 3 - stations.filter((s) => s.status === "Available").length)))
                    .slice(0, 3)
                    .map((s) => (
                      <StationCard key={s.id} s={s} isFav={favorites.has(s.id)} onFav={() => toggleFav(s.id)} onOpen={() => setSelectedStation(s)} />
                    ))}
                </div>
              </section>
            </>
          )}

          {/* ══════════════════════════════
              TAB 02 — STATIONS
          ══════════════════════════════ */}
          {activeTab === "stations" && (
            <>
              <section>
                <SectionRule num="02" title="All Charging Stations" />

                {/* Toolbar */}
                <div style={{ display: "flex", gap: 12, marginBottom: 1, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Search */}
                  <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                    <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                    <input className="ev-input" placeholder="Search stations…" value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      style={{ paddingLeft: 28 }} />
                  </div>
                  {/* Status filter */}
                  <div style={{ display: "flex", gap: 1, background: "var(--border)" }}>
                    {["All", "Available", "Charging", "Maintenance"].map((f) => {
                      const colors: Record<string, string> = { All: "var(--text-2)", Available: "#00e5a0", Charging: "#38bdf8", Maintenance: "#fb923c" };
                      const active = filterStatus === f;
                      return (
                        <button key={f} onClick={() => setFilterStatus(f)}
                          style={{
                            padding: "6px 14px", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: active ? "var(--bg-2)" : "var(--bg-1)",
                            color: active ? colors[f] : "var(--text-3)",
                            border: "none", cursor: "pointer",
                            borderBottom: active ? `2px solid ${colors[f]}` : "2px solid transparent",
                            transition: "all 0.15s",
                          }}
                        >{f}</button>
                      );
                    })}
                  </div>
                  {/* View toggle */}
                  <div style={{ display: "flex", gap: 1, background: "var(--border)" }}>
                    {(["grid", "list"] as const).map((m) => (
                      <button key={m} onClick={() => setViewMode(m)}
                        style={{
                          padding: "6px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                          background: viewMode === m ? "var(--bg-2)" : "var(--bg-1)",
                          color: viewMode === m ? "var(--accent)" : "var(--text-3)",
                          border: "none", cursor: "pointer",
                        }}>
                        {m === "grid" ? <LayoutGrid size={12} /> : <Filter size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results count */}
                <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em", padding: "8px 0", borderBottom: "1px solid var(--border)", marginBottom: 1 }}>
                  Showing {filteredStations.length} of {stations.length} stations
                </div>

                {viewMode === "list" ? (
                  <div className="card">
                    {/* Table header */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "40px 1fr 100px 120px 60px 60px 80px",
                      gap: 0, padding: "0 24px", height: 36,
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg-2)", alignItems: "center",
                    }}>
                      {["", "Station", "Live kW", "Utilization", "฿/kWh", "Ports", ""].map((h, i) => (
                        <div key={i} style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</div>
                      ))}
                    </div>
                    {filteredStations.map((s) => (
                      <StationRow key={s.id} s={s} isFav={favorites.has(s.id)} onFav={() => toggleFav(s.id)} onOpen={() => setSelectedStation(s)} />
                    ))}
                    {filteredStations.length === 0 && (
                      <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                        No stations match this filter.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {filteredStations.map((s) => (
                      <StationCard key={s.id} s={s} isFav={favorites.has(s.id)} onFav={() => toggleFav(s.id)} onOpen={() => setSelectedStation(s)} />
                    ))}
                    {filteredStations.length === 0 && (
                      <div style={{ padding: "60px", textAlign: "center", color: "var(--text-3)", fontSize: 12, gridColumn: "1/-1" }}>
                        No stations match this filter.
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ══════════════════════════════
              TAB 03 — MAP
          ══════════════════════════════ */}
          {activeTab === "map" && (
            <section style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <SectionRule num="03" title="Live Map — Thailand EV Network" />
              {/* height: 0 + flex: 1 forces the div to fill remaining space properly */}
              <div style={{
                flex: 1,
                minHeight: 0,
                height: 0,
                border: "1px solid var(--border)",
                background: "var(--bg-1)",
                overflow: "hidden",
              }}>
                {stations.length > 0 && (
                  <MapView
                    stations={stations}
                    onSelectStation={(s) => setSelectedStation(s)}
                  />
                )}
              </div>
            </section>
          )}

          {/* ══════════════════════════════
              TAB 04 — ANALYTICS
          ══════════════════════════════ */}
          {activeTab === "analytics" && (
            <>
              <section>
                <SectionRule num="04" title="Grid Analytics" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", marginBottom: 1 }}>
                  {/* Area chart */}
                  <div className="card" style={{ padding: "20px 24px" }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>Power Output — 30 min</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={energyData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00e5a0" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#00e5a0" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="a3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 6" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} unit="kW" width={50} />
                        <Tooltip content={<ChartTip />} />
                        <Area type="monotone" dataKey="solar" name="Solar" stroke="#00e5a0" strokeWidth={1.5} fill="url(#a1)" dot={false} />
                        <Area type="monotone" dataKey="grid"  name="Grid"  stroke="#38bdf8" strokeWidth={1.5} fill="url(#a2)" dot={false} />
                        <Area type="monotone" dataKey="total" name="Total" stroke="#a78bfa" strokeWidth={1} strokeDasharray="3 3" fill="url(#a3)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar chart — per-station energy */}
                  <div className="card" style={{ padding: "20px 24px" }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>Daily kWh per Station</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stations.map((s) => ({ name: s.name.split(" ")[0], kwh: s.totalEnergy }))} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="1 6" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} unit="kWh" width={54} />
                        <Tooltip contentStyle={{ background: "var(--bg-2)", border: "1px solid var(--border-hi)", borderRadius: 4, fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="kwh" name="kWh" fill="#00e5a0" fillOpacity={0.8} radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Performance table */}
              <section>
                <SectionRule num="04.2" title="Station Performance Table" />
                <div className="card" style={{ overflow: "hidden" }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 80px 140px 70px 80px 70px",
                    padding: "0 24px", height: 36,
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-2)", alignItems: "center", gap: 0,
                  }}>
                    {["Station", "Status", "kW Live", "Utilization", "Uptime", "Today kWh", "฿/kWh"].map((h) => (
                      <div key={h} style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</div>
                    ))}
                  </div>
                  {stations.map((s) => {
                    const color = { Available: "#00e5a0", Charging: "#38bdf8", Maintenance: "#fb923c" }[s.status];
                    const util  = s.totalPorts > 0 ? Math.round(s.activePorts / s.totalPorts * 100) : 0;
                    return (
                      <div key={s.id} onClick={() => setSelectedStation(s)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 80px 80px 140px 70px 80px 70px",
                          padding: "0 24px", height: 52,
                          borderBottom: "1px solid var(--border)", cursor: "pointer",
                          alignItems: "center", gap: 0, transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{s.name}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.status}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color }}>{s.currentLoad > 0 ? `${s.currentLoad}` : "—"}</div>
                        <div style={{ paddingRight: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: "var(--text-3)" }}>{util}%</span>
                          </div>
                          <div style={{ height: 2, background: "var(--bg)", borderRadius: 1, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${util}%`, background: color }} />
                          </div>
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)" }}>{s.uptime}%</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>{s.totalEnergy.toLocaleString()}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)" }}>฿{s.pricingRate}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* ══════════════════════════════
              TAB 05 — MY EV
          ══════════════════════════════ */}
          {activeTab === "myev" && (
            <>
              <SectionRule num="05" title="My EV Profile" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <VehicleProfile vehicle={vehicle} onUpdate={setVehicle} />
                <WeatherWidget />
                {stations.length > 0 && (
                  <CostEstimator stations={stations} vehicleBattery={vehicle.currentCharge} vehicleCapacity={vehicle.batteryCapacity} />
                )}
              </div>

              {/* Favorites */}
              {favorites.size > 0 && (
                <section>
                  <SectionRule num="05.2" title="Favorite Stations" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "var(--border)" }}>
                    {stations.filter((s) => favorites.has(s.id)).map((s) => (
                      <StationCard key={s.id} s={s} isFav onFav={() => toggleFav(s.id)} onOpen={() => setSelectedStation(s)} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <SectionRule num="05.3" title="Charging History" />
                <ChargingHistory />
              </section>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid var(--border)", padding: "10px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)",
        }}>
          <span>EV-Pulse Smart Charging Grid · v3.0.0</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00e5a0", display: "inline-block" }} />
            All systems nominal · © 2026
          </span>
        </div>
      </div>

      {/* Charging modal */}
      {selectedStation && (
        <ChargingModal station={selectedStation} onClose={() => setSelectedStation(null)} />
      )}

      {/* Notifications */}
      {showNotifications && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowNotifications(false)} />
          <NotificationsPanel onClose={() => setShowNotifications(false)} />
        </>
      )}
    </div>
  );
}
