# Backend Requests — Smart Chat V2

**Created:** 24 Feb 2026
**From:** Frontend Team
**Purpose:** Backend changes needed to unblock remaining frontend work

---

## CRITICAL (Blocks core features)

### 1. Add `assigned_executive_id` filter to `fetch_all_chats`

**Blocks:** "My Chats" tab — currently shows ALL chats instead of executive's assigned chats only.

- The `fetch_all_chats` handler currently accepts: `status`, `customer_type`, `search`, `tag`, `sender`, `page`, `page_size`
- **Need:** Add optional `assigned_executive_id` parameter
- When provided, add to the `$match` stage: `{ assigned_executive_id: <value> }`
- When absent, return all chats (existing behavior for "All Chats" tab)
- Frontend already sends this parameter — backend just ignores it today

---

### 2. Add `POST /api/auth/refresh` endpoint

**Blocks:** Session continuity — currently sessions break silently after JWT expires.

- Login already returns `refreshToken` (7-day lifetime) but there's no endpoint to use it
- **Need:** `POST /api/auth/refresh`
  - Request: `{ refreshToken: string }`
  - Response: `{ accessToken: string, refreshToken: string }`
  - Validate the refresh token, issue new access + refresh token pair
  - Reject expired or revoked refresh tokens with 401

---

### 3. Enrich `new_message` WebSocket broadcast payload

**Blocks:** Media messages (images, documents, audio) display as empty bubbles in real-time.

Current `new_message` payload:
```json
{ "chat_id", "sender", "sender_type", "message", "datetime" }
```

**Need to add:**
```json
{ "media_type", "media", "mediaUrl", "channel", "message_id" }
```

- `media_type`: `"image"`, `"document"`, `"audio"`, `"video"`, or `null`
- `media`: media identifier/path
- `mediaUrl`: direct download URL (or null)
- `channel`: `"whatsapp"` or `"inapp"`
- `message_id`: unique message identifier

---

### 4. Standardize `config_response` payload

**Blocks:** WhatsApp service window enforcement — textarea show/hide depends on this.

Current response varies between V1 and V2 format. **Need consistent V2 response:**
```json
{
  "status": 1,
  "chat_id": "string",
  "isFreshChat": 0 | 1,
  "isWhatsappChatOpen": 0 | 1,
  "isChatInitiated": 0 | 1,
  "config": {
    "customer": "string",
    "name": "string",
    "email": "string",
    "city": "string"
  }
}
```

- `isWhatsappChatOpen` must be derived from `last_incoming_whatsapp_message` timestamp (open if < 24h ago)
- Currently the frontend falls back to `isWhatsappChatOpen = 1` (always open) when the field is missing

---

## HIGH PRIORITY

### 5. Verify `reassign_chat` WebSocket handler exists

Frontend emits: `reassign_chat` with `{ chat_id, executive_id }`

**Need confirmation:**
- Does `events.py` have a handler for this event?
- Does it update `assigned_executive_id` in MongoDB?
- Does it broadcast `chat_reassigned` to the room?

The Feature Audit only covers auto-reassignment (when going offline). Manual reassignment via UI is untested.

---

### 6. Enrich `room_update` WebSocket broadcast payload

Current payload:
```json
{ "chat_id", "customer", "customer_name", "last_message", "last_message_time", "last_interaction_by" }
```

**Need to add:**
```json
{ "customer_type", "unseen_count", "assigned_executive_id", "tags", "last_incoming_message_time" }
```

- `unseen_count`: needed for unread badge on chat list items
- `assigned_executive_id`: needed to show assignment in chat list
- `tags`: needed for tag pills on chat list items
- `last_incoming_message_time`: needed for SLA timer calculation

---

### 7. Align field name mismatches

| Where | Backend sends | Frontend expects | Fix |
|-------|--------------|-----------------|-----|
| `dashboard_stats` response | `awaiting_customer_response` | `pending` | Rename to `pending` OR add alias |
| `fetch_all_chats_response` pagination | `total` | `total_chats` | Rename to `total_chats` OR add alias |
| `fetch_chats_by_user_response` | `messages[]` | `chats[]` (V1) / `messages[]` (V2) | Confirm V2 uses `messages` consistently |

---

### 8. Add `POST /api/auth/logout` endpoint

Currently logout calls the legacy Node.js admin API (`/logout`).

**Need:** `POST /api/auth/logout`
- Request: `{ token: string }` (or read from Authorization header)
- Action: Invalidate the JWT (e.g., add to Redis blacklist with TTL = remaining token lifetime)
- Response: `{ status: 1, message: "Logged out" }`

---

## MEDIUM PRIORITY

### 9. Clarify `remove_tag` vs unified `apply_tag`

Frontend emits TWO events:
- `apply_tag` with `{ chat_id, tag }`
- `remove_tag` with `{ chat_id, tag }`

API docs describe ONE event: `apply_tag` with `{ chat_id, tag, action: "add" | "remove" }`

**Need clarification:** Does the backend handle `remove_tag` as a separate event? Or should frontend change to use `apply_tag` with `action: "remove"`?

---

### 10. WebSocket `auth.token` vs `query.token`

API docs (Section 3.1) say: use `auth: { token }` for Socket.IO connection.
Frontend currently uses: `query: { token }`.

**Need confirmation:** Does the backend validate `auth.token`, `query.token`, or both?
Frontend will switch to `auth.token` — please ensure backend accepts it.

---

### 11. Verify these 6 REST endpoints exist on V2 backend

These are called by the frontend but not in API_DOCUMENTATION.md:

| Endpoint | Purpose | Frontend uses it for |
|----------|---------|---------------------|
| `POST /api/chats/chat_gpt` | AI suggested reply | ChatGPT button in conversation |
| `GET /api/whatsapp/downloadmedia/{mediaId}` | Media download | Rendering images/docs in chat |
| `GET /api/chats/{customerNumber}/context-history` | Context timeline | Context History panel |
| `GET /api/chats/{customerNumber}/rides` | Upcoming rides | Rides panel |
| `GET /api/chats/{chatId}/notes` | Internal notes | Notes panel |
| `GET /api/templates?stakeholder={type}` | WhatsApp templates | Template picker |

**Need:** Confirm each works on V2 backend. If any are missing, they need to be built.

---

### 12. Verify these WebSocket events have handlers

| Client emits | Server broadcasts | Documented? | Status |
|-------------|-------------------|-------------|--------|
| `reassign_chat` | `chat_reassigned` | No | Verify handler exists |
| `add_note` | `note_added` | No | Verify handler exists |
| `typing` | `user_typing` | No | Verify handler exists |
| `join_room` | — | No | Verify handler exists (or is it auto-joined?) |

---

## LOW PRIORITY (Nice to have)

### 13. Add `service_window_closed` WebSocket event

Currently service window is REST-only. No real-time push when a customer's 24h window expires.

**Suggestion:** Background task emits `service_window_closed` with `{ chat_id, customer_number }` when window expires. Allows frontend to update UI without polling.

---

### 14. `rateChat` endpoint expects `executive_id`

API docs say `POST /api/chats/{chat_id}/rate` requires `{ executive_id, rating }`.
Frontend currently sends only `{ rating }`.

**Need confirmation:** Is `executive_id` required or optional? If required, frontend will add it.

---

### 15. DCO status filters in `fetch_all_chats`

V1 supported filtering by user status via `$lookup` with users collection:
- `Active_Approved`, `Pending`, `InJourney`, `Suspend`

**Need:** Optional `user_status` parameter in `fetch_all_chats` for Partner stakeholder type. Frontend has dedicated DCO view components that need these filters.

---

### 16. Include `created_at` in chat list response

`fetch_all_chats_response` does not include chat creation timestamp.

**Need:** Add `created_at` field to each chat object. Useful for displaying chat age and sorting.

---

### 17. `driver-chat-stats` event — still needed?

Frontend listens for `driver-chat-stats` but this event is not documented anywhere.

**Need clarification:** Is this a V1 legacy event? Should frontend remove the listener, or does V2 still emit it?

---

---

## NEW FINDINGS (from V2 field mapping debug — 24 Feb 2026)

The following issues were discovered while debugging chat list data display against the V2 backend. Frontend has added normalization layers, but backend alignment would be cleaner.

---

### 18. `sender_type` value: "Executive" vs "Agent"

**Issue:** V2 backend sends `sender_type: "Executive"` in message payloads. V1 frontend convention uses `type: "Agent"`.

**Frontend workaround:** We now normalize `"Executive"` → `"Agent"` in the conversation component. But if backend could send `"Agent"` (or accept both in `send_message`), it would simplify the mapping.

**Suggestion:** Either:
- (a) Backend sends `"Agent"` instead of `"Executive"` in `sender_type` for messages sent by executives
- (b) Document that V2 uses `"Executive"` (already done in API docs) — frontend will continue normalizing

---

### 19. Login response missing `name` field

**Issue:** V2 `POST /api/auth/login` returns `{ accessToken, refreshToken, agentNumber, adminid }` but no `name` or `executive_name` field. Frontend needs the executive's display name for the assigned executive indicator.

**Frontend workaround:** We fall back to the username from the login form. But the display name (e.g., "John Doe") would be better.

**Suggestion:** Add `name` or `executive_name` to the login response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "agentNumber": "919876543210",
  "adminid": "admin_001",
  "name": "John Doe"
}
```

---

### 20. `dashboard_stats` REST endpoint wraps data in `data: {}` object

**Issue:** The `GET /api/dashboard/stats` REST endpoint returns:
```json
{ "status": 1, "data": { "active": 42, "resolved": 187, "awaiting_customer_response": 8 } }
```

But the `dashboard_stats` WebSocket broadcast sends flat:
```json
{ "active": 41, "resolved": 188, "awaiting_customer_response": 7 }
```

**Frontend workaround:** We handle both formats now (unwrap `data: {}` if present).

**Suggestion:** Make both REST and WebSocket return the same shape. Flat is simpler:
```json
{ "active": 42, "resolved": 187, "pending": 8 }
```

---

### 21. `chat_assigned` broadcast missing `executive_name`

**Issue:** `chat_assigned` broadcasts `{ chat_id, assigned_executive_id }` but no `executive_name`. The chat list and conversation header display the assigned executive's name.

**Frontend workaround:** We show the ID when name is unavailable, but this isn't user-friendly.

**Suggestion:** Include `assigned_executive_name` (or `executive_name`) in the `chat_assigned` and `chat_reassigned` broadcast payloads:
```json
{
  "chat_id": "...",
  "assigned_executive_id": "agent_john",
  "assigned_executive_name": "John Doe"
}
```

---

### 22. `fetch_all_chats_response` should include `assigned_executive_name`

**Issue:** The chat list template shows the assigned executive's name, but V2 response only includes `assigned_executive_id`.

**Suggestion:** Add `assigned_executive_name` to each chat object in `fetch_all_chats_response`:
```json
{
  "chat_id": "...",
  "assigned_executive_id": "agent_john",
  "assigned_executive_name": "John Doe",
  ...
}
```

This would require a `$lookup` from the executives collection during the aggregation.

---

## Summary

| Priority | Count | Items |
|----------|-------|-------|
| CRITICAL | 4 | `assigned_executive_id` filter, auth refresh, `new_message` payload, `config_response` format |
| HIGH | 4 | Verify `reassign_chat`, enrich `room_update`, field name alignment, logout endpoint |
| MEDIUM | 4 | `remove_tag` clarification, `auth.token` transport, verify 6 REST endpoints, verify 4 WebSocket events |
| LOW | 5 | Service window push event, `rateChat` body, DCO filters, `created_at` field, `driver-chat-stats` cleanup |
| NEW (from debug) | 5 | `sender_type` value, login missing `name`, stats `data` wrapper, `chat_assigned` missing name, `fetch_all_chats` missing name |

**Total: 22 items for backend team**

---

*Generated from cross-referencing: API_DOCUMENTATION.md, API_MAPPING.md, FEATURE_AUDIT.md, FRONTEND_TASKS.md, BUSINESS_REQUIREMENTS.md, and actual frontend codebase.*
*Updated: 24 Feb 2026 — added items #18-22 from V2 field mapping debug session.*
