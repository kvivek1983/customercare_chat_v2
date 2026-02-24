# Visual Overhaul Prompt — Smart Chat V2 Frontend

**Purpose:** Match the Angular frontend pixel-perfect to the Smart Chat V2 design prototype.
**Reference:** `smart-chat-v2-final.jsx` — THIS IS THE TARGET DESIGN.

---

## Design System

**Typography:**
- Body: `DM Sans` (Google Fonts import)
- Monospace (counters, timers, booking IDs): `JetBrains Mono` (Google Fonts import)
- No Inter, Roboto, Arial, or system fonts

**Color tokens (implement as CSS variables in `styles.scss`):**

```scss
// Dark mode (default)
:root {
  --bg: #08080D;
  --surface: #101018;
  --surface-hover: #171722;
  --border: #1C1C2C;
  --text: #E4E4E7;
  --text-muted: #71717A;
  --accent: #6366F1;
  --accent-glow: rgba(99,102,241,0.13);
  --success: #22C55E;
  --warning: #EAB308;
  --danger: #EF4444;
  --card-bg: #13131C;
  --header-bg: #0C0C13;
}

// Light mode
.light-mode {
  --bg: #F4F6F9;
  --surface: #FFFFFF;
  --surface-hover: #EFF1F5;
  --border: #E0E4EB;
  --text: #1E293B;
  --text-muted: #64748B;
  --accent: #4F46E5;
  --accent-glow: rgba(79,70,229,0.07);
  --success: #16A34A;
  --warning: #CA8A04;
  --danger: #DC2626;
  --card-bg: #FFFFFF;
  --header-bg: #FFFFFF;
}
```

**Scrollbar:** 4px thin, track transparent, thumb `var(--border)` rounded
**Animations:** `slideUp` for list items (staggered), `fadeIn` for panel switches
**Border radius:** Cards 10-12px, inputs 9px, avatars 9-10px, pills 5-6px, buttons 7-8px

---

## Component-by-Component Specifications

### 1. Header (height: 56px)

**Left:** Logo badge "SC" (32x32px, rounded 9px, gradient `var(--accent)` → `#8B5CF6`) + "Smart Chat" bold 14px + "V2" accent colored 10px

**Center:** Dashboard stats as pill counters — 3 pills side by side:
- Active: green dot + "Active" label 11px muted + count 15px bold green, JetBrains Mono
- Resolved: accent dot + "Resolved" label + count accent colored
- Pending: yellow dot + "Pending" label + count yellow
- Each pill: padding 5px 14px, rounded 8px, background `{color}0D`, border `{color}1A`

**Right:** (left to right)
- Online/Offline toggle: pill shape (rounded 20px), green bg when online / red bg when offline, pulsing dot + "ONLINE"/"OFFLINE" text 11px bold
- Theme toggle: 34x34px icon button, rounded 9px, surface bg + border
- Notification bell: 34x34px, red badge (15px circle) with count
- User avatar: 34x34px, gradient, initials 12px bold white

### 2. Chat List (width: 320px, left panel)

**Search:** 12px padding, input with search icon, rounded 9px, bg `var(--bg)`, border

**My Chats / All Chats tabs:** Above status filters. Two buttons, same style as status tabs. "My Chats" default selected.

**Status tabs:** Two buttons "active (N)" / "resolved (N)", rounded 7px, selected = accent glow bg + accent border + accent text

**Type filter pills:** Row of "All / Partner / Customer / Vendor / SRDP", selected = solid accent bg white text, unselected = transparent muted text, font 10px bold

**Online executives bar:** "Online:" label 10px + mini avatars (26x26px, rounded 7px, accent bg, initials 9px, green dot bottom-right with surface border)

**Chat list items:** (each item, border-bottom)
- Row 1: Avatar (36x36px, rounded 9px, accent tinted bg, initials 12px bold accent) with unseen badge (red, 16px circle, top-right, -3px offset, 9px bold white count). Name 12.5px bold. Right side: compact SLA timer + time 10px muted.
- Below name: phone + " · " + type, 10px muted
- Row 2: Last message truncated, 11.5px muted, margin-left 45px
- Row 3: Tag pills + assigned exec avatar (10px muted), margin-left 45px. Resolved chats show star rating.
- Selected state: `var(--accent-glow)` background
- Animation: `slideUp 0.18s ease` with staggered delay per item (i * 0.025s)

### 3. Conversation (center panel, flex: 1)

**Header:** (padding 10px 18px, surface bg, border-bottom)
- Left: Avatar (38x38px) + "Chat with {number}" 13.5px bold + name · type + assigned exec name (accent color, with user icon)
- Right: SLA timer (full version) + Resolve button (green bg, white text, rounded 7px) or "Resolved" pill

**Tags bar:** (padding 6px 18px, surface bg, border-bottom)
- Tag icon + tag pills (removable with X) + "+ Add" dashed border button
- Dropdown: surface bg, border, rounded 8px, shadow, items with hover highlight

**Messages area:** (flex 1, overflow auto, padding 14px 18px, bg `var(--bg)`)
- Date separators: centered, 10px bold muted, pill with surface bg + border, rounded 16px
- Customer messages: LEFT aligned, surface bg, border, rounded `12px 12px 12px 3px`, font 12.5px, line-height 1.5. Time 9.5px right-aligned, opacity 0.55
- Agent messages: RIGHT aligned, gradient bg (`var(--accent)` → `#7C3AED`), white text, rounded `12px 12px 3px 12px`. Time + read receipts (✓ / ✓✓)
- Animation: `slideUp 0.15s ease` staggered

**Rating slide-up:** (above input, border-top, surface bg, slideUp animation)
- "Rate conversation:" 12px bold + 5 star rating (hover scale 1.25) + "Submit & Resolve" button (accent bg, disabled at opacity 0.35 when no rating)

**Template picker:** (expandable above input, bg `var(--bg)`, rounded 10px, border)
- Header: "TEMPLATES" 11px bold muted, border-bottom
- Items: template name 12px bold + language pill (neutral color) + preview 11px muted truncated. Hover highlight.

**Input bar:** (padding 10px 18px, surface bg, border-top)
- Template button (36x36px, rounded 8px, border, toggles template picker)
- Text input (flex 1, padding 9px 14px, rounded 9px, bg `var(--bg)`, border)
- Send button (36x36px, rounded 9px, gradient accent→purple, white icon)

### 4. Right Panel (width: 310px)

**Icon action bar:** (width: 48px, border-right, flex column, header-bg, left edge of right panel)
- 5 icons vertically: Profile (user), Rides (car), Context (history/clock), Actions (zap/lightning), Notes (sticky note)
- Each: 36x36px hit area, rounded 8px, hover/active accent color + accent-glow bg
- Active indicator: 2.5px wide accent bar on left edge (absolute positioned, top 8px to bottom 8px, rounded right)

**Content area:** (flex 1, overflow auto, fadeIn animation on switch)

**Profile tab:**
- Centered: avatar (52x52px, rounded 14px, gradient) + name 14px bold + phone 12px muted + type pill
- Details grid: bg `var(--bg)`, rounded 10px, border. Rows: label muted left, value bold right, 6px padding, border-bottom between rows
- Current Context section: uppercase label 10px + context field → value pills (success/warning colored)
- Assigned To section: exec avatar (32px) + name + "Executive" subtitle + "Reassign" button with shuffle icon

**Rides tab:**
- "UPCOMING RIDES" uppercase label 10px
- Ride cards: bg, rounded 10px, border. Booking ID in JetBrains Mono 13px accent + type pill. Route with car icon 12.5px bold. Date 10.5px muted.
- "SEARCH HISTORY" section: table rows, from → to + date

**Context tab:**
- "CONTEXT TIMELINE" uppercase label + description 10.5px muted
- Context cards: bg, rounded 10px, border. Date + status pill. Context field:value pills. Message count. Current = accent-glow bg + accent border + "CURRENT" label 9px accent bold.

**Actions tab:**
- "QUICK ACTIONS" uppercase label
- Action rows: icon in 34x34px accent-tinted box + label 12px bold + description 10px muted + chevron right. Border, rounded 10px, hover = accent border. Actions: Send Template, Reassign Chat, Mark Resolved, Send Issue Resolved, Manage Tags.
- "SEND RIDE INFO" section: two select dropdowns (Pick-up / Drop city) + Send button

**Notes tab:**
- "INTERNAL NOTES" uppercase label
- Textarea (3 rows, bg, border, rounded 9px) + "Save Note" button (accent when text present, border when empty)
- Note cards: bg, rounded 10px, border. Author name 11px accent bold + time 10px muted + note text 11.5px

---

## Global Styles

- Remove all Bootstrap classes — replace with custom CSS using CSS variables
- Remove CoreUI theme dependency for colors — use the CSS variables above
- Keep CoreUI layout components (sidebar, etc.) if needed, but override colors
- No jQuery usage
- All font sizes, spacing, colors must use the tokens above
- Dark mode is default. Light mode toggled via `.light-mode` class on body.

---

## Execution Order

Work through each component one at a time:
1. Global styles (CSS variables, fonts, scrollbar, animations)
2. Header
3. Chat list (left panel)
4. Conversation (center panel)
5. Right panel (icon bar + all 5 tab contents)
6. Dark/light theme toggle wiring

After each step, confirm it compiles and visually matches `smart-chat-v2-final.jsx`.
