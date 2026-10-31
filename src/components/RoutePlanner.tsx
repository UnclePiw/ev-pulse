"use client";

import { useState } from "react";
import { Navigation, MapPin, Zap, Clock, Battery, ChevronRight, Route } from "lucide-react";
import type { Station } from "@/lib/stationData";

interface Props {
  stations: Station[];
  onSelectStation: (s: Station) => void;
}

interface RouteResult {
  station: Station;
  distanceKm: number;
  detourKm: number;
  chargeTime: number; // minutes to charge from 20%→80%
  estimatedCost: number;
}

// Haversine distance
function dist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rough geocode for Thai cities
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "bangkok":    { lat: 13.7563, lng: 100.5018 },
  "chiang mai": { lat: 18.7883, lng: 98.9853 },
  "pattaya":    { lat: 12.9236, lng: 100.8825 },
  "phuket":     { lat: 7.8804,  lng: 98.3923 },
  "hua hin":    { lat: 12.5664, lng: 99.9577 },
  "korat":      { lat: 14.9799, lng: 102.0978 },
  "ayutthaya":  { lat: 14.3532, lng: 100.5678 },
};

function geocode(name: string): { lat: number; lng: number } | null {
  const key = name.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city)) return coords;
  }
  return null;
}

export default function RoutePlanner({ stations, onSelectStation }: Props) {
  const [origin, setOrigin]       = useState("Bangkok");
  const [destination, setDest]    = useState("Chiang Mai");
  const [range, setRange]         = useState(350); // km at full charge
  const [results, setResults]     = useState<RouteResult[] | null>(null);
  const [searched, setSearched]   = useState(false);

  const plan = () => {
    const o = geocode(origin);
    const d = geocode(destination);
    if (!o || !d) { setResults([]); setSearched(true); return; }

    const totalDist = dist(o.lat, o.lng, d.lat, d.lng);

    // Find stations within ~50km of the route midpoint (simplified)
    const midLat = (o.lat + d.lat) / 2;
    const midLng = (o.lng + d.lng) / 2;

    const candidates = stations
      .filter((s) => s.status !== "Maintenance")
      .map((s) => {
        const dToMid = dist(midLat, midLng, s.coordinates.lat, s.coordinates.lng);
        const dFromOrigin = dist(o.lat, o.lng, s.coordinates.lat, s.coordinates.lng);
        const detour = Math.max(0, dToMid - totalDist * 0.3);
        const chargeKwh = 75 * 0.6; // 20% → 80% of 75kWh
        const chargeTime = Math.round((chargeKwh / s.powerOutput) * 60);
        return {
          station: s,
          distanceKm: Math.round(dFromOrigin),
          detourKm: Math.round(detour),
          chargeTime,
          estimatedCost: Math.round(chargeKwh * s.pricingRate),
          score: dToMid + detour * 0.5,
        };
      })
      .filter((r) => r.distanceKm < totalDist * 0.85 && r.distanceKm > 30)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    setResults(candidates);
    setSearched(true);
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Route size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Route Planner</div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>Find charging stops along your journey</div>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 5 }}>From</label>
            <div style={{ position: "relative" }}>
              <MapPin size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--accent)" }} />
              <input className="ev-input" value={origin} onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Bangkok" style={{ paddingLeft: 28 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 5 }}>To</label>
            <div style={{ position: "relative" }}>
              <MapPin size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#38bdf8" }} />
              <input className="ev-input" value={destination} onChange={(e) => setDest(e.target.value)}
                placeholder="e.g. Chiang Mai" style={{ paddingLeft: 28 }} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 5 }}>
            Vehicle Range: <span style={{ color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>{range} km</span>
          </label>
          <input type="range" min={100} max={600} step={10} value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)" }} />
        </div>

        <button className="btn-accent" style={{ width: "100%", justifyContent: "center" }} onClick={plan}>
          <Navigation size={13} /> Plan Route
        </button>

        {/* Results */}
        {searched && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            {results === null || results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--text-3)" }}>
                {results?.length === 0 ? "No stations found on this route. Try different cities." : "Calculating…"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 2 }}>
                  Recommended stops ({results.length})
                </div>
                {results.map((r, i) => {
                  const color = r.station.status === "Available" ? "var(--accent)" : "#38bdf8";
                  return (
                    <div key={r.station.id}
                      onClick={() => onSelectStation(r.station)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: "var(--r-md)",
                        background: "var(--bg-2)", border: "1px solid var(--border-hi)",
                        cursor: "pointer", transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = color)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hi)")}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${color}22`, border: `1px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 800, color }}>{i + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{r.station.name}</div>
                        <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-3)" }}>
                          <span>{r.distanceKm} km from start</span>
                          <span>·</span>
                          <span style={{ color }}>{r.station.powerOutput}kW</span>
                          <span>·</span>
                          <span>฿{r.estimatedCost}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color }}>{r.chargeTime}m</div>
                        <div style={{ fontSize: 9, color: "var(--text-3)" }}>charge</div>
                      </div>
                      <ChevronRight size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
