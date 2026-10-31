"use client";

import { useEffect, useState } from "react";

interface Condition {
  id: string;
  label: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  uv: number;
  rangeImpact: number;
  rangeNote: string;
  bgClass: string;
  skyColor: string;
  groundColor: string;
}

const CONDITIONS: Condition[] = [
  {
    id: "sunny",
    label: "Clear & Sunny",
    temp: 35, feelsLike: 40, humidity: 58, wind: 10, uv: 9,
    rangeImpact: 0,
    rangeNote: "Ideal conditions — full range available",
    bgClass: "sunny",
    skyColor: "#0ea5e9",
    groundColor: "#fbbf24",
  },
  {
    id: "cloudy",
    label: "Partly Cloudy",
    temp: 29, feelsLike: 32, humidity: 72, wind: 18, uv: 4,
    rangeImpact: -3,
    rangeNote: "Light cloud — minimal impact on range",
    bgClass: "cloudy",
    skyColor: "#475569",
    groundColor: "#94a3b8",
  },
  {
    id: "rain",
    label: "Heavy Rain",
    temp: 26, feelsLike: 26, humidity: 92, wind: 28, uv: 1,
    rangeImpact: -8,
    rangeNote: "Rain & AC use reduces range — plan extra charge",
    bgClass: "rain",
    skyColor: "#1e3a5f",
    groundColor: "#60a5fa",
  },
  {
    id: "storm",
    label: "Thunderstorm",
    temp: 24, feelsLike: 23, humidity: 98, wind: 55, uv: 0,
    rangeImpact: -14,
    rangeNote: "Storm conditions — charge before travelling",
    bgClass: "storm",
    skyColor: "#1c1917",
    groundColor: "#a78bfa",
  },
];

/* ── Animated SVG weather scenes ── */
function SunnyScene() {
  return (
    <svg viewBox="0 0 200 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      {/* Sky */}
      <rect width="200" height="100" fill="url(#sunSky)" />
      <defs>
        <linearGradient id="sunSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* Sun */}
      <circle cx="160" cy="28" r="18" fill="#fbbf24" opacity="0.95">
        <animate attributeName="r" values="17;19;17" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Sun rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle) => (
        <line key={angle}
          x1={160 + Math.cos(angle * Math.PI / 180) * 22}
          y1={28  + Math.sin(angle * Math.PI / 180) * 22}
          x2={160 + Math.cos(angle * Math.PI / 180) * 30}
          y2={28  + Math.sin(angle * Math.PI / 180) * 30}
          stroke="#fbbf24" strokeWidth="2" opacity="0.7"
        >
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"
            begin={`${(angle / 30) * 0.15}s`} />
        </line>
      ))}
      {/* Ground */}
      <rect y="80" width="200" height="20" fill="#fde68a" opacity="0.3" />
      {/* Small cloud */}
      <ellipse cx="50" cy="35" rx="22" ry="10" fill="white" opacity="0.6">
        <animateTransform attributeName="transform" type="translate" values="0,0;8,0;0,0" dur="8s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="62" cy="29" rx="14" ry="10" fill="white" opacity="0.6">
        <animateTransform attributeName="transform" type="translate" values="0,0;8,0;0,0" dur="8s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

function CloudyScene() {
  return (
    <svg viewBox="0 0 200 100" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="cloudSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#cloudSky)" />
      {/* Clouds */}
      {[
        { cx: 60,  cy: 30, rx: 35, ry: 14, delay: 0,   speed: 10 },
        { cx: 140, cy: 22, rx: 28, ry: 11, delay: 0.3, speed: 14 },
        { cx: 100, cy: 50, rx: 40, ry: 15, delay: 0.1, speed: 12 },
      ].map(({ cx, cy, rx, ry, delay, speed }, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#e2e8f0" opacity="0.85">
            <animateTransform attributeName="transform" type="translate"
              values={`0,0;${speed},0;0,0`} dur={`${speed + 8}s`} begin={`${delay}s`} repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={cx + rx * 0.4} cy={cy - ry * 0.5} rx={rx * 0.6} ry={ry * 0.75} fill="white" opacity="0.7">
            <animateTransform attributeName="transform" type="translate"
              values={`0,0;${speed},0;0,0`} dur={`${speed + 8}s`} begin={`${delay}s`} repeatCount="indefinite" />
          </ellipse>
        </g>
      ))}
      <rect y="85" width="200" height="15" fill="#475569" opacity="0.4" />
    </svg>
  );
}

function RainScene() {
  const drops = Array.from({ length: 28 }, (_, i) => ({
    x: (i * 23) % 200, delay: (i * 0.07) % 0.9, dur: 0.5 + (i % 5) * 0.08,
  }));
  return (
    <svg viewBox="0 0 200 100" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="rainSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#rainSky)" />
      {/* Rain drops */}
      {drops.map((d, i) => (
        <line key={i} x1={d.x} y1={0} x2={d.x - 3} y2={12} stroke="#93c5fd" strokeWidth="1.2" opacity="0.6">
          <animateTransform attributeName="transform" type="translate"
            values={`0,-10;3,100;3,100`} dur={`${d.dur}s`} begin={`${d.delay}s`} repeatCount="indefinite" />
        </line>
      ))}
      {/* Cloud mass */}
      <ellipse cx="100" cy="18" rx="90" ry="18" fill="#334155" opacity="0.9" />
      <ellipse cx="60"  cy="12" rx="50" ry="15" fill="#475569" opacity="0.8" />
      <ellipse cx="150" cy="14" rx="45" ry="13" fill="#475569" opacity="0.8" />
      {/* Puddle */}
      <ellipse cx="100" cy="96" rx="40" ry="5" fill="#60a5fa" opacity="0.25">
        <animate attributeName="rx" values="38;44;38" dur="2s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

function StormScene() {
  return (
    <svg viewBox="0 0 200 100" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="stormSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0a09" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#stormSky)" />
      {/* Storm clouds */}
      <ellipse cx="100" cy="20" rx="95" ry="20" fill="#292524" />
      <ellipse cx="55"  cy="15" rx="55" ry="16" fill="#44403c" />
      <ellipse cx="155" cy="16" rx="50" ry="15" fill="#44403c" />
      {/* Lightning bolt */}
      <polyline points="105,30 95,55 103,55 90,85" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinejoin="round">
        <animate attributeName="opacity" values="0;0;1;0;0;0;1;0" dur="3s" repeatCount="indefinite" />
      </polyline>
      <polyline points="105,30 95,55 103,55 90,85" stroke="white" strokeWidth="1" fill="none" strokeLinejoin="round">
        <animate attributeName="opacity" values="0;0;1;0;0;0;1;0" dur="3s" repeatCount="indefinite" />
      </polyline>
      {/* Rain */}
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i} x1={(i * 11) % 200} y1={40} x2={(i * 11 - 5) % 200} y2={54}
          stroke="#475569" strokeWidth="1.2" opacity="0.5">
          <animateTransform attributeName="transform" type="translate"
            values="0,0;6,60;6,60" dur={`${0.4 + (i % 4) * 0.07}s`} begin={`${(i * 0.05) % 0.6}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}

const SCENES = { sunny: SunnyScene, cloudy: CloudyScene, rain: RainScene, storm: StormScene };

export default function WeatherWidget() {
  const [condIdx, setCondIdx] = useState(0);
  const cond = CONDITIONS[condIdx];
  const Scene = SCENES[cond.id as keyof typeof SCENES];
  const isNeg = cond.rangeImpact < 0;
  const impactColor = isNeg ? (cond.rangeImpact < -10 ? "#ef4444" : "#fbbf24") : "#00e5a0";

  // Auto-cycle every 6s for demo
  useEffect(() => {
    const iv = setInterval(() => setCondIdx((p) => (p + 1) % CONDITIONS.length), 6000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Animated scene */}
      <div style={{ position: "relative", height: 110, overflow: "hidden", flexShrink: 0 }}>
        <Scene />
        {/* Overlay: condition label + temp */}
        <div style={{ position: "absolute", top: 10, left: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>
            Bangkok, TH
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {cond.temp}°<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>C</span>
          </div>
        </div>
        <div style={{ position: "absolute", top: 10, right: 14, textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{cond.label}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>Feels {cond.feelsLike}°C</div>
        </div>
        {/* Dots */}
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
          {CONDITIONS.map((_, i) => (
            <div key={i} onClick={() => setCondIdx(i)}
              style={{ width: i === condIdx ? 14 : 5, height: 5, borderRadius: 3, background: i === condIdx ? "white" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        {[
          { label: "Humidity",  value: `${cond.humidity}%` },
          { label: "Wind",      value: `${cond.wind} km/h` },
          { label: "UV Index",  value: String(cond.uv) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--bg-1)", padding: "10px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{value}</div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Range impact */}
      <div style={{ padding: "12px 16px", background: `${impactColor}0c`, borderTop: `1px solid ${impactColor}22` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800, color: impactColor, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {cond.rangeImpact === 0 ? "+0%" : `${cond.rangeImpact}%`}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: impactColor, letterSpacing: "0.04em" }}>Range Impact</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>{cond.rangeNote}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
