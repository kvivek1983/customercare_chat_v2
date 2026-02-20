# Smart Chat V2 — Frontend Design Decisions
**Last Updated:** 19 Feb 2026

---

## Design Prototype
- File: `smart-chat-v2-final.jsx` (interactive React artifact)
- Style: Dark mode (with light toggle), DM Sans + JetBrains Mono
- Layout: 3-panel — Chat List | Conversation | Context Panel

---

## Right Panel Architecture

**Pattern:** Fixed icon bar (left edge) + swappable content area

| Icon | Tab | Current Content | Status |
|------|-----|-----------------|--------|
| 👤 | Profile | Customer info, current context, assignment + reassign | Designed |
| 🚗 | Rides | Upcoming bookings, search history | Designed |
| 🕐 | Context | Context change timeline, chat threads per context | Designed |
| ⚡ | Actions | Send template, reassign, resolve, tags, pickup/drop city | Designed |
| 📝 | Notes | Internal executive notes (add/view) | Designed |

**Future extensibility:**
- New tabs = new icon in the bar + new content block
- Content blocks per tab can evolve independently
- No redesign needed to add tabs — just append to icon bar
- Each tab's content is self-contained and designed per its specific use case

---

## SLA Timer Logic

| State | Timer | Trigger |
|-------|-------|---------|
| `waiting` | Running (green → yellow → orange → red) | Customer sends a message |
| `replied` | Hidden | Executive responds |
| `off` | Hidden | Chat resolved |

- Resets to `waiting` on every new customer message
- 0–2 min: Green | 2–3 min: Yellow | 3–10 min: Orange | 10+ min: Red + ESCALATED label
- Compact version shown in chat list, full version in conversation header

---

## Architectural Decisions

### SLA Timer Ownership: Hybrid
- **Frontend:** Calculates timer from `last_incoming_message` timestamp, displays countdown with color states
- **Backend:** Monitors SLA independently, triggers escalation events (`sla_alert`, `sla_escalated`), sends WhatsApp alerts to shift lead
- **Why hybrid:** Frontend gives smooth UX, backend ensures escalation even if exec closes browser

### Chat Reassignment: Auto + Manual
- **Auto-reassign:** Backend reassigns chat to next available online executive after configurable timeout (e.g. 10 min)
- **Manual override:** Any executive or lead can reassign anytime via Quick Actions panel
- **Flow:** SLA breach → backend auto-reassigns → emits `chat_reassigned` event → both old and new exec dashboards update

### Chat Visibility: Tab-Based
- **"My Chats" tab** (default) — only chats assigned to logged-in executive
- **"All Chats" tab** — all chats across all executives
- Tabs sit at top of chat list, above status filters
- No role system needed initially — every executive sees both tabs

---

## Key Design Decisions

1. **Verdict:** UPGRADE existing Angular 18 frontend (not rebuild)
2. **Effort estimate:** ~4 sprints (20 working days) across 4 phases
3. **Dark mode default** with light mode toggle
4. **No sticky tabs** on right panel — icon bar is always one-click access
5. **Tags** shown inline on chat list items + dedicated tag bar in conversation
6. **Rating** slides up before resolution confirmation (not a separate modal)
7. **Templates** expand inline above message input (not a separate page)
8. **Online/Offline** toggle prominent in header (default: OFFLINE)
9. **Dashboard stats** (Active/Resolved/Pending) centered in header — always visible

---

## Backend Feature Status (as of 19 Feb 2026)

**Source:** FEATURE_AUDIT.md + AUDIT_FIX_SUMMARY.md

| Feature | Backend Status | Frontend Can Use? |
|---|---|---|
| SLA 3-min alert + 10-min escalation | ✅ Built + audited | Yes — `sla_alert` event |
| Round Robin assignment | ✅ Built | Yes — `chat_assigned` event |
| Auto-reassign on offline/timeout | ✅ Built + audited | Yes — `chat_reassigned` event |
| Executive Online/Offline | ✅ Built | Yes — `executive_status` event |
| Chat tagging + awaiting auto-tag | ✅ Built | Yes — `tag_updated` event |
| Resolution + auto-message | ✅ Built (inline in events.py) | Yes |
| Rating storage | ✅ Built | Yes — `POST /{chat_id}/rate` |
| Chat fields (last_incoming, last_outgoing, etc.) | ✅ All 6 fields built | Yes |
| Background tasks (SLA, awaiting, inactivity) | ✅ All 3 running | Yes |
| **My Chats / All Chats filter** | ❌ Missing `assigned_executive_id` in `fetch_all_chats` | **BLOCKED — needs ~30 min backend fix** |
| Resolution service extraction | ⚠️ Cosmetic — works but inline | Not blocking |

**Backend action required before frontend Phase 2:**
- Add `assigned_executive_id` filter to `fetch_all_chats()` in `chat_service.py` + `events.py`

---

## Files Referenced
- `FRONTEND_V2_EVALUATION.md` — Full gap analysis and upgrade plan
- `FEATURE_AUDIT.md` — Backend feature verification
- `AUDIT_FIX_SUMMARY.md` — Post-audit fixes applied
- `BUSINESS_REQUIREMENTS.md` — V2 backend feature spec
- `PENDING_TASKS.md` — Go-live task tracker

---

*Add new design decisions here as tabs/blocks evolve.*
