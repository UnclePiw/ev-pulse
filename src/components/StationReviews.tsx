"use client";

import { useState } from "react";
import { Star, MessageSquare, ThumbsUp, Send, User } from "lucide-react";

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  tags: string[];
}

const MOCK_REVIEWS: Record<string, Review[]> = {
  "st-001": [
    { id: "r1", author: "Thanapat K.", avatar: "TK", rating: 5, comment: "Super fast DC charging, 150kW delivers! Cable length is good. Parking shaded.", date: "2 days ago", likes: 12, tags: ["Fast", "Clean", "Shaded"] },
    { id: "r2", author: "Siriporn M.", avatar: "SM", rating: 4, comment: "Good location in Siam. Gets busy on weekends — recommend going early morning.", date: "5 days ago", likes: 7, tags: ["Convenient", "Busy"] },
    { id: "r3", author: "Nattapong R.", avatar: "NR", rating: 5, comment: "Best charging hub in BKK. App connects instantly. Staff very helpful.", date: "1 week ago", likes: 18, tags: ["Fast", "Staff", "App"] },
  ],
  "st-002": [
    { id: "r4", author: "Warisa T.", avatar: "WT", rating: 4, comment: "Quiet parking lot, easy to find. Rate is the best in Sukhumvit area.", date: "3 days ago", likes: 5, tags: ["Cheap", "Quiet"] },
  ],
  "st-003": [
    { id: "r5", author: "Krisada L.", avatar: "KL", rating: 5, comment: "250kW beast! Charged Model 3 from 10% to 80% in 22 mins. Insane.", date: "1 day ago", likes: 31, tags: ["Ultra Fast", "Reliable"] },
    { id: "r6", author: "Piyarat V.", avatar: "PV", rating: 3, comment: "Good speed but hard to find first time. Signage could be better.", date: "4 days ago", likes: 3, tags: ["Signage"] },
  ],
  "st-004": [],
  "st-005": [
    { id: "r7", author: "Sunisa B.", avatar: "SB", rating: 5, comment: "Love this spot! Beach view while charging. Perfect for a 30-min break.", date: "2 days ago", likes: 22, tags: ["View", "Chill", "Convenient"] },
  ],
  "st-006": [
    { id: "r8", author: "Arkan P.", avatar: "AP", rating: 4, comment: "Handy at the airport. Got to 85% during the wait for our flight.", date: "1 week ago", likes: 9, tags: ["Airport", "Convenient"] },
  ],
};

interface Props { stationId: string; }

function StarRow({ rating, interactive = false, onChange }: {
  rating: number; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map((i) => (
        <Star key={i}
          size={interactive ? 18 : 12}
          fill={(hover || rating) >= i ? "#fbbf24" : "none"}
          stroke={(hover || rating) >= i ? "#fbbf24" : "var(--text-3)"}
          style={{ cursor: interactive ? "pointer" : "default", transition: "all 0.1s" }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}

export default function StationReviews({ stationId }: Props) {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS[stationId] ?? []);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const submit = () => {
    if (!newComment.trim() || newRating === 0) return;
    const r: Review = {
      id: `r-${Date.now()}`,
      author: "You",
      avatar: "ME",
      rating: newRating,
      comment: newComment,
      date: "just now",
      likes: 0,
      tags: [],
    };
    setReviews([r, ...reviews]);
    setNewComment("");
    setNewRating(0);
    setShowForm(false);
  };

  const toggleLike = (id: string) => {
    setLikedIds((p) => {
      const s = new Set(p);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
    setReviews((prev) => prev.map((r) =>
      r.id === id ? { ...r, likes: r.likes + (likedIds.has(id) ? -1 : 1) } : r
    ));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 800, color: "#fbbf24", letterSpacing: "-0.04em" }}>{avgRating || "—"}</div>
          <div>
            <StarRow rating={avgRating} />
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => setShowForm(!showForm)}>
          <MessageSquare size={12} /> Write Review
        </button>
      </div>

      {/* New review form */}
      {showForm && (
        <div style={{ padding: 14, borderRadius: "var(--r-md)", background: "var(--bg-2)", border: "1px solid var(--border-hi)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>Your Rating</div>
          <StarRow rating={newRating} interactive onChange={setNewRating} />
          <textarea className="ev-input" placeholder="Share your experience…" value={newComment}
            onChange={(e) => setNewComment(e.target.value)} rows={2} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-accent" style={{ fontSize: 10 }} onClick={submit} disabled={!newComment.trim() || newRating === 0}>
              <Send size={11} /> Submit
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: "var(--text-3)" }}>
          No reviews yet. Be the first!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ padding: "12px 14px", borderRadius: "var(--r-md)", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--border-acc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
                    {r.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{r.author}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{r.date}</div>
                  </div>
                </div>
                <StarRow rating={r.rating} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 8 }}>{r.comment}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {r.tags.map((t) => (
                    <span key={t} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-acc)", letterSpacing: "0.04em" }}>{t}</span>
                  ))}
                </div>
                <button onClick={() => toggleLike(r.id)}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 10, color: likedIds.has(r.id) ? "var(--accent)" : "var(--text-3)", transition: "color 0.15s" }}>
                  <ThumbsUp size={11} fill={likedIds.has(r.id) ? "currentColor" : "none"} />
                  {r.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
