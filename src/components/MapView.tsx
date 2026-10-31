"use client";

import { useState, useEffect, useRef } from "react";
import type { Station } from "@/lib/stationData";
import { X, Zap, MapPin, Clock, DollarSign, Plus, Minus, Layers } from "lucide-react";

export interface UserStation {
  id: string; name: string; lat: number; lng: number;
  power: number; price: number; connectorType: string;
  notes: string; addedAt: string;
}

interface Props {
  stations: Station[];
  onSelectStation: (s: Station) => void;
}

const STATUS_COLOR: Record<string, string> = {
  Available:   "#00e5a0",
  Charging:    "#38bdf8",
  Maintenance: "#fb923c",
};

/* ── Station side panel ── */
function StationPanel({ s, onClose, onCharge }: { s: Station; onClose: () => void; onCharge: () => void }) {
  const color = STATUS_COLOR[s.status];
  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 272,
      background: "var(--bg-1)", borderLeft: "1px solid var(--border-hi)",
      display: "flex", flexDirection: "column", zIndex: 30, overflow: "hidden",
    }}>
      <div style={{ position: "relative", height: 130, overflow: "hidden", flexShrink: 0 }}>
        <img src={s.photo} alt={s.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            const z = 15, lat = s.coordinates.lat, lng = s.coordinates.lng;
            const n = Math.pow(2, z);
            const xt = Math.floor((lng + 180) / 360 * n);
            const yt = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
            el.src = `https://tile.openstreetmap.org/${z}/${xt}/${yt}.png`;
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, var(--bg-1))" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, background: "rgba(0,0,0,0.7)", border: "1px solid var(--border-hi)", borderRadius: 3, color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={12} />
        </button>
        <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px", borderRadius: 2, background: `${color}22`, border: `1px solid ${color}55`, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color }}>
          {s.status}
        </div>
      </div>
      <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{s.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <MapPin size={9} style={{ color: "var(--text-3)" }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>{s.location}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { l: "Max Power", v: `${s.powerOutput} kW`, c: color },
            { l: "Rate",      v: `฿${s.pricingRate}/kWh`, c: "var(--text-1)" },
            { l: "Active",    v: `${s.activePorts}/${s.totalPorts}`, c: "#38bdf8" },
            { l: "Connector", v: s.connectorType.split("/")[0].trim(), c: "var(--text-1)" },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 5, padding: "8px 10px" }}>
              <div style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "var(--mono)" }}>{v}</div>
            </div>
          ))}
        </div>
        {s.currentLoad > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>Live Load</span>
              <span style={{ fontSize: 10, fontFamily: "var(--mono)", color }}>{s.currentLoad}/{s.powerOutput} kW</span>
            </div>
            <div style={{ height: 3, background: "var(--bg)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(s.currentLoad / s.powerOutput) * 100}%`, background: color, transition: "width 1s" }} />
            </div>
          </div>
        )}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { icon: Clock,      label: "Uptime",       val: `${s.uptime}%` },
            { icon: Zap,        label: "Today",        val: `${s.totalEnergy.toLocaleString()} kWh` },
            { icon: DollarSign, label: "Efficiency",   val: `${s.efficiency}%` },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={10} style={{ color: "var(--text-3)" }} />
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{label}</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-2)" }}>{val}</span>
            </div>
          ))}
        </div>
        <button className="btn-accent" style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
          onClick={onCharge} disabled={s.status === "Maintenance"}>
          <Zap size={12} />
          {s.status === "Maintenance" ? "Under Maintenance" : "Start Charging"}
        </button>
      </div>
    </div>
  );
}

/* ── Add station form ── */
function AddForm({ onAdd, onCancel }: { onAdd: (s: UserStation) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: "", lat: "13.7563", lng: "100.5018", power: 22, price: 8.0, connectorType: "Type 2", notes: "" });
  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a78bfa" }}>Add New Station</span>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><X size={13} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <input className="ev-input" placeholder="Station name *" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Latitude</label>
          <input className="ev-input" placeholder="13.7563" value={form.lat} onChange={(e) => set("lat", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Longitude</label>
          <input className="ev-input" placeholder="100.5018" value={form.lng} onChange={(e) => set("lng", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Power kW</label>
          <input type="number" className="ev-input" min={3} max={350} value={form.power} onChange={(e) => set("power", Number(e.target.value))} />
        </div>
        <div>
          <label style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>฿/kWh</label>
          <input type="number" className="ev-input" min={1} max={20} step={0.1} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
        <div>
          <label style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Connector</label>
          <select className="ev-input" value={form.connectorType} onChange={(e) => set("connectorType", e.target.value)}>
            {["Type 2", "CCS2", "CHAdeMO", "GB/T", "Tesla"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <input className="ev-input" placeholder="Notes (optional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      <button className="btn-accent" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
        onClick={() => {
          if (!form.name.trim()) return;
          const lat = parseFloat(form.lat), lng = parseFloat(form.lng);
          if (isNaN(lat) || isNaN(lng)) return;
          onAdd({ id: `user-${Date.now()}`, name: form.name, lat, lng, power: form.power, price: form.price, connectorType: form.connectorType, notes: form.notes, addedAt: new Date().toLocaleString() });
        }}
        disabled={!form.name.trim()}>
        Confirm Station
      </button>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN — uses Leaflet loaded via window
════════════════════════════════════════ */
export default function MapView({ stations, onSelectStation }: Props) {
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<import("leaflet").Map | null>(null);
  const markersRef  = useRef<import("leaflet").Layer[]>([]);
  const initialized = useRef(false);

  const [panelStation, setPanelStation] = useState<Station | null>(null);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [userStations, setUserStations] = useState<UserStation[]>([]);
  const [tileStyle,    setTileStyle]    = useState<"dark" | "satellite">("dark");
  const [zoom,         setZoomState]    = useState(6);

  /* ── Load Leaflet CSS + JS once ── */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initMap = () => {
      if (!mapDivRef.current || mapRef.current) return;

      const L = (window as unknown as { L: typeof import("leaflet") }).L;

      const map = L.map(mapDivRef.current, {
        center: [13.0, 101.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });

      const osmDark = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      });

      const esriSat = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri", maxZoom: 19 }
      );

      osmDark.addTo(map);

      // Apply dark CSS filter to OSM tiles
      const tp = map.getPane("tilePane");
      if (tp) tp.style.filter = "invert(100%) hue-rotate(180deg) brightness(0.9) saturate(0.55)";

      (map as unknown as Record<string, unknown>).__dark = osmDark;
      (map as unknown as Record<string, unknown>).__sat  = esriSat;

      map.on("zoomend", () => setZoomState(map.getZoom()));

      mapRef.current = map;
      // Force full repaint
      setTimeout(() => map.invalidateSize(false), 200);
      setTimeout(() => map.invalidateSize(false), 600);
    };

    if ((window as unknown as Record<string, unknown>).L) {
      initMap();
      return;
    }

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setTimeout(initMap, 50);
    document.head.appendChild(script);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      initialized.current = false;
    };
  }, []); // eslint-disable-line

  /* ── Tile toggle ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const m   = map as unknown as Record<string, unknown>;
    const dark = m.__dark as import("leaflet").TileLayer | undefined;
    const sat  = m.__sat  as import("leaflet").TileLayer | undefined;
    if (!dark || !sat) return;
    const tp = map.getPane("tilePane");
    if (tileStyle === "dark") {
      if (map.hasLayer(sat))  map.removeLayer(sat);
      if (!map.hasLayer(dark)) dark.addTo(map);
      if (tp) tp.style.filter = "invert(100%) hue-rotate(180deg) brightness(0.9) saturate(0.55)";
    } else {
      if (map.hasLayer(dark)) map.removeLayer(dark);
      if (!map.hasLayer(sat)) sat.addTo(map);
      if (tp) tp.style.filter = "none";
    }
  }, [tileStyle]);

  /* ── Markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L = (window as unknown as { L: typeof import("leaflet") }).L;
    if (!L) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Network stations
    stations.forEach((s) => {
      const color = STATUS_COLOR[s.status];
      const pulse = s.status === "Charging";
      const icon = L.divIcon({
        className: "",
        iconSize:   [36, 36],
        iconAnchor: [18, 18],
        popupAnchor:[0, -20],
        html: `<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center">
          ${pulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.18;animation:ping 2s cubic-bezier(0,0,.2,1) infinite;transform:scale(1.7)"></div>` : ""}
          <div style="position:relative;width:32px;height:32px;border-radius:50%;background:${color}1a;border:2px solid ${color};box-shadow:0 0 10px ${color}77;display:flex;align-items:center;justify-content:center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="${color}"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          </div>
        </div>`,
      });

      const marker = L.marker([s.coordinates.lat, s.coordinates.lng], { icon });
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:200px;padding:2px">
          <div style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:${color};margin-bottom:4px">${s.status}</div>
          <div style="font-size:14px;font-weight:800;color:#f0f2f5;line-height:1.2;margin-bottom:3px">${s.name}</div>
          <div style="font-size:10px;color:#8b92a5;margin-bottom:10px">${s.location}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
            <div style="background:rgba(255,255,255,.05);border-radius:4px;padding:7px">
              <div style="font-size:9px;color:#454d5e;margin-bottom:2px">POWER</div>
              <div style="font-size:13px;font-weight:700;color:${color};font-family:monospace">${s.powerOutput} kW</div>
            </div>
            <div style="background:rgba(255,255,255,.05);border-radius:4px;padding:7px">
              <div style="font-size:9px;color:#454d5e;margin-bottom:2px">RATE</div>
              <div style="font-size:13px;font-weight:700;color:#f0f2f5;font-family:monospace">฿${s.pricingRate}</div>
            </div>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('ev-open',{detail:'${s.id}'}))"
            style="width:100%;padding:8px;background:#00e5a0;color:#000;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:none;border-radius:3px;cursor:pointer">
            ⚡ Start Charging
          </button>
        </div>`, { maxWidth: 220 });
      marker.on("click", () => { setPanelStation(s); setShowAddForm(false); });
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // User stations
    userStations.forEach((us) => {
      const icon = L.divIcon({
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        html: `<div style="width:30px;height:30px;border-radius:50%;background:rgba(167,139,250,.15);border:2px dashed #a78bfa;display:flex;align-items:center;justify-content:center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>`,
      });
      const m = L.marker([us.lat, us.lng], { icon });
      m.bindPopup(`<div style="font-family:system-ui">
        <div style="font-size:9px;color:#a78bfa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">User Added</div>
        <div style="font-size:13px;font-weight:700;color:#f0f2f5;margin-bottom:5px">${us.name}</div>
        <div style="font-size:10px;color:#8b92a5">${us.power}kW · ฿${us.price}/kWh · ${us.connectorType}</div>
        ${us.notes ? `<div style="font-size:10px;color:#8b92a5;margin-top:4px;font-style:italic">${us.notes}</div>` : ""}
        <div style="font-size:9px;color:#454d5e;margin-top:5px">${us.addedAt}</div>
      </div>`, { maxWidth: 200 });
      m.addTo(map);
      markersRef.current.push(m);
    });
  }, [stations, userStations]); // eslint-disable-line

  /* ── Side-panel open/close → invalidate ── */
  useEffect(() => {
    if (!mapRef.current) return;
    setTimeout(() => mapRef.current?.invalidateSize(false), 60);
  }, [panelStation, showAddForm]);

  /* ── Custom event from popup button ── */
  useEffect(() => {
    const fn = (e: Event) => {
      const s = stations.find((x) => x.id === (e as CustomEvent).detail);
      if (s) onSelectStation(s);
    };
    window.addEventListener("ev-open", fn);
    return () => window.removeEventListener("ev-open", fn);
  }, [stations, onSelectStation]);

  const zoomIn  = () => { mapRef.current?.zoomIn();  };
  const zoomOut = () => { mapRef.current?.zoomOut(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-1)", flexShrink: 0, flexWrap: "wrap" }}>
        {/* Tile toggle */}
        <div style={{ display: "flex", gap: 2 }}>
          {(["dark", "satellite"] as const).map((t) => (
            <button key={t} onClick={() => setTileStyle(t)}
              style={{ padding: "4px 10px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: tileStyle === t ? "#00e5a0" : "var(--bg-2)", color: tileStyle === t ? "#000" : "var(--text-3)", border: "1px solid var(--border)", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Layers size={9} />{t}
            </button>
          ))}
        </div>
        {/* Zoom */}
        <div style={{ display: "flex", gap: 2 }}>
          {[{ icon: Plus, fn: zoomIn }, { icon: Minus, fn: zoomOut }].map(({ icon: Icon, fn }) => (
            <button key={fn.name} onClick={fn}
              style={{ width: 26, height: 26, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}>
              <Icon size={12} />
            </button>
          ))}
          <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-3)", display: "flex", alignItems: "center", padding: "0 6px" }}>z{zoom}</span>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginLeft: "auto", flexWrap: "wrap" }}>
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "var(--text-3)", letterSpacing: "0.06em" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{s}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "var(--text-3)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", border: "1.5px dashed #a78bfa" }} />User added
          </div>
        </div>
        {/* Add button */}
        <button className="btn-accent" style={{ padding: "4px 12px", fontSize: 9, marginLeft: 8 }}
          onClick={() => { setShowAddForm(!showAddForm); setPanelStation(null); }}>
          <Plus size={10} /> Add Station
        </button>
      </div>

      {/* Map + panel row */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Map div — must be a non-zero-size block */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div
            ref={mapDivRef}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </div>

        {/* Side panel */}
        {panelStation && !showAddForm && (
          <StationPanel
            s={panelStation}
            onClose={() => setPanelStation(null)}
            onCharge={() => { onSelectStation(panelStation); setPanelStation(null); }}
          />
        )}
      </div>

      {/* Add form — bottom drawer */}
      {showAddForm && (
        <AddForm
          onAdd={(us) => { setUserStations((p) => [...p, us]); setShowAddForm(false); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {userStations.length > 0 && (
        <div style={{ padding: "5px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a78bfa", borderTop: "1px solid var(--border)", background: "rgba(167,139,250,0.06)" }}>
          +{userStations.length} user station{userStations.length > 1 ? "s" : ""} added
        </div>
      )}
    </div>
  );
}
