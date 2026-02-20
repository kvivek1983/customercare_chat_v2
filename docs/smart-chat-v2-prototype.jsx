import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────
const MOCK_EXECUTIVES = [
  { id: "exec_01", name: "Priya Sharma", avatar: "PS", online: true, chats: 8 },
  { id: "exec_02", name: "Rahul Verma", avatar: "RV", online: true, chats: 5 },
  { id: "exec_03", name: "Anita Patel", avatar: "AP", online: false, chats: 0 },
  { id: "exec_04", name: "Vikram Singh", avatar: "VS", online: true, chats: 3 },
];

const TAGS = {
  Partner: ["Payment Issue", "Document Pending", "Route Query", "App Bug", "Vehicle Issue"],
  Customer: ["Booking Help", "Refund Request", "Driver Complaint", "Fare Dispute", "Cancellation"],
  Vendor: ["Fleet Update", "Payment Delay", "Agreement", "Vehicle Registration"],
  SRDP: ["Route Assignment", "Delivery Issue", "Payment Query"],
};

const MOCK_CHATS = [
  { id: "c1", customer: "9898282704", name: "Y K Singh", type: "Partner", status: "active", lastMsg: "greetings..please do allow a min", time: "1:43 PM", unseen: 3, assignedTo: "exec_01", tags: ["Document Pending"], slaStart: Date.now() - 90000, rating: null, context: { documents_status: "Pending", dco_status: "Active" } },
  { id: "c2", customer: "9403932696", name: "Amit Patel", type: "Customer", status: "active", lastMsg: "The advance of ₹ 666/- wa...", time: "1:43 PM", unseen: 10, assignedTo: "exec_02", tags: ["Fare Dispute"], slaStart: Date.now() - 45000, rating: null, context: { booking_status: "Upcoming" } },
  { id: "c3", customer: "9765493935", name: "Ravi Kumar", type: "Partner", status: "active", lastMsg: "I sincerely apologize for...", time: "1:42 PM", unseen: 4, assignedTo: "exec_01", tags: ["App Bug", "Route Query"], slaStart: Date.now() - 160000, rating: null, context: { documents_status: "Approved", dco_status: "Active" } },
  { id: "c4", customer: "9987546679", name: "Suresh M", type: "Vendor", status: "active", lastMsg: "Hii", time: "1:42 PM", unseen: 4, assignedTo: null, tags: [], slaStart: Date.now() - 200000, rating: null, context: { fleet_status: "Active" } },
  { id: "c5", customer: "9512898922", name: "Deepak J", type: "Customer", status: "active", lastMsg: "asking more money", time: "1:41 PM", unseen: 10, assignedTo: "exec_04", tags: ["Refund Request"], slaStart: Date.now() - 30000, rating: null, context: { booking_status: "Completed" } },
  { id: "c6", customer: "9819269504", name: "Manoj T", type: "SRDP", status: "active", lastMsg: "One way...start at 6am", time: "1:39 PM", unseen: 5, assignedTo: "exec_02", tags: ["Route Assignment"], slaStart: Date.now() - 120000, rating: null, context: { route_status: "Assigned" } },
  { id: "c7", customer: "9096629727", name: "Kiran B", type: "Partner", status: "resolved", lastMsg: "we have raised the ticket...", time: "1:38 PM", unseen: 0, assignedTo: "exec_01", tags: ["Payment Issue"], slaStart: null, rating: 4, context: { documents_status: "Approved", dco_status: "Active" } },
  { id: "c8", customer: "8295893566", name: "Pooja R", type: "Customer", status: "resolved", lastMsg: "what is the status on cab...", time: "1:36 PM", unseen: 0, assignedTo: "exec_04", tags: ["Booking Help"], slaStart: null, rating: 5, context: { booking_status: "Completed" } },
];

const MOCK_MESSAGES = [
  { id: "m1", sender: "9898282704", type: "Customer", message: "Now showing fare for Gandhinagar as 1399/- but when I hired from Gandhinagar, screen was showing 1249/-", time: "04:17 PM", date: "18 Feb", seen: true },
  { id: "m2", sender: "agent", type: "Agent", message: "Hi Y K Singh, 👋 Welcome to OneWay.Cab Support — we're here for you anytime.", time: "12:01 PM", date: "Yesterday", seen: true },
  { id: "m3", sender: "9898282704", type: "Customer", message: "Please give details", time: "01:40 PM", date: "Today", seen: true },
  { id: "m4", sender: "agent", type: "Agent", message: "Hi Y K Singh, 👋 Welcome to OneWay.Cab Support — we're here for you anytime.", time: "01:40 PM", date: "Today", seen: true },
  { id: "m5", sender: "9898282704", type: "Customer", message: "Cab details??", time: "01:40 PM", date: "Today", seen: false },
  { id: "m6", sender: "agent", type: "Agent", message: "greetings..please do allow a min we can check your details and update you shortly", time: "01:43 PM", date: "Today", seen: false },
];

const MOCK_CONTEXT_HISTORY = [
  { id: "ctx_1", context: { documents_status: "Pending", dco_status: "New" }, createdAt: "15 Jan 2026", chatCount: 3, status: "resolved" },
  { id: "ctx_2", context: { documents_status: "Approved", dco_status: "Active" }, createdAt: "22 Jan 2026", chatCount: 7, status: "resolved" },
  { id: "ctx_3", context: { documents_status: "Pending", dco_status: "Active" }, createdAt: "19 Feb 2026", chatCount: 2, status: "active" },
];

const MOCK_RIDES = [
  { id: "51958584", type: "One Way", route: "Vadodara → Ankleshwar", date: "19 Feb 26, 3:30 PM", status: "upcoming" },
  { id: "51957201", type: "Round Trip", route: "Vadodara → Ahmedabad", date: "20 Feb 26, 9:00 AM", status: "upcoming" },
];

// ─── ICONS (inline SVG) ──────────────────────────────────────
const Icons = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>,
  Tag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l6.58-6.58a1 1 0 0 0 0-1.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star: ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke={filled ? "#F59E0B" : "currentColor"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  X: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  Car: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.4C14.9 4 14.2 3.5 13.4 3.5h-2.8c-.8 0-1.5.5-1.9 1.1L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  History: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  Moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Bell: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

// ─── SLA TIMER COMPONENT ─────────────────────────────────────
function SLATimer({ startTime, compact = false }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isWarning = mins >= 2 && mins < 3;
  const isCritical = mins >= 3;
  const isEscalated = mins >= 10;

  const color = isEscalated ? "#EF4444" : isCritical ? "#F97316" : isWarning ? "#EAB308" : "#6EE7B7";
  const bg = isEscalated ? "rgba(239,68,68,0.12)" : isCritical ? "rgba(249,115,22,0.1)" : isWarning ? "rgba(234,179,8,0.08)" : "rgba(110,231,183,0.08)";

  if (compact) {
    return (
      <span style={{ color, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, background: bg, padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.5px" }}>
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "10px", background: bg, border: `1px solid ${color}22` }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, animation: isCritical ? "pulse 1s infinite" : "none" }} />
      <Icons.Clock />
      <span style={{ color, fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "1px" }}>
        {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
      </span>
      {isEscalated && <span style={{ color: "#EF4444", fontSize: "11px", fontWeight: 600, marginLeft: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ESCALATED</span>}
    </div>
  );
}

// ─── STAR RATING COMPONENT ───────────────────────────────────
function StarRating({ value, onChange, readOnly = false, size = "md" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? 14 : 20;

  return (
    <div style={{ display: "flex", gap: "2px", cursor: readOnly ? "default" : "pointer" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(star)}
          style={{ transition: "transform 0.15s", transform: (hover === star && !readOnly) ? "scale(1.2)" : "scale(1)" }}
        >
          <svg width={sz} height={sz} viewBox="0 0 24 24" fill={(hover || value) >= star ? "#F59E0B" : "none"} stroke={(hover || value) >= star ? "#F59E0B" : "#525252"} strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </span>
      ))}
    </div>
  );
}

// ─── TAG PILL ────────────────────────────────────────────────
function TagPill({ label, removable, onRemove, color = "default" }) {
  const colors = {
    default: { bg: "rgba(99,102,241,0.12)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
    warning: { bg: "rgba(234,179,8,0.1)", text: "#EAB308", border: "rgba(234,179,8,0.2)" },
    success: { bg: "rgba(34,197,94,0.1)", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
    danger: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  };
  const c = colors[color] || colors.default;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: "0.2px", whiteSpace: "nowrap" }}>
      {label}
      {removable && (
        <span onClick={onRemove} style={{ cursor: "pointer", marginLeft: "2px", opacity: 0.7 }}>
          <Icons.X />
        </span>
      )}
    </span>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function SmartChatV2() {
  const [darkMode, setDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showContextHistory, setShowContextHistory] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [rightPanel, setRightPanel] = useState("profile"); // profile | rides | context
  const msgEndRef = useRef(null);

  const theme = darkMode
    ? { bg: "#0A0A0F", surface: "#12121A", surfaceHover: "#1A1A25", border: "#1E1E2E", text: "#E4E4E7", textMuted: "#71717A", accent: "#6366F1", accentGlow: "rgba(99,102,241,0.15)", success: "#22C55E", warning: "#EAB308", danger: "#EF4444", cardBg: "#16161F", headerBg: "#0E0E15" }
    : { bg: "#F8FAFC", surface: "#FFFFFF", surfaceHover: "#F1F5F9", border: "#E2E8F0", text: "#1E293B", textMuted: "#64748B", accent: "#4F46E5", accentGlow: "rgba(79,70,229,0.08)", success: "#16A34A", warning: "#CA8A04", danger: "#DC2626", cardBg: "#FFFFFF", headerBg: "#FFFFFF" };

  const filteredChats = MOCK_CHATS.filter((c) => {
    if (c.status !== statusFilter) return false;
    if (typeFilter !== "All" && c.type !== typeFilter) return false;
    if (searchQuery && !c.customer.includes(searchQuery) && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    active: MOCK_CHATS.filter((c) => c.status === "active").length,
    resolved: MOCK_CHATS.filter((c) => c.status === "resolved").length,
    pending: 0,
  };

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat]);

  const getExecName = (id) => MOCK_EXECUTIVES.find((e) => e.id === id)?.name || "Unassigned";
  const getExecAvatar = (id) => MOCK_EXECUTIVES.find((e) => e.id === id)?.avatar || "??";

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 10px; }
        input::placeholder { color: ${theme.textMuted}; }
      `}</style>

      {/* ─── HEADER ─────────────────────────────────────── */}
      <div style={{ height: "60px", background: theme.headerBg, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        {/* Left: Logo + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: `linear-gradient(135deg, ${theme.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: "#fff", letterSpacing: "-0.5px" }}>SC</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.3px" }}>Smart Chat</div>
            <div style={{ fontSize: "11px", color: theme.textMuted, letterSpacing: "0.3px" }}>V2 DASHBOARD</div>
          </div>
        </div>

        {/* Center: Dashboard Stats (Gap 8) */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { label: "Active", value: stats.active, color: theme.success },
            { label: "Resolved", value: stats.resolved, color: theme.accent },
            { label: "Pending", value: stats.pending, color: theme.warning },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "8px", background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: "12px", color: theme.textMuted, fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Right: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Online/Offline Toggle (Gap 4) */}
          <div
            onClick={() => setIsOnline(!isOnline)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", background: isOnline ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)", border: `1px solid ${isOnline ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.15)"}`, transition: "all 0.3s" }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isOnline ? theme.success : theme.danger, transition: "background 0.3s", boxShadow: isOnline ? `0 0 8px ${theme.success}50` : "none" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: isOnline ? theme.success : theme.danger, letterSpacing: "0.3px" }}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {/* Theme Toggle */}
          <div onClick={() => setDarkMode(!darkMode)} style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
          </div>

          {/* Notification */}
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMuted, position: "relative" }}>
            <Icons.Bell />
            <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "16px", height: "16px", borderRadius: "50%", background: theme.danger, fontSize: "9px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
          </div>

          {/* User Avatar */}
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg, ${theme.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff" }}>PS</div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ─── LEFT PANEL: Chat List ───────────────────── */}
        <div style={{ width: "340px", borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", flexShrink: 0, background: theme.surface }}>
          {/* Search */}
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: theme.bg, border: `1px solid ${theme.border}` }}>
              <Icons.Search />
              <input
                placeholder="Search by mobile or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: theme.text, fontSize: "13px", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div style={{ display: "flex", padding: "10px 16px", gap: "6px", borderBottom: `1px solid ${theme.border}` }}>
            {["active", "resolved"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ flex: 1, padding: "7px 0", borderRadius: "8px", border: statusFilter === s ? `1px solid ${theme.accent}40` : `1px solid ${theme.border}`, background: statusFilter === s ? theme.accentGlow : "transparent", color: statusFilter === s ? theme.accent : theme.textMuted, fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit", letterSpacing: "0.3px" }}>
                {s} ({s === "active" ? stats.active : stats.resolved})
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div style={{ display: "flex", padding: "8px 16px", gap: "4px", borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap" }}>
            {["All", "Partner", "Customer", "Vendor", "SRDP"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: typeFilter === t ? theme.accent : "transparent", color: typeFilter === t ? "#fff" : theme.textMuted, fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Online Executives Bar */}
          <div style={{ padding: "8px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: theme.textMuted, fontWeight: 500, whiteSpace: "nowrap" }}>Online:</span>
            {MOCK_EXECUTIVES.filter((e) => e.online).map((e) => (
              <div key={e.id} title={`${e.name} (${e.chats} chats)`} style={{ width: "28px", height: "28px", borderRadius: "8px", background: `linear-gradient(135deg, ${theme.accent}40, ${theme.accent}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: theme.accent, position: "relative", cursor: "default" }}>
                {e.avatar}
                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "8px", height: "8px", borderRadius: "50%", background: theme.success, border: `2px solid ${theme.surface}` }} />
              </div>
            ))}
          </div>

          {/* Chat List */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {filteredChats.map((chat, i) => (
              <div
                key={chat.id}
                onClick={() => { setSelectedChat(chat); setShowRatingModal(false); }}
                style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", background: selectedChat?.id === chat.id ? theme.accentGlow : "transparent", transition: "background 0.15s", animation: `slideIn 0.2s ease ${i * 0.03}s both` }}
              >
                {/* Row 1: Avatar + Name + Time + SLA */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `linear-gradient(135deg, ${theme.accent}30, #8B5CF620)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: theme.accent, flexShrink: 0, position: "relative" }}>
                    {chat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    {chat.unseen > 0 && (
                      <div style={{ position: "absolute", top: "-4px", right: "-4px", minWidth: "18px", height: "18px", borderRadius: "9px", background: theme.danger, fontSize: "10px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{chat.unseen}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "13px", letterSpacing: "-0.2px" }}>{chat.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {chat.slaStart && <SLATimer startTime={chat.slaStart} compact />}
                        <span style={{ fontSize: "11px", color: theme.textMuted }}>{chat.time}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: "1px" }}>{chat.customer} · {chat.type}</div>
                  </div>
                </div>

                {/* Row 2: Last message */}
                <div style={{ fontSize: "12px", color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: "48px" }}>
                  {chat.lastMsg}
                </div>

                {/* Row 3: Tags + Assignment (Gap 3 + Gap 5) */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", marginLeft: "48px", flexWrap: "wrap" }}>
                  {chat.tags.map((t) => <TagPill key={t} label={t} />)}
                  {chat.assignedTo && (
                    <span style={{ fontSize: "10px", color: theme.textMuted, display: "flex", alignItems: "center", gap: "3px", marginLeft: "auto" }}>
                      <Icons.User /> {getExecAvatar(chat.assignedTo)}
                    </span>
                  )}
                  {chat.rating && <StarRating value={chat.rating} readOnly size="sm" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CENTER PANEL: Conversation ──────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: theme.surface }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `linear-gradient(135deg, ${theme.accent}30, #8B5CF620)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: theme.accent }}>
                    {selectedChat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>Chat with {selectedChat.customer}</div>
                    <div style={{ fontSize: "11px", color: theme.textMuted, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{selectedChat.name} · {selectedChat.type}</span>
                      {/* Assignment Display (Gap 3) */}
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", color: theme.accent }}>
                        <Icons.User /> {getExecName(selectedChat.assignedTo)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* SLA Timer in header (Gap 2) */}
                  <SLATimer startTime={selectedChat.slaStart} />

                  {/* Status buttons */}
                  {selectedChat.status === "active" ? (
                    <button onClick={() => setShowRatingModal(true)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: theme.success, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Resolve
                    </button>
                  ) : (
                    <span style={{ padding: "6px 14px", borderRadius: "8px", background: `${theme.success}15`, color: theme.success, fontSize: "12px", fontWeight: 600 }}>Resolved</span>
                  )}
                </div>
              </div>

              {/* Tags Bar (Gap 5) */}
              <div style={{ padding: "8px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "6px", background: theme.surface, flexWrap: "wrap" }}>
                <span style={{ color: theme.textMuted, display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}><Icons.Tag /> Tags:</span>
                {selectedChat.tags.map((t) => (
                  <TagPill key={t} label={t} removable onRemove={() => {}} />
                ))}
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowTagSelector(!showTagSelector)} style={{ padding: "3px 10px", borderRadius: "6px", border: `1px dashed ${theme.border}`, background: "transparent", color: theme.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                    + Add Tag
                  </button>
                  {showTagSelector && (
                    <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "4px", background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "8px", zIndex: 100, minWidth: "180px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeIn 0.15s" }}>
                      {(TAGS[selectedChat.type] || []).filter((t) => !selectedChat.tags.includes(t)).map((t) => (
                        <div key={t} onClick={() => setShowTagSelector(false)} style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", color: theme.text, transition: "background 0.1s" }}
                          onMouseEnter={(e) => e.target.style.background = theme.surfaceHover}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >{t}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", background: theme.bg }}>
                {MOCK_MESSAGES.map((msg, i) => {
                  const isAgent = msg.type === "Agent";
                  const showDate = i === 0 || MOCK_MESSAGES[i - 1]?.date !== msg.date;
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div style={{ textAlign: "center", margin: "16px 0 12px", fontSize: "11px", color: theme.textMuted, fontWeight: 600, letterSpacing: "0.5px" }}>
                          <span style={{ background: theme.surface, padding: "4px 14px", borderRadius: "20px", border: `1px solid ${theme.border}` }}>{msg.date}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: isAgent ? "flex-end" : "flex-start", marginBottom: "8px", animation: `slideIn 0.2s ease ${i * 0.05}s both` }}>
                        <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: isAgent ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isAgent ? `linear-gradient(135deg, ${theme.accent}, #7C3AED)` : theme.surface, color: isAgent ? "#fff" : theme.text, fontSize: "13px", lineHeight: "1.5", border: isAgent ? "none" : `1px solid ${theme.border}` }}>
                          <div>{msg.message}</div>
                          <div style={{ fontSize: "10px", marginTop: "4px", textAlign: "right", opacity: 0.6 }}>
                            {msg.time} {isAgent && (msg.seen ? "✓✓" : "✓")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Rating Modal (Gap 6) */}
              {showRatingModal && (
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${theme.border}`, background: theme.surface, display: "flex", alignItems: "center", gap: "16px", animation: "slideIn 0.2s" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Rate this conversation:</span>
                  <StarRating value={pendingRating} onChange={setPendingRating} />
                  <button onClick={() => { setShowRatingModal(false); setPendingRating(0); }} style={{ marginLeft: "auto", padding: "6px 16px", borderRadius: "8px", border: "none", background: theme.accent, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: pendingRating === 0 ? 0.4 : 1 }} disabled={pendingRating === 0}>
                    Submit & Resolve
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${theme.border}`, background: theme.surface, display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  placeholder="Type your message..."
                  style={{ flex: 1, padding: "10px 16px", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "13px", outline: "none", fontFamily: "inherit" }}
                />
                <button style={{ width: "40px", height: "40px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${theme.accent}, #7C3AED)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Icons.Send />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>
              Select a chat to start
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Profile / Rides / Context ──── */}
        {selectedChat && (
          <div style={{ width: "320px", borderLeft: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", flexShrink: 0, background: theme.surface, overflow: "auto" }}>
            {/* Panel Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, padding: "0" }}>
              {[
                { key: "profile", icon: <Icons.User />, label: "Profile" },
                { key: "rides", icon: <Icons.Car />, label: "Rides" },
                { key: "context", icon: <Icons.History />, label: "Context" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setRightPanel(tab.key)} style={{ flex: 1, padding: "12px 0", border: "none", borderBottom: rightPanel === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", background: "transparent", color: rightPanel === tab.key ? theme.accent : theme.textMuted, fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", letterSpacing: "0.3px" }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Panel */}
            {rightPanel === "profile" && (
              <div style={{ padding: "20px 16px", animation: "fadeIn 0.2s" }}>
                {/* Customer Info */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: `linear-gradient(135deg, ${theme.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 auto 10px" }}>
                    {selectedChat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{selectedChat.name}</div>
                  <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "2px" }}>{selectedChat.customer}</div>
                  <div style={{ marginTop: "6px" }}>
                    <TagPill label={selectedChat.type} color={selectedChat.type === "Partner" ? "default" : selectedChat.type === "Customer" ? "success" : selectedChat.type === "Vendor" ? "warning" : "danger"} />
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ background: theme.bg, borderRadius: "12px", padding: "14px", border: `1px solid ${theme.border}` }}>
                  {[
                    { label: "Last App Open", value: "18 Feb 2026, 11:46 AM" },
                    { label: "Joined Date", value: "22 Jun 2025, 11:33 AM" },
                    { label: "Avg Rating", value: "4.6" },
                    { label: "App Version", value: "2.35.8" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${theme.border}`, fontSize: "12px" }}>
                      <span style={{ color: theme.textMuted }}>{item.label}</span>
                      <span style={{ fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Current Context */}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: theme.textMuted, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Current Context</div>
                  <div style={{ background: theme.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${theme.border}` }}>
                    {Object.entries(selectedChat.context).map(([key, val]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "12px" }}>
                        <span style={{ color: theme.textMuted }}>{key.replace(/_/g, " ")}</span>
                        <TagPill label={val} color={val === "Active" || val === "Approved" ? "success" : val === "Pending" ? "warning" : "default"} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignment Info (Gap 3) */}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: theme.textMuted, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Assigned To</div>
                  <div style={{ background: theme.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg, ${theme.accent}40, ${theme.accent}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: theme.accent }}>
                      {getExecAvatar(selectedChat.assignedTo)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{getExecName(selectedChat.assignedTo)}</div>
                      <div style={{ fontSize: "11px", color: theme.textMuted }}>Support Executive</div>
                    </div>
                    <button style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Reassign</button>
                  </div>
                </div>
              </div>
            )}

            {/* Rides Panel (Gap 9 - Service Window) */}
            {rightPanel === "rides" && (
              <div style={{ padding: "16px", animation: "fadeIn 0.2s" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: theme.textMuted, marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Upcoming Rides</div>
                {MOCK_RIDES.map((ride) => (
                  <div key={ride.id} style={{ background: theme.bg, borderRadius: "12px", padding: "14px", border: `1px solid ${theme.border}`, marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: theme.accent }}>#{ride.id}</span>
                      <TagPill label={ride.type} color="success" />
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icons.Car /> {ride.route}
                    </div>
                    <div style={{ fontSize: "11px", color: theme.textMuted }}>{ride.date}</div>
                  </div>
                ))}

                <div style={{ fontSize: "12px", fontWeight: 600, color: theme.textMuted, marginTop: "20px", marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Search History</div>
                <div style={{ background: theme.bg, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
                  {[
                    { from: "Vadodara", to: "Ankleshwar", date: "18 Feb 26" },
                    { from: "Gandhinagar", to: "Vadodara", date: "1 Feb 26" },
                    { from: "Vadodara", to: "Ahmedabad", date: "30 Jan 26" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${theme.border}`, fontSize: "12px" }}>
                      <span style={{ fontWeight: 500 }}>{s.from} → {s.to}</span>
                      <span style={{ color: theme.textMuted }}>{s.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context History Panel (Gap 7) */}
            {rightPanel === "context" && (
              <div style={{ padding: "16px", animation: "fadeIn 0.2s" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: theme.textMuted, marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Context History</div>
                <div style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "16px" }}>
                  Each context change creates a new chat. Click to view conversation history.
                </div>
                {MOCK_CONTEXT_HISTORY.map((ctx, i) => (
                  <div key={ctx.id} style={{ background: i === MOCK_CONTEXT_HISTORY.length - 1 ? theme.accentGlow : theme.bg, borderRadius: "12px", padding: "14px", border: `1px solid ${i === MOCK_CONTEXT_HISTORY.length - 1 ? theme.accent + "30" : theme.border}`, marginBottom: "10px", cursor: "pointer", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: theme.textMuted }}>{ctx.createdAt}</span>
                      <TagPill label={ctx.status} color={ctx.status === "active" ? "success" : "default"} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                      {Object.entries(ctx.context).map(([k, v]) => (
                        <TagPill key={k} label={`${k.replace(/_/g, " ")}: ${v}`} color={v === "Active" || v === "Approved" ? "success" : v === "Pending" ? "warning" : "default"} />
                      ))}
                    </div>
                    <div style={{ fontSize: "11px", color: theme.textMuted }}>{ctx.chatCount} messages</div>
                    {i === MOCK_CONTEXT_HISTORY.length - 1 && (
                      <div style={{ fontSize: "10px", color: theme.accent, fontWeight: 600, marginTop: "4px", letterSpacing: "0.3px" }}>← CURRENT CONTEXT</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
