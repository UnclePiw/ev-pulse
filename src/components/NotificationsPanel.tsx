"use client";

import { useState } from "react";
import { Bell, X, CheckCircle2, AlertTriangle, Zap, Info, Trash2 } from "lucide-react";

export interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "charge";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "success",
    title: "Charging Complete",
    message: "Bangkok Central Hub — Vehicle charged to 100%. Session cost: ฿284.50",
    time: "2 min ago",
    read: false,
  },
  {
    id: "n2",
    type: "info",
    title: "Station Available",
    message: "Sukhumvit Tech Park now has 3 open ports nearby you.",
    time: "8 min ago",
    read: false,
  },
  {
    id: "n3",
    type: "warning",
    title: "Maintenance Alert",
    message: "Chiang Mai Mountain Gate is under scheduled maintenance until 18:00.",
    time: "1 hr ago",
    read: true,
  },
  {
    id: "n4",
    type: "charge",
    title: "Price Drop",
    message: "Off-peak pricing active at Pattaya Coastal — ฿6.20/kWh until 06:00.",
    time: "3 hr ago",
    read: true,
  },
  {
    id: "n5",
    type: "info",
    title: "Monthly Summary",
    message: "October: 12 sessions, 142 kWh, ฿1,240 spent. You saved 56.8 kg CO₂!",
    time: "Yesterday",
    read: true,
  },
];

const typeConfig = {
  success: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  info:    { icon: Info,          color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  charge:  { icon: Zap,           color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

interface Props {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <div
      className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col animate-slide-in-right"
      style={{
        background: "rgba(5, 11, 18, 0.97)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-white/70" />
          <span className="font-bold text-white text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "#10b981", color: "#000" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/25 space-y-2">
            <Bell size={32} className="opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="relative rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03]"
                  style={{
                    background: n.read ? "rgba(255,255,255,0.02)" : cfg.bg,
                    border: `1px solid ${n.read ? "rgba(255,255,255,0.05)" : cfg.color + "33"}`,
                  }}
                >
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}22`, border: `1px solid ${cfg.color}33` }}
                    >
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white">{n.title}</span>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                        )}
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{n.message}</p>
                      <span className="text-xs text-white/25 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="absolute top-3 right-3 p-1 rounded text-white/20 hover:text-white/60 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <button
          onClick={() => setNotifications([])}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/60 glass border border-white/5 hover:bg-white/5 transition-all duration-200"
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>
    </div>
  );
}
