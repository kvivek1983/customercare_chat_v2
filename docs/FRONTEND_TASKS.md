# Smart Chat V2 — Frontend Task List

**Created:** 24 Feb 2026
**Last Audited Against Codebase:** 24 Feb 2026
**Status Legend:** `[ ]` Not started | `[~]` In progress | `[x]` Done

---

## Codebase Audit Summary

Before listing tasks, here is what the codebase audit found:

| Area | Finding |
|------|---------|
| **Conversation components** | Already merged into 1 config-driven component (NOT duplicated) |
| **Chat-list components** | Already merged into 1 reusable component (NOT duplicated) |
| **WebSocket events (all 11)** | All emits + listeners wired up in `chat.service.ts` with proper Observable caching |
| **Memory leaks** | Fixed — `takeUntilDestroyed`, `shareReplay`, blob URL tracking, timer cleanup all in place |
| **Right panel** | All 5 tabs built: Profile, Rides, Context, Actions, Notes |
| **SLA timer** | Standalone component exists with compact + full modes, color states |
| **Tag UI** | Inline in conversation — tag bar, add/remove, pills |
| **Rating UI** | Inline 5-star rating in conversation |
| **Template picker** | Inline expandable above message input |
| **My Chats / All Chats** | Tab switching in chat list |
| **Notes panel** | Built with add/view in right panel |
| **Online/Offline toggle** | In header, persisted to localStorage |
| **Dashboard stats** | Active/Resolved/Pending pills in header, real-time via WebSocket |
| **Login** | Already calls V2 `POST /api/auth/login` |
| **OnPush** | 9 of 77 components (12%) — core chat components covered |
| **`any` types** | 236 instances across 24 files |
| **jQuery** | In package.json but not imported anywhere in src/app |

---

## Phase 1: V2 Events & Core Infrastructure

### Task 1: Handle `executive_status` event
- **Status:** `[x]` DONE
- **Evidence:** `onExecutiveStatus()` in `chat.service.ts` lines 308-322. Listener with `shareReplay(1)`, includes data normalization (lowercase to uppercase status). Online executive indicators in chat list sidebar.

---

### Task 2: Online/Offline toggle button
- **Status:** `[x]` DONE
- **Evidence:** Toggle in `default-header.component.html` lines 32-40. Emits `set_executive_status`, visual states (green/red dot), persists to localStorage. Default OFFLINE on login.

---

### Task 3: Handle `dashboard_stats` event + header counters
- **Status:** `[x]` DONE
- **Evidence:** `onDashboardStats()` in `chat.service.ts` lines 298-306. Header displays Active/Resolved/Pending pills. Initial load via `GET /api/dashboard/stats`. Real-time updates via WebSocket.

---

### Task 4: Handle `sla_alert` event
- **Status:** `[x]` DONE
- **Evidence:** `onSlaAlert()` in `chat.service.ts` lines 356-364. Toastr notification on alert.
- **Minor issue:** Uses `Observable<any>` — should be typed as `SLAAlert` interface.

---

### Task 5: SLA countdown timer per chat
- **Status:** `[x]` DONE
- **Evidence:** `sla-timer.component.ts` standalone component. Compact (chat list) + full (header) modes. Color states: green/yellow/orange/red. "ESCALATED" label at 10+ min. Proper `ngOnDestroy` cleanup.

---

### Task 6: Handle `chat_assigned` event
- **Status:** `[x]` DONE
- **Evidence:** `onChatAssigned()` in `chat.service.ts` lines 324-338. Normalizes V2 `assigned_executive_id` to `executive_id`. Assignment displayed in chat list + conversation header.

---

### Task 7: Handle `chat_reassigned` event
- **Status:** `[x]` DONE
- **Evidence:** `onChatReassigned()` in `chat.service.ts` lines 340-354. Normalizes V2 `to_executive_id`/`from_executive_id`. Updates assignment in UI.

---

### Task 8: Handle `tag_updated` event
- **Status:** `[x]` DONE
- **Evidence:** `onTagUpdated()` in `chat.service.ts` lines 366-374. Updates tag badges on chat list + conversation view. Handles V1 (full array) and V2 (single tag + action) formats.

---

### Task 9: Handle `note_added` event
- **Status:** `[x]` DONE
- **Evidence:** `onNoteAdded()` in `chat.service.ts` lines 376-384. Real-time note updates in notes panel.

---

## Phase 2: V2 UI Features

### Task 10: My Chats / All Chats tabs
- **Status:** `[x]` DONE
- **Evidence:** Tab switching in `chat-number-list.component.html`. Passes `assigned_executive_id` filter to `fetch_all_chats`.

---

### Task 11: Tag apply/remove UI
- **Status:** `[x]` DONE
- **Evidence:** Tag bar in `conversations.component.html` lines 71-95. "+ Add Tag" dropdown, remove via X on pills. Emits `apply_tag`/`remove_tag` events.
- **Not a standalone component** — inline in conversation template.

---

### Task 12: Chat rating UI (1-5 star, post-resolution)
- **Status:** `[x]` DONE
- **Evidence:** 5-star inline rating in `conversations.component.html` lines 209-223. Slides up on "Resolve" click. Calls `POST /api/chats/{chatId}/rate`.
- **Not a standalone component** — inline in conversation template.

---

### Task 13: Manual chat reassignment UI
- **Status:** `[x]` DONE
- **Evidence:** "Reassign Chat" button in `quick-actions-panel.component.ts`. Emits `reassign_chat` event.
- **Possible gap:** Verify if it fetches online executives list for the dropdown.

---

### Task 14: Internal notes (Notes tab in right panel)
- **Status:** `[x]` DONE
- **Evidence:** `notes-panel.component.ts` standalone component. Fetches notes via `GET /api/chats/{chatId}/notes`. Add note form. Real-time updates via `note_added` event.

---

### Task 15: Rides tab in right panel (Service Window)
- **Status:** `[x]` DONE
- **Evidence:** `rides-panel.component.ts` standalone component. Fetches rides via `GET /api/chats/{customerNumber}/rides`. Shows upcoming rides + search history.

---

### Task 16: Service window indicators (WhatsApp 24h window)
- **Status:** `[~]` PARTIAL
- **What exists:** `isWhatsappChatOpen` flag controls textarea visibility in conversation. When closed, only template sending is allowed.
- **What's missing:**
  - [ ] REST endpoints not integrated: `GET /api/service-window/closed`, `GET /api/service-window/upcoming-rides`
  - [ ] No visual indicator on chat list items showing closed window
  - [ ] No highlight for closed-window customers with upcoming rides (high priority)
- **Currently:** Window status comes from `fetch_config` event, not the dedicated REST endpoints.

---

### Task 17: WhatsApp template picker (inline)
- **Status:** `[x]` DONE
- **Evidence:** `template-picker.component.ts` standalone component. Fetches templates via `GET /api/templates?stakeholder=X`. Expandable panel above message input. Lazy loads on first expand.

---

### Task 18: Context history view
- **Status:** `[x]` DONE
- **Evidence:** `context-history-panel.component.ts` standalone component. Fetches via `GET /api/chats/{customerNumber}/context-history`. Timeline with status indicators. Right panel Context tab.

---

### Task 19: Right panel — Profile tab
- **Status:** `[x]` DONE
- **Evidence:** Profile tab in right panel. Shows customer info, DCO panels (Partner), assignment info + reassign button.

---

### Task 20: Right panel — Actions tab
- **Status:** `[x]` DONE
- **Evidence:** `quick-actions-panel.component.ts` standalone component. 6 action buttons: Send Template, Reassign Chat, Mark Resolved, Resolved Template, Manage Tags, City Sender.

---

## Phase 3: Auth & Backend Integration

### Task 21: Login endpoint integration (V2 auth)
- **Status:** `[~]` MOSTLY DONE
- **What exists:**
  - [x] Login calls V2 `POST /api/auth/login` via `PySmartChatService.loginV2()`
  - [x] JWT stored in localStorage (`{username}-loginDetails`)
  - [x] WebSocket connects with JWT (query param: `{ token }`)
  - [x] Auth guard validates login + 60-min session timeout
- **What's missing:**
  - [ ] Token refresh mechanism (no `refreshToken` usage)
  - [ ] Backend JWT expiry validation (only client-side time check)
  - [ ] Socket.IO should use `auth.token` instead of query param (per API docs Section 3.1)
  - [ ] Logout still calls Node.js admin API (`/logout`) — should call V2 or remove

---

## Phase 4: Refactoring & Code Quality

### Task 22: Merge 4 duplicated conversation components into 1
- **Status:** `[x]` ALREADY DONE
- **Evidence:** Single `ConversationsComponent` with config-driven behavior via `CHAT_TYPE_CONFIGS`. Routes pass `customerType` in route data. Zero duplication.

---

### Task 23: Merge 4 duplicated chat-list components into 1
- **Status:** `[x]` ALREADY DONE
- **Evidence:** Single `ChatNumberListComponent` with `@Input() customerType`. Reused across all stakeholder types.

---

### Task 24: Fix subscription management & memory leaks
- **Status:** `[x]` MOSTLY DONE
- **What exists:**
  - [x] `takeUntilDestroyed(destroyRef)` used across core components (37+ instances)
  - [x] `shareReplay(1)` on all socket listeners — no re-registration
  - [x] `resetObservables()` on disconnect — no stale listeners
  - [x] Blob URLs tracked and revoked in `ngOnDestroy`
  - [x] `setInterval` cleared in `ngOnDestroy` (both sla-timer and conversations)
- **What could improve:**
  - [ ] Dashboard component uses older `ngOnDestroy` pattern instead of `takeUntilDestroyed`
  - [ ] SLA timer uses `ngOnDestroy` (fine, but could be modernized)

---

### Task 25: Type safety — remove `any` types
- **Status:** `[ ]` NOT DONE
- **Scope:** 236 instances of `any` across 24 files
- **Worst offenders:**
  - `dco-suspend-view.component.ts` — 28 instances
  - `dco-active-approved-view.component.ts` — 28 instances
  - `dco-pending-view.component.ts` — 28 instances
  - `dashboard.component.ts` — 12 instances
  - `chat-number-list.component.ts` — 8 instances
  - `conversations.component.ts` — 7+ instances (`responseData: any`, `selectedChat: any`, `chats: any`, timers typed as `any`)
- **Also:** `sla_alert` observable uses `Observable<any>` in `chat.service.ts`
- **What to do:**
  - [ ] Define proper interfaces for all data structures
  - [ ] Replace `any` in core chat components first (conversations, chat-number-list, chat.service)
  - [ ] Then DCO view components (3 files x 28 instances = quick wins if same pattern)
  - [ ] Then dashboard component
  - [ ] Consider enabling `strictNullChecks` in `tsconfig.json`

---

### Task 26: Add OnPush change detection to remaining components
- **Status:** `[~]` PARTIAL
- **Current:** 9 of 77 components use OnPush (12%)
- **Already OnPush:** conversations, chat-number-list, template-picker, notes-panel, quick-actions-panel, rides-panel, context-history-panel, right-panel-tabs, sla-timer
- **Not OnPush:** dashboard, login, header, all DCO view components, layout components
- **What to do:**
  - [ ] Add OnPush to dashboard component (frequent WebSocket updates)
  - [ ] Add OnPush to DCO view components (3 files)
  - [ ] Add OnPush to header component
  - [ ] Ensure `markForCheck()` is called after async updates

---

### Task 27: Remove jQuery + consolidate CSS frameworks
- **Status:** `[ ]` NOT DONE
- **jQuery:** Listed in `package.json` (^3.7.1) but not imported anywhere in `src/app/`. Safe to remove.
- **CSS Frameworks installed:** Bootstrap 5.3.3, CoreUI 5.2.0, Angular Material 18.2.14
- **What to do:**
  - [ ] Remove `jquery` from `package.json`
  - [ ] Audit which Bootstrap classes are used vs CoreUI equivalents
  - [ ] Consolidate where possible (CoreUI already includes Bootstrap core)
  - [ ] Verify no visual regressions

---

## Phase 5: Final Verification

### Task 28: System audit
- **Status:** `[ ]` NOT DONE
- **What to do:**
  - [ ] End-to-end test all 4 stakeholder types
  - [ ] Verify all 13 emit + 11 listen WebSocket events work
  - [ ] Verify all 10 REST endpoints respond correctly
  - [ ] Test SLA timer countdown with real backend
  - [ ] Test tag apply/remove round-trip
  - [ ] Test rating + resolve flow
  - [ ] Test reassignment flow
  - [ ] Test notes add + real-time sync
  - [ ] Test service window behavior (open vs closed)

---

## Status Dashboard

| Phase | Total | Done | Partial | Not Started |
|-------|-------|------|---------|-------------|
| Phase 1: Events | 9 | 9 | 0 | 0 |
| Phase 2: UI Features | 11 | 10 | 1 | 0 |
| Phase 3: Auth | 1 | 0 | 1 | 0 |
| Phase 4: Refactoring | 6 | 3 | 1 | 2 |
| Phase 5: Verification | 1 | 0 | 0 | 1 |
| **Total** | **28** | **22** | **3** | **3** |

---

## Remaining Work — Pick-Up Order

| Priority | Task | Status | Effort |
|----------|------|--------|--------|
| 1 | Task 16 — Service window REST endpoints + chat list indicators | `[~]` Partial | Medium |
| 2 | Task 21 — Token refresh + auth cleanup | `[~]` Partial | Small |
| 3 | Task 25 — Remove 236 `any` types | `[ ]` Not started | Large |
| 4 | Task 26 — OnPush on remaining components | `[~]` Partial | Medium |
| 5 | Task 27 — Remove jQuery + CSS consolidation | `[ ]` Not started | Small |
| 6 | Task 28 — System audit / E2E verification | `[ ]` Not started | Large |

---

*Last updated: 24 Feb 2026 — after full codebase audit*
