# Visual Fix Prompt — Post-Deploy Gap Analysis

**Source:** Screenshots of deployed V2 frontend vs `smart-chat-v2-final.jsx` design prototype
**Priority:** Fix all issues below. Compile after each section.

---

## 1. LAYOUT WIDTH RATIOS (Critical)

Current layout is wrong. Fix the 3-panel widths:

```
Chat List : Conversation : Right Panel
  1x      :    1.7x      :   remaining (flexible, min 310px)
```

**Specific values:**
- Chat list: `320px` (fixed)
- Conversation: `544px` (1.7 × 320px, or use `flex: 1.7`)
- Right panel: `flex: 1` (takes remaining space, minimum 310px)

The right panel (info/actions) needs MORE space than currently shown. The conversation panel needs LESS.

---

## 2. HEADER FIXES

- [ ] Stats show 0/0/0 even when chats are loaded — debug: is `dashboard_stats` event being received? Is the REST fallback `/api/dashboard/stats` being called on page load?
- [ ] Header looks correct otherwise — SC badge, Smart Chat V2, Online toggle, theme, bell, avatar all present ✅

---

## 3. CHAT LIST — MISSING ELEMENTS

These elements from the design are missing. Add them in order:

- [ ] **Search bar** — below My Chats/All Chats tabs. Input with search icon, rounded 9px, bg `var(--bg)`, border. Emits `search_chat` or filters `fetch_all_chats`.
- [ ] **Active / Resolved filter tabs** — below search bar. Two buttons: "Active (N)" / "Resolved (N)". Selected = accent glow + accent border.
- [ ] **Type filter pills** — below status tabs. Row: All / Partner / Customer / Vendor / SRDP. Selected = solid accent, unselected = transparent muted.
- [ ] **Online executives bar** — below type filters. "Online:" label + mini avatars (26px, rounded 7px) with green dot.
- [ ] **Unseen count badges** — red circle badge on avatar top-right, showing unread message count
- [ ] **Customer name display** — currently showing only phone numbers. Show customer name as primary (bold), phone number + type below it (muted). Fall back to phone if no name.
- [ ] **Assigned executive indicator** — small avatar/initials on right side of each chat item

Note: These elements exist in the design prototype and were built in Phase 2-3. They may just need to be visible/enabled in the current page templates.

---

## 4. CONVERSATION PANEL FIXES

- [ ] **Chat header** — missing: customer name, type label, assigned executive name with user icon. Currently only shows "Chat with {number}". Should show: avatar + "Chat with {number}" + name · type + assigned exec.
- [ ] **SLA timer in header** — showing correctly with ESCALATED ✅ but consider: cap display at a reasonable max (e.g. "99:59+ ESCALATED" instead of "1362:37") for very old chats
- [ ] **Tags bar** — "Awaiting Customer Response" tag showing ✅, "+ Add Tag" button showing ✅
- [ ] **Message bubbles** — functional but need styling fixes:
  - Customer messages (left): need rounded `12px 12px 12px 3px`, surface bg with border
  - Agent messages (right): should be gradient bg (`var(--accent)` → `#7C3AED`), rounded `12px 12px 3px 12px`
  - Currently both look similar — need more visual distinction
  - Time overlapping message text — move time below message, right-aligned, smaller opacity
- [ ] **Image handling** — "[image]" text and broken image icon showing. Need to render actual image via media download endpoint or show a proper placeholder
- [ ] **Date separators** — "Today" pill showing ✅ but should be centered pill with surface bg + border
- [ ] **Template button** — missing from left side of input bar. Should be a 36px icon button that toggles template picker.
- [ ] **Send button** — gradient styling needed (accent → purple), currently flat purple

---

## 5. RIGHT PANEL FIXES

- [ ] **Icon bar visible** ✅ — 5 icons showing on right edge
- [ ] **Icon bar position** — should be LEFT edge of right panel (between conversation and content area), not right edge of screen
- [ ] **Panel content not visible** — click any icon, the content area should expand and show the tab content (Profile, Rides, Context, Actions, Notes). Currently appears collapsed or empty.
- [ ] **Panel width** — needs to be wider per the layout ratios above. Currently too narrow.
- [ ] **Active indicator** — blue left bar on selected icon should be visible

---

## 6. GLOBAL FIXES

- [ ] **Footer "Oneway Cab © 2024"** — remove entirely. V2 has no footer.
- [ ] **Sidebar** — removed in latest screenshot ✅ (was showing in first screenshot, may have been a different page/route)
- [ ] **Stats counters** — Active/Resolved/Pending all showing 0. Either:
  - `dashboard_stats` WebSocket event not being consumed, OR
  - REST endpoint `/api/dashboard/stats` not called on init, OR
  - Response mapping still broken (V2 field mismatch)
- [ ] **Font check** — confirm DM Sans and JetBrains Mono are loading from Google Fonts. Timer text should be JetBrains Mono (monospace).

---

## EXECUTION ORDER

1. Layout width ratios (biggest visual impact)
2. Footer removal
3. Chat list missing elements (search, filters, badges, names)
4. Conversation panel styling (bubbles, header, images)
5. Right panel (icon bar position, content rendering, width)
6. Stats counter debug
7. Font verification

Compile after each step. Reference `smart-chat-v2-final.jsx` for exact visual targets.
