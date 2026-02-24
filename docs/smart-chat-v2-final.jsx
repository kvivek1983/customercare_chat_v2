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

const TEMPLATES = [
  { id: "t1", name: "Welcome Message", lang: "EN", preview: "Hi {name}, 👋 Welcome to OneWay.Cab Support..." },
  { id: "t2", name: "Issue Resolved Check", lang: "HI", preview: "क्या आपकी समस्या हल हो गई है? कृपया 1-5 रेटिंग दें" },
  { id: "t3", name: "Booking Confirmation", lang: "EN", preview: "Your booking #{id} is confirmed for {date}..." },
  { id: "t4", name: "Document Reminder", lang: "EN", preview: "Please upload your pending documents to continue..." },
];

const MOCK_CHATS = [
  { id: "c1", customer: "9898282704", name: "Y K Singh", type: "Partner", status: "active", lastMsg: "greetings..please do allow a min", time: "1:43 PM", unseen: 3, assignedTo: "exec_01", tags: ["Document Pending"], slaState: "waiting", slaStart: Date.now() - 90000, rating: null, context: { documents_status: "Pending", dco_status: "Active" }, lastMsgBy: "customer" },
  { id: "c2", customer: "9403932696", name: "Amit Patel", type: "Customer", status: "active", lastMsg: "The advance of ₹ 666/- wa...", time: "1:43 PM", unseen: 10, assignedTo: "exec_02", tags: ["Fare Dispute"], slaState: "waiting", slaStart: Date.now() - 45000, rating: null, context: { booking_status: "Upcoming" }, lastMsgBy: "customer" },
  { id: "c3", customer: "9765493935", name: "Ravi Kumar", type: "Partner", status: "active", lastMsg: "I sincerely apologize for...", time: "1:42 PM", unseen: 4, assignedTo: "exec_01", tags: ["App Bug", "Route Query"], slaState: "waiting", slaStart: Date.now() - 160000, rating: null, context: { documents_status: "Approved", dco_status: "Active" }, lastMsgBy: "customer" },
  { id: "c4", customer: "9987546679", name: "Suresh M", type: "Vendor", status: "active", lastMsg: "Hii", time: "1:42 PM", unseen: 4, assignedTo: null, tags: [], slaState: "waiting", slaStart: Date.now() - 200000, rating: null, context: { fleet_status: "Active" }, lastMsgBy: "customer" },
  { id: "c5", customer: "9512898922", name: "Deepak J", type: "Customer", status: "active", lastMsg: "asking more money", time: "1:41 PM", unseen: 10, assignedTo: "exec_04", tags: ["Refund Request"], slaState: "replied", slaStart: null, rating: null, context: { booking_status: "Completed" }, lastMsgBy: "agent" },
  { id: "c6", customer: "9819269504", name: "Manoj T", type: "SRDP", status: "active", lastMsg: "One way...start at 6am", time: "1:39 PM", unseen: 5, assignedTo: "exec_02", tags: ["Route Assignment"], slaState: "waiting", slaStart: Date.now() - 120000, rating: null, context: { route_status: "Assigned" }, lastMsgBy: "customer" },
  { id: "c7", customer: "9096629727", name: "Kiran B", type: "Partner", status: "resolved", lastMsg: "we have raised the ticket...", time: "1:38 PM", unseen: 0, assignedTo: "exec_01", tags: ["Payment Issue"], slaState: "off", slaStart: null, rating: 4, context: { documents_status: "Approved", dco_status: "Active" }, lastMsgBy: "agent" },
  { id: "c8", customer: "8295893566", name: "Pooja R", type: "Customer", status: "resolved", lastMsg: "what is the status on cab...", time: "1:36 PM", unseen: 0, assignedTo: "exec_04", tags: ["Booking Help"], slaState: "off", slaStart: null, rating: 5, context: { booking_status: "Completed" }, lastMsgBy: "agent" },
];

const MOCK_MESSAGES = [
  { id: "m1", sender: "9898282704", type: "Customer", message: "Now showing fare for Gandhinagar as 1399/- but when I hired from Gandhinagar, screen was showing 1249/-", time: "04:17 PM", date: "18 Feb", seen: true },
  { id: "m2", sender: "agent", type: "Agent", message: "Hi Y K Singh, 👋 Welcome to OneWay.Cab Support — we're here for you anytime.", time: "12:01 PM", date: "Yesterday", seen: true },
  { id: "m3", sender: "9898282704", type: "Customer", message: "Please give details", time: "01:40 PM", date: "Today", seen: true },
  { id: "m4", sender: "agent", type: "Agent", message: "Hi Y K Singh, 👋 Welcome to OneWay.Cab Support — we're here for you anytime.", time: "01:40 PM", date: "Today", seen: true },
  { id: "m5", sender: "9898282704", type: "Customer", message: "Cab details??", time: "01:40 PM", date: "Today", seen: false },
  { id: "m6", sender: "9898282704", type: "Customer", message: "greetings..please do allow a min we can check your details and update you shortly", time: "01:43 PM", date: "Today", seen: false },
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

const MOCK_NOTES = [
  { id: "n1", by: "Priya Sharma", time: "19 Feb, 1:30 PM", text: "Customer has been calling repeatedly about fare discrepancy. Needs manager escalation if not resolved today." },
  { id: "n2", by: "Rahul Verma", time: "18 Feb, 4:15 PM", text: "Checked with ops — fare was correct at time of booking. Screen glitch on customer side." },
];

// ─── ICONS ───────────────────────────────────────────────────
const I = {
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Send: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>,
  Tag: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l6.58-6.58a1 1 0 0 0 0-1.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  User: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  X: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Car: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.4C14.9 4 14.2 3.5 13.4 3.5h-2.8c-.8 0-1.5.5-1.9 1.1L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  History: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  Moon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Bell: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Zap: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  FileText: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  MessageSquare: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Shuffle: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  StickyNote: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M14 3v4a2 2 0 0 0 2 2h4"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
};

// ─── SLA TIMER ───────────────────────────────────────────────
function SLATimer({ slaState, startTime, compact = false }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (slaState !== "waiting" || !startTime) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [slaState, startTime]);

  // Off or agent already replied → no timer
  if (slaState !== "waiting" || !startTime) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isWarn = mins >= 2 && mins < 3;
  const isCrit = mins >= 3 && mins < 10;
  const isEsc = mins >= 10;

  const color = isEsc ? "#EF4444" : isCrit ? "#F97316" : isWarn ? "#EAB308" : "#34D399";
  const bg = isEsc ? "rgba(239,68,68,0.12)" : isCrit ? "rgba(249,115,22,0.10)" : isWarn ? "rgba(234,179,8,0.08)" : "rgba(52,211,153,0.08)";

  if (compact) {
    return (
      <span style={{ color, fontSize: "10px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, background: bg, padding: "2px 5px", borderRadius: "4px", letterSpacing: "0.5px", lineHeight: 1 }}>
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "8px", background: bg, border: `1px solid ${color}20` }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, animation: isCrit || isEsc ? "pulse 1s infinite" : "none" }} />
      <I.Clock />
      <span style={{ color, fontSize: "13px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: "1px" }}>
        {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
      </span>
      {isEsc && <span style={{ color: "#EF4444", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px" }}>ESCALATED</span>}
    </div>
  );
}

// ─── STAR RATING ─────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px", cursor: readOnly ? "default" : "pointer" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} onMouseEnter={() => !readOnly && setHover(s)} onMouseLeave={() => !readOnly && setHover(0)} onClick={() => !readOnly && onChange?.(s)} style={{ transition: "transform 0.15s", transform: hover === s && !readOnly ? "scale(1.25)" : "scale(1)" }}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill={(hover || value) >= s ? "#F59E0B" : "none"} stroke={(hover || value) >= s ? "#F59E0B" : "#525252"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </span>
      ))}
    </div>
  );
}

// ─── TAG PILL ────────────────────────────────────────────────
function Pill({ label, removable, onRemove, color = "default", small }) {
  const C = { default: { bg: "rgba(99,102,241,0.12)", text: "#818CF8", b: "rgba(99,102,241,0.2)" }, warning: { bg: "rgba(234,179,8,0.1)", text: "#EAB308", b: "rgba(234,179,8,0.2)" }, success: { bg: "rgba(34,197,94,0.1)", text: "#22C55E", b: "rgba(34,197,94,0.2)" }, danger: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", b: "rgba(239,68,68,0.2)" }, neutral: { bg: "rgba(113,113,122,0.1)", text: "#A1A1AA", b: "rgba(113,113,122,0.15)" } };
  const c = C[color] || C.default;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: small ? "1px 6px" : "2px 8px", borderRadius: "5px", fontSize: small ? "10px" : "11px", fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.b}`, whiteSpace: "nowrap" }}>
      {label}
      {removable && <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.7, lineHeight: 1, marginLeft: "1px" }}><I.X /></span>}
    </span>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function SmartChatV2() {
  const [dark, setDark] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [sel, setSel] = useState(MOCK_CHATS[0]);
  const [statusF, setStatusF] = useState("active");
  const [typeF, setTypeF] = useState("All");
  const [search, setSearch] = useState("");
  const [showTagDD, setShowTagDD] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [rPanel, setRPanel] = useState("profile");
  const [newNote, setNewNote] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const msgEnd = useRef(null);

  const t = dark
    ? { bg: "#08080D", s: "#101018", sh: "#171722", b: "#1C1C2C", tx: "#E4E4E7", tm: "#71717A", ac: "#6366F1", ag: "rgba(99,102,241,0.13)", ok: "#22C55E", wn: "#EAB308", er: "#EF4444", card: "#13131C", hd: "#0C0C13" }
    : { bg: "#F4F6F9", s: "#FFFFFF", sh: "#EFF1F5", b: "#E0E4EB", tx: "#1E293B", tm: "#64748B", ac: "#4F46E5", ag: "rgba(79,70,229,0.07)", ok: "#16A34A", wn: "#CA8A04", er: "#DC2626", card: "#FFFFFF", hd: "#FFFFFF" };

  const filtered = MOCK_CHATS.filter((c) => {
    if (c.status !== statusF) return false;
    if (typeF !== "All" && c.type !== typeF) return false;
    if (search && !c.customer.includes(search) && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = { active: MOCK_CHATS.filter((c) => c.status === "active").length, resolved: MOCK_CHATS.filter((c) => c.status === "resolved").length, pending: 0 };

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [sel]);

  const exec = (id) => MOCK_EXECUTIVES.find((e) => e.id === id);
  const execName = (id) => exec(id)?.name || "Unassigned";
  const execAv = (id) => exec(id)?.avatar || "—";

  // Right panel action bar items
  const rpActions = [
    { key: "profile", icon: <I.User />, tip: "Profile" },
    { key: "rides", icon: <I.Car />, tip: "Rides" },
    { key: "context", icon: <I.History />, tip: "Context" },
    { key: "actions", icon: <I.Zap />, tip: "Quick Actions" },
    { key: "notes", icon: <I.StickyNote />, tip: "Notes" },
  ];

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: t.bg, color: t.tx, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${t.b};border-radius:10px}
        input::placeholder,textarea::placeholder{color:${t.tm}}
      `}</style>

      {/* ══════ HEADER ══════ */}
      <header style={{ height: "56px", background: t.hd, borderBottom: `1px solid ${t.b}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `linear-gradient(135deg,${t.ac},#8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: "#fff" }}>SC</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.3px" }}>Smart Chat <span style={{ fontSize: "10px", color: t.ac, fontWeight: 600, letterSpacing: "0.5px" }}>V2</span></div>
          </div>
        </div>

        {/* Stats (Gap 8) */}
        <div style={{ display: "flex", gap: "5px" }}>
          {[{ l: "Active", v: stats.active, c: t.ok }, { l: "Resolved", v: stats.resolved, c: t.ac }, { l: "Pending", v: stats.pending, c: t.wn }].map((s) => (
            <div key={s.l} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 14px", borderRadius: "8px", background: `${s.c}0D`, border: `1px solid ${s.c}1A` }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.c }} />
              <span style={{ fontSize: "11px", color: t.tm, fontWeight: 500 }}>{s.l}</span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Online Toggle (Gap 4) */}
          <div onClick={() => setIsOnline(!isOnline)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 14px", borderRadius: "20px", cursor: "pointer", background: isOnline ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.07)", border: `1px solid ${isOnline ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.12)"}`, transition: "all .25s", userSelect: "none" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isOnline ? t.ok : t.er, transition: "background .25s", boxShadow: isOnline ? `0 0 6px ${t.ok}50` : "none" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: isOnline ? t.ok : t.er, letterSpacing: "0.4px" }}>{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </div>
          <div onClick={() => setDark(!dark)} style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: t.s, border: `1px solid ${t.b}`, color: t.tm }}>{dark ? <I.Sun /> : <I.Moon />}</div>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", background: t.s, border: `1px solid ${t.b}`, color: t.tm, position: "relative" }}><I.Bell /><div style={{ position: "absolute", top: "-2px", right: "-2px", width: "15px", height: "15px", borderRadius: "50%", background: t.er, fontSize: "9px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>3</div></div>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `linear-gradient(135deg,${t.ac},#8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff" }}>PS</div>
        </div>
      </header>

      {/* ══════ BODY ══════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ══════ LEFT: Chat List ══════ */}
        <div style={{ width: "320px", borderRight: `1px solid ${t.b}`, display: "flex", flexDirection: "column", flexShrink: 0, background: t.s }}>
          {/* Search */}
          <div style={{ padding: "12px 14px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 11px", borderRadius: "9px", background: t.bg, border: `1px solid ${t.b}` }}>
              <I.Search />
              <input placeholder="Search mobile or name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: t.tx, fontSize: "12px", fontFamily: "inherit" }} />
            </div>
          </div>

          {/* Status tabs */}
          <div style={{ display: "flex", padding: "6px 14px", gap: "5px" }}>
            {["active", "resolved"].map((s) => (
              <button key={s} onClick={() => setStatusF(s)} style={{ flex: 1, padding: "6px", borderRadius: "7px", border: statusF === s ? `1px solid ${t.ac}40` : `1px solid ${t.b}`, background: statusF === s ? t.ag : "transparent", color: statusF === s ? t.ac : t.tm, fontSize: "11px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit", letterSpacing: "0.3px" }}>
                {s} ({s === "active" ? stats.active : stats.resolved})
              </button>
            ))}
          </div>

          {/* Type pills */}
          <div style={{ display: "flex", padding: "4px 14px 8px", gap: "3px" }}>
            {["All", "Partner", "Customer", "Vendor", "SRDP"].map((tp) => (
              <button key={tp} onClick={() => setTypeF(tp)} style={{ padding: "3px 9px", borderRadius: "5px", border: "none", background: typeF === tp ? t.ac : "transparent", color: typeF === tp ? "#fff" : t.tm, fontSize: "10px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tp}</button>
            ))}
          </div>

          {/* Online execs */}
          <div style={{ padding: "6px 14px 8px", borderBottom: `1px solid ${t.b}`, borderTop: `1px solid ${t.b}`, display: "flex", gap: "5px", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: t.tm, fontWeight: 500, whiteSpace: "nowrap" }}>Online:</span>
            {MOCK_EXECUTIVES.filter((e) => e.online).map((e) => (
              <div key={e.id} title={`${e.name} (${e.chats})`} style={{ width: "26px", height: "26px", borderRadius: "7px", background: `${t.ac}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: t.ac, position: "relative" }}>
                {e.avatar}
                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "7px", height: "7px", borderRadius: "50%", background: t.ok, border: `1.5px solid ${t.s}` }} />
              </div>
            ))}
          </div>

          {/* Chat list */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {filtered.map((chat, i) => (
              <div key={chat.id} onClick={() => { setSel(chat); setShowRating(false); setRPanel("profile"); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${t.b}`, cursor: "pointer", background: sel?.id === chat.id ? t.ag : "transparent", transition: "background .12s", animation: `slideUp .18s ease ${i * 0.025}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "4px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `${t.ac}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: t.ac, flexShrink: 0, position: "relative" }}>
                    {chat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    {chat.unseen > 0 && <div style={{ position: "absolute", top: "-3px", right: "-3px", minWidth: "16px", height: "16px", borderRadius: "8px", background: t.er, fontSize: "9px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{chat.unseen}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "12.5px" }}>{chat.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <SLATimer slaState={chat.slaState} startTime={chat.slaStart} compact />
                        <span style={{ fontSize: "10px", color: t.tm }}>{chat.time}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: t.tm, marginTop: "1px" }}>{chat.customer} · {chat.type}</div>
                  </div>
                </div>
                <div style={{ fontSize: "11.5px", color: t.tm, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: "45px" }}>{chat.lastMsg}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "5px", marginLeft: "45px", flexWrap: "wrap" }}>
                  {chat.tags.map((tg) => <Pill key={tg} label={tg} small />)}
                  {chat.assignedTo && <span style={{ fontSize: "10px", color: t.tm, marginLeft: "auto", display: "flex", alignItems: "center", gap: "2px" }}><I.User />{execAv(chat.assignedTo)}</span>}
                  {chat.rating && <StarRating value={chat.rating} readOnly size={12} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════ CENTER: Conversation ══════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {sel ? (<>
            {/* Header */}
            <div style={{ padding: "10px 18px", borderBottom: `1px solid ${t.b}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: t.s, gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${t.ac}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: t.ac, flexShrink: 0 }}>{sel.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "13.5px" }}>Chat with {sel.customer}</div>
                  <div style={{ fontSize: "10.5px", color: t.tm, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span>{sel.name} · {sel.type}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px", color: t.ac, fontWeight: 600 }}><I.User />{execName(sel.assignedTo)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <SLATimer slaState={sel.slaState} startTime={sel.slaStart} />
                {sel.status === "active" ? (
                  <button onClick={() => setShowRating(true)} style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: t.ok, color: "#fff", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Resolve</button>
                ) : (
                  <span style={{ padding: "5px 12px", borderRadius: "7px", background: `${t.ok}12`, color: t.ok, fontSize: "11px", fontWeight: 600 }}>Resolved</span>
                )}
              </div>
            </div>

            {/* Tags bar */}
            <div style={{ padding: "6px 18px", borderBottom: `1px solid ${t.b}`, display: "flex", alignItems: "center", gap: "5px", background: t.s, flexWrap: "wrap" }}>
              <span style={{ color: t.tm, display: "flex", alignItems: "center", gap: "3px", fontSize: "11px" }}><I.Tag /></span>
              {sel.tags.map((tg) => <Pill key={tg} label={tg} removable onRemove={() => {}} />)}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowTagDD(!showTagDD)} style={{ padding: "2px 8px", borderRadius: "5px", border: `1px dashed ${t.b}`, background: "transparent", color: t.tm, fontSize: "10px", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
                {showTagDD && (
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "3px", background: t.card, border: `1px solid ${t.b}`, borderRadius: "8px", padding: "5px", zIndex: 100, minWidth: "160px", boxShadow: "0 6px 24px rgba(0,0,0,.35)", animation: "fadeIn .12s" }}>
                    {(TAGS[sel.type] || []).filter((tg) => !sel.tags.includes(tg)).map((tg) => (
                      <div key={tg} onClick={() => setShowTagDD(false)} style={{ padding: "5px 8px", borderRadius: "5px", fontSize: "11px", cursor: "pointer", color: t.tx }} onMouseEnter={(e) => (e.target.style.background = t.sh)} onMouseLeave={(e) => (e.target.style.background = "transparent")}>{tg}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "14px 18px", background: t.bg }}>
              {MOCK_MESSAGES.map((msg, i) => {
                const isAg = msg.type === "Agent";
                const showD = i === 0 || MOCK_MESSAGES[i - 1]?.date !== msg.date;
                return (
                  <div key={msg.id}>
                    {showD && <div style={{ textAlign: "center", margin: "14px 0 10px", fontSize: "10px", color: t.tm, fontWeight: 600, letterSpacing: "0.5px" }}><span style={{ background: t.s, padding: "3px 12px", borderRadius: "16px", border: `1px solid ${t.b}` }}>{msg.date}</span></div>}
                    <div style={{ display: "flex", justifyContent: isAg ? "flex-end" : "flex-start", marginBottom: "6px", animation: `slideUp .15s ease ${i * 0.04}s both` }}>
                      <div style={{ maxWidth: "68%", padding: "9px 13px", borderRadius: isAg ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: isAg ? `linear-gradient(135deg,${t.ac},#7C3AED)` : t.s, color: isAg ? "#fff" : t.tx, fontSize: "12.5px", lineHeight: "1.5", border: isAg ? "none" : `1px solid ${t.b}` }}>
                        <div>{msg.message}</div>
                        <div style={{ fontSize: "9.5px", marginTop: "3px", textAlign: "right", opacity: 0.55 }}>{msg.time}{isAg && (msg.seen ? " ✓✓" : " ✓")}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEnd} />
            </div>

            {/* Rating slide-up (Gap 6) */}
            {showRating && (
              <div style={{ padding: "12px 18px", borderTop: `1px solid ${t.b}`, background: t.s, display: "flex", alignItems: "center", gap: "14px", animation: "slideUp .18s" }}>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>Rate conversation:</span>
                <StarRating value={pendingRating} onChange={setPendingRating} />
                <button onClick={() => { setShowRating(false); setPendingRating(0); }} style={{ marginLeft: "auto", padding: "5px 14px", borderRadius: "7px", border: "none", background: t.ac, color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: pendingRating === 0 ? 0.35 : 1 }} disabled={pendingRating === 0}>Submit & Resolve</button>
              </div>
            )}

            {/* Input + template trigger */}
            <div style={{ padding: "10px 18px", borderTop: `1px solid ${t.b}`, background: t.s }}>
              {/* Template picker */}
              {showTemplates && (
                <div style={{ marginBottom: "8px", background: t.bg, borderRadius: "10px", border: `1px solid ${t.b}`, overflow: "hidden", animation: "slideUp .15s" }}>
                  <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: 600, color: t.tm, borderBottom: `1px solid ${t.b}`, letterSpacing: "0.3px" }}>TEMPLATES</div>
                  {TEMPLATES.map((tp) => (
                    <div key={tp.id} onClick={() => setShowTemplates(false)} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${t.b}`, transition: "background .1s" }} onMouseEnter={(e) => (e.currentTarget.style.background = t.sh)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>{tp.name}</span>
                        <Pill label={tp.lang} small color="neutral" />
                      </div>
                      <div style={{ fontSize: "11px", color: t.tm, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tp.preview}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={() => setShowTemplates(!showTemplates)} title="Templates" style={{ width: "36px", height: "36px", borderRadius: "8px", border: `1px solid ${t.b}`, background: showTemplates ? t.ag : "transparent", color: showTemplates ? t.ac : t.tm, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><I.MessageSquare /></button>
                <input placeholder="Type your message..." style={{ flex: 1, padding: "9px 14px", borderRadius: "9px", border: `1px solid ${t.b}`, background: t.bg, color: t.tx, fontSize: "12.5px", outline: "none", fontFamily: "inherit" }} />
                <button style={{ width: "36px", height: "36px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg,${t.ac},#7C3AED)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><I.Send /></button>
              </div>
            </div>
          </>) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: t.tm, fontSize: "13px" }}>Select a conversation</div>
          )}
        </div>

        {/* ══════ RIGHT: Quick-Access Panel ══════ */}
        {sel && (
          <div style={{ width: "310px", borderLeft: `1px solid ${t.b}`, display: "flex", flexShrink: 0, background: t.s, overflow: "hidden" }}>

            {/* Icon action bar — always visible */}
            <div style={{ width: "48px", borderRight: `1px solid ${t.b}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "8px", gap: "2px", flexShrink: 0, background: t.hd }}>
              {rpActions.map((a) => (
                <div key={a.key} onClick={() => setRPanel(a.key)} title={a.tip} style={{ width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: rPanel === a.key ? t.ac : t.tm, background: rPanel === a.key ? t.ag : "transparent", transition: "all .15s", position: "relative" }}>
                  {a.icon}
                  {rPanel === a.key && <div style={{ position: "absolute", left: 0, top: "8px", bottom: "8px", width: "2.5px", borderRadius: "0 2px 2px 0", background: t.ac }} />}
                </div>
              ))}
            </div>

            {/* Dynamic content area */}
            <div style={{ flex: 1, overflow: "auto", animation: "fadeIn .15s" }}>

              {/* ── PROFILE ── */}
              {rPanel === "profile" && (
                <div style={{ padding: "16px 14px" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `linear-gradient(135deg,${t.ac},#8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 auto 8px" }}>{sel.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{sel.name}</div>
                    <div style={{ fontSize: "12px", color: t.tm }}>{sel.customer}</div>
                    <div style={{ marginTop: "5px" }}><Pill label={sel.type} color={sel.type === "Partner" ? "default" : sel.type === "Customer" ? "success" : sel.type === "Vendor" ? "warning" : "danger"} /></div>
                  </div>
                  <div style={{ background: t.bg, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${t.b}` }}>
                    {[{ l: "Last App Open", v: "18 Feb, 11:46 AM" }, { l: "Joined", v: "22 Jun 2025" }, { l: "Avg Rating", v: "4.6" }, { l: "App Version", v: "2.35.8" }].map((r) => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${t.b}`, fontSize: "11.5px" }}><span style={{ color: t.tm }}>{r.l}</span><span style={{ fontWeight: 600 }}>{r.v}</span></div>
                    ))}
                  </div>
                  {/* Current Context */}
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "6px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Context</div>
                    <div style={{ background: t.bg, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${t.b}` }}>
                      {Object.entries(sel.context).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11px" }}>
                          <span style={{ color: t.tm }}>{k.replace(/_/g, " ")}</span>
                          <Pill label={v} small color={v === "Active" || v === "Approved" ? "success" : v === "Pending" ? "warning" : "default"} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Assignment */}
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "6px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Assigned To</div>
                    <div style={{ background: t.bg, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${t.b}`, display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${t.ac}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: t.ac }}>{execAv(sel.assignedTo)}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: "12px", fontWeight: 600 }}>{execName(sel.assignedTo)}</div><div style={{ fontSize: "10px", color: t.tm }}>Executive</div></div>
                      <button style={{ padding: "3px 8px", borderRadius: "5px", border: `1px solid ${t.b}`, background: "transparent", color: t.tm, fontSize: "10px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "3px" }}><I.Shuffle /> Reassign</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── RIDES (Gap 9) ── */}
              {rPanel === "rides" && (
                <div style={{ padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "10px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Upcoming Rides</div>
                  {MOCK_RIDES.map((r) => (
                    <div key={r.id} style={{ background: t.bg, borderRadius: "10px", padding: "12px", border: `1px solid ${t.b}`, marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "13px", fontWeight: 700, color: t.ac }}>#{r.id}</span>
                        <Pill label={r.type} small color="success" />
                      </div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, marginBottom: "3px", display: "flex", alignItems: "center", gap: "5px" }}><I.Car /> {r.route}</div>
                      <div style={{ fontSize: "10.5px", color: t.tm }}>{r.date}</div>
                    </div>
                  ))}
                  <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, margin: "16px 0 8px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Search History</div>
                  <div style={{ background: t.bg, borderRadius: "10px", border: `1px solid ${t.b}`, overflow: "hidden" }}>
                    {[{ f: "Vadodara", to: "Ankleshwar", d: "18 Feb" }, { f: "Gandhinagar", to: "Vadodara", d: "1 Feb" }, { f: "Vadodara", to: "Ahmedabad", d: "30 Jan" }].map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${t.b}`, fontSize: "11px" }}>
                        <span style={{ fontWeight: 500 }}>{s.f} → {s.to}</span><span style={{ color: t.tm }}>{s.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CONTEXT HISTORY (Gap 7) ── */}
              {rPanel === "context" && (
                <div style={{ padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "6px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Context Timeline</div>
                  <div style={{ fontSize: "10.5px", color: t.tm, marginBottom: "12px" }}>Each context change starts a new chat thread.</div>
                  {MOCK_CONTEXT_HISTORY.map((ctx, i) => {
                    const isCur = i === MOCK_CONTEXT_HISTORY.length - 1;
                    return (
                      <div key={ctx.id} style={{ background: isCur ? t.ag : t.bg, borderRadius: "10px", padding: "12px", border: `1px solid ${isCur ? t.ac + "30" : t.b}`, marginBottom: "8px", cursor: "pointer", transition: "border-color .12s", position: "relative" }}>
                        {/* Timeline dot */}
                        <div style={{ position: "absolute", left: "-18px", top: "16px", width: "8px", height: "8px", borderRadius: "50%", background: isCur ? t.ac : t.b, border: `2px solid ${t.s}` }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "10.5px", color: t.tm }}>{ctx.createdAt}</span>
                          <Pill label={ctx.status} small color={ctx.status === "active" ? "success" : "neutral"} />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "4px" }}>
                          {Object.entries(ctx.context).map(([k, v]) => <Pill key={k} label={`${k.replace(/_/g, " ")}: ${v}`} small color={v === "Active" || v === "Approved" ? "success" : v === "Pending" ? "warning" : "default"} />)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", color: t.tm }}>{ctx.chatCount} messages</span>
                          {isCur && <span style={{ fontSize: "9px", color: t.ac, fontWeight: 700, letterSpacing: "0.4px" }}>CURRENT</span>}
                          {!isCur && <span style={{ color: t.tm }}><I.ChevronRight /></span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── QUICK ACTIONS ── */}
              {rPanel === "actions" && (
                <div style={{ padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "10px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Quick Actions</div>
                  {[
                    { icon: <I.MessageSquare />, label: "Send Template", desc: "Pre-approved WhatsApp templates", action: () => setShowTemplates(true) },
                    { icon: <I.Shuffle />, label: "Reassign Chat", desc: "Transfer to another executive" },
                    { icon: <I.Check />, label: "Mark Resolved", desc: "Close this conversation", action: () => setShowRating(true) },
                    { icon: <I.FileText />, label: "Send Issue Resolved", desc: "Hindi template — ask if resolved" },
                    { icon: <I.Tag />, label: "Manage Tags", desc: "Add or remove tags", action: () => setShowTagDD(true) },
                  ].map((a, i) => (
                    <div key={i} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", marginBottom: "4px", border: `1px solid ${t.b}`, background: t.bg, transition: "border-color .12s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.ac + "40")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = t.b)}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: `${t.ac}12`, display: "flex", alignItems: "center", justifyContent: "center", color: t.ac, flexShrink: 0 }}>{a.icon}</div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600 }}>{a.label}</div>
                        <div style={{ fontSize: "10px", color: t.tm }}>{a.desc}</div>
                      </div>
                      <span style={{ marginLeft: "auto", color: t.tm }}><I.ChevronRight /></span>
                    </div>
                  ))}

                  {/* Pick-up / Drop city send */}
                  <div style={{ marginTop: "12px", fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "8px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Send Ride Info</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select style={{ flex: 1, padding: "7px 10px", borderRadius: "7px", border: `1px solid ${t.b}`, background: t.bg, color: t.tx, fontSize: "11px", fontFamily: "inherit", outline: "none" }}>
                      <option>Pick-up City</option>
                      <option>Vadodara</option>
                      <option>Ahmedabad</option>
                      <option>Pune</option>
                    </select>
                    <select style={{ flex: 1, padding: "7px 10px", borderRadius: "7px", border: `1px solid ${t.b}`, background: t.bg, color: t.tx, fontSize: "11px", fontFamily: "inherit", outline: "none" }}>
                      <option>Drop City</option>
                      <option>Mumbai</option>
                      <option>Nashik</option>
                      <option>Raipur</option>
                    </select>
                    <button style={{ padding: "7px 12px", borderRadius: "7px", border: "none", background: t.ac, color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Send</button>
                  </div>
                </div>
              )}

              {/* ── NOTES ── */}
              {rPanel === "notes" && (
                <div style={{ padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: t.tm, marginBottom: "10px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Internal Notes</div>
                  <div style={{ marginBottom: "12px" }}>
                    <textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: `1px solid ${t.b}`, background: t.bg, color: t.tx, fontSize: "12px", fontFamily: "inherit", outline: "none", resize: "vertical" }} />
                    <button style={{ marginTop: "6px", padding: "5px 14px", borderRadius: "7px", border: "none", background: newNote.trim() ? t.ac : t.b, color: newNote.trim() ? "#fff" : t.tm, fontSize: "11px", fontWeight: 600, cursor: newNote.trim() ? "pointer" : "default", fontFamily: "inherit", float: "right" }}>Save Note</button>
                    <div style={{ clear: "both" }} />
                  </div>
                  {MOCK_NOTES.map((n) => (
                    <div key={n.id} style={{ background: t.bg, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${t.b}`, marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: t.ac }}>{n.by}</span>
                        <span style={{ fontSize: "10px", color: t.tm }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: "11.5px", lineHeight: "1.5", color: t.tx }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
