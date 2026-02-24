# Backend Requests — Implementation Summary

**Date:** 24 Feb 2026
**Source:** `docs/BACKEND_REQUESTS.md` (22 items from Frontend Team)
**Implemented by:** Claude Code session

---

## Overview

All 22 items from the frontend team's request document have been addressed. Of those, **16 required code changes**, **5 were confirmed as frontend-only or already working**, and **1 was deferred** as a nice-to-have.

| Category | Total | Implemented | No Backend Work | Deferred |
|----------|-------|-------------|-----------------|----------|
| CRITICAL | 4 | 4 | 0 | 0 |
| HIGH | 4 | 4 | 0 | 0 |
| MEDIUM | 4 | 2 | 2 | 0 |
| LOW | 5 | 2 | 2 | 1 |
| NEW FINDINGS | 5 | 4 | 1 | 0 |
| **Total** | **22** | **16** | **5** | **1** |

---

## Files Modified

| File | Items |
|------|-------|
| `app/auth/jwt_handler.py` | #2, #8 |
| `app/services/auth_service.py` | #2, #8, #19 |
| `app/routers/auth_router.py` | #2, #8 |
| `app/websockets/events.py` | #3, #4, #5, #6, #12, #15, #21 |
| `app/routers/websocket_router.py` | #5, #12 |
| `app/routers/whatsapp_webhook_router.py` | #3, #6 |
| `app/services/chat_service.py` | #6, #7, #15, #16, #22 |
| `app/services/dashboard_counters.py` | #7, #20 |
| `app/routers/dashboard_router.py` | #20 |
| `app/routers/chat_router.py` | #11 |
| `app/routers/whatsapp_rest_router.py` | #11 (new file) |
| `app/__init__.py` | #11 |

---

## Item-by-Item Details

### CRITICAL

#### #1 — `assigned_executive_id` filter in `fetch_all_chats`
**Status:** Already implemented
**Details:** `chat_service.py:fetch_all_chats()` already accepts `assigned_executive_id` parameter and applies it as a `$match` filter. `events.py:_handle_fetch_all_chats()` already passes `data.get("assigned_executive_id")` through. No changes needed.

---

#### #2 — `POST /api/auth/refresh` endpoint
**Status:** Implemented
**Files:** `jwt_handler.py`, `auth_service.py`, `auth_router.py`

**Changes:**
- **`jwt_handler.py`** — Added `token_type: "access"` claim to `create_access_token()`. Added new `create_refresh_token()` function with `token_type: "refresh"` and 7-day expiry.
- **`auth_service.py`** — Refactored login to use `create_refresh_token()` helper. Added `refresh_tokens()` function that validates the refresh token, rejects if `token_type != "refresh"`, and issues a new token pair.
- **`auth_router.py`** — Added `POST /api/auth/refresh` route with 30/min rate limit.

**API:**
```
POST /api/auth/refresh
Body: { "refreshToken": "<jwt>" }

200: { "accessToken": "<new>", "refreshToken": "<new>" }
400: { "detail": "refreshToken is required" }
401: { "detail": "Invalid or expired refresh token" }
401: { "detail": "Invalid token type" }
```

**Security:** Access tokens can no longer be used as refresh tokens (and vice versa) thanks to the `token_type` claim distinction.

---

#### #3 — Enrich `new_message` WebSocket broadcast
**Status:** Implemented
**Files:** `events.py`, `whatsapp_webhook_router.py`

**Changes:** All three broadcast points (Executive in-app, Customer in-app, WhatsApp inbound) now include:
```json
{
  "chat_id": "...",
  "sender": "...",
  "sender_type": "Executive|Customer",
  "message": "...",
  "media_type": "image|document|audio|video|null",
  "media_url": "https://...|null",
  "channel": "inapp|whatsapp",
  "message_id": "<ObjectId string>",
  "datetime": "2026-02-24T..."
}
```

The WhatsApp inbound broadcast additionally includes the `media` object (raw media metadata from Pinnacle).

---

#### #4 — Standardize `config_response` payload
**Status:** Implemented
**Files:** `events.py`

**Changes:** Rewrote `_handle_config()` with:
1. User profile lookup from `users` collection
2. Chat document lookup (by `chat_id`, then by `customer_type`, then most recent)
3. `isWhatsappChatOpen` derived from `last_incoming_whatsapp_message` (open if < 24h ago)
4. `isFreshChat` (0 if chat exists, 1 if not)
5. `isChatInitiated` (1 if chat exists, 0 if not)

**Response format:**
```json
{
  "status": 1,
  "chat_id": "string|null",
  "isFreshChat": 0|1,
  "isWhatsappChatOpen": 0|1,
  "isChatInitiated": 0|1,
  "config": {
    "customer": "919876543210",
    "name": "John Doe",
    "email": "john@example.com",
    "city": "Ahmedabad"
  }
}
```

---

### HIGH PRIORITY

#### #5 — `reassign_chat` WebSocket handler
**Status:** Implemented
**Files:** `events.py`, `websocket_router.py`

**Changes:** Added `_handle_reassign_chat()` handler that:
1. Validates `chat_id` and `executive_id` are provided
2. Fetches current assignment from MongoDB
3. Updates `assigned_executive_id` in `v2_chats`
4. Updates Redis tracking sets (`executive::assigned_chats::*`)
5. Updates `v2_executives` collection (pull from old, addToSet to new)
6. Looks up executive name for broadcast
7. Broadcasts `chat_reassigned` to the chat room

**Event contract:**
```
Client emits: reassign_chat { chat_id, executive_id }
Server broadcasts: chat_reassigned { chat_id, from_executive_id, to_executive_id, assigned_executive_name }
Server responds: reassign_chat_response { status: 1 }
```

Registered in `EVENT_NAMES` in `websocket_router.py`.

---

#### #6 — Enrich `room_update` broadcast
**Status:** Implemented
**Files:** `chat_service.py`, `events.py`, `whatsapp_webhook_router.py`

**Changes:** Created reusable `get_room_update_payload()` helper in `chat_service.py` that fetches the chat document and computes enriched fields. Used in both in-app (`events.py`) and WhatsApp inbound (`whatsapp_webhook_router.py`) broadcast paths.

**Enriched payload:**
```json
{
  "chat_id": "...",
  "customer": "919876543210",
  "customer_name": "John Doe",
  "customer_type": "Customer",
  "last_message": "Hello",
  "last_message_time": "2026-02-24T...",
  "last_interaction_by": "Customer",
  "last_incoming_message_time": "2026-02-24T...|null",
  "assigned_executive_id": "agent_john|null",
  "tags": ["VIP"],
  "unseen_count": 3
}
```

---

#### #7 — Field name mismatches
**Status:** Implemented
**Files:** `dashboard_counters.py`, `chat_service.py`

**Changes:**
- **Dashboard stats:** Added `"pending": awaiting` alias alongside existing `awaiting_customer_response` in both `get_counts()` and `sync_counters_from_db()`.
- **Pagination:** Added `"total_chats": total` alias alongside existing `total` in `fetch_all_chats()` pagination response.
- **`fetch_chats_by_user`:** Confirmed V2 already uses `messages` consistently. No change needed.

Both old and new field names are returned for backward compatibility.

---

#### #8 — `POST /api/auth/logout` endpoint
**Status:** Implemented
**Files:** `auth_service.py`, `auth_router.py`, `jwt_handler.py`

**Changes:**
- **`auth_service.py`** — Added `logout_user()` (blacklists token in Redis with TTL matching remaining token lifetime) and `is_token_blacklisted()` (checks Redis for blacklisted token).
- **`auth_router.py`** — Added `POST /api/auth/logout` route (10/min rate limit). Accepts token from body `{ token }` or `Authorization: Bearer <token>` header.
- **`jwt_handler.py`** — Added blacklist check in `get_current_user()` dependency. All authenticated endpoints now reject blacklisted tokens.

**API:**
```
POST /api/auth/logout
Body: { "token": "<jwt>" }  OR  Header: Authorization: Bearer <jwt>

200: { "status": 1, "message": "Logged out" }
400: { "detail": "token is required (body or Authorization header)" }
401: { "detail": "Invalid or expired token" }
```

**Redis key format:** `auth::blacklist::<token>` with TTL = remaining seconds until token expiry.

---

### MEDIUM PRIORITY

#### #9 — `remove_tag` vs unified `apply_tag`
**Status:** No backend work needed
**Details:** Backend uses unified `apply_tag` with `action: "add"|"remove"`. Frontend should use `apply_tag { chat_id, tag, action: "add" }` and `apply_tag { chat_id, tag, action: "remove" }`. There is no separate `remove_tag` event handler.

---

#### #10 — WebSocket `auth.token` vs `query.token`
**Status:** No backend work needed
**Details:** `websocket_router.py` already accepts both `auth: { token }` (preferred) and `query: { token }` (fallback). Frontend can use either.

---

#### #11 — 6 missing REST endpoints
**Status:** Implemented (all 6)
**Files:** `chat_router.py`, `whatsapp_rest_router.py` (new), `__init__.py`

| Endpoint | File | Rate Limit | Auth |
|----------|------|-----------|------|
| `POST /api/chats/chat_gpt` | `chat_router.py` | 30/min | JWT |
| `GET /api/whatsapp/downloadmedia/{media_id}` | `whatsapp_rest_router.py` | 200/min | JWT |
| `GET /api/chats/{customer_number}/context-history` | `chat_router.py` | 100/min | JWT |
| `GET /api/chats/{customer_number}/rides` | `chat_router.py` | 100/min | JWT |
| `GET /api/chats/{chat_id}/notes` | `chat_router.py` | 100/min | JWT |
| `POST /api/chats/{chat_id}/notes` | `chat_router.py` | 100/min | JWT |
| `GET /api/templates?stakeholder={type}` | `whatsapp_rest_router.py` | 100/min | JWT |

**Details:**
- `chat_gpt` — Fetches 10 recent messages for context, calls OpenAI GPT-3.5 Turbo, gracefully falls back if OpenAI is unavailable.
- `downloadmedia` — Wraps `resolve_media_url()` to resolve Pinnacle media IDs.
- `context-history` — Wraps `get_all_chats_for_customer()` from context service.
- `rides` — Queries `bookings` collection for upcoming rides.
- `notes` (GET/POST) — CRUD on `v2_notes` collection.
- `templates` — Queries `v2_whatsapp_templates` collection.

Both `wa_rest_router` and `templates_router` registered in `__init__.py` with JWT protection.

---

#### #12 — 4 WebSocket event handlers
**Status:** Implemented (3 of 4; `join_room` is auto-handled)
**Files:** `events.py`, `websocket_router.py`

| Event | Handler | Broadcasts |
|-------|---------|------------|
| `reassign_chat` | `_handle_reassign_chat` | `chat_reassigned` |
| `add_note` | `_handle_add_note` | `note_added` |
| `typing` | `_handle_typing` | `user_typing` |
| `join_room` | N/A — handled by `join_chat` / `join_chat_customer` | — |

**`add_note`** — Saves note to `v2_notes`, broadcasts `note_added { chat_id, note_id, text, author, datetime }`.

**`typing`** — Stateless broadcast of `user_typing { chat_id, sender, is_typing }` to the chat room (excludes sender).

---

### LOW PRIORITY

#### #13 — `service_window_closed` WebSocket event
**Status:** Deferred
**Details:** This requires a background scheduler that checks all active chats every minute for expired 24h windows. Implementation complexity is high relative to value — frontend already polls via the `config_response` endpoint. Can be added later as an optimization.

---

#### #14 — `rateChat` endpoint `executive_id` requirement
**Status:** No backend work needed
**Details:** `POST /api/chats/{chat_id}/rate` requires `{ executive_id, rating }`. This is confirmed as required. Frontend should include `executive_id` in the request body.

---

#### #15 — DCO status filters in `fetch_all_chats`
**Status:** Implemented
**Files:** `chat_service.py`, `events.py`

**Changes:** Added optional `user_status` parameter to `fetch_all_chats()`. When provided, a `$lookup` to the `users` collection is performed followed by `$match: { "user_info.status": user_status }`. Supports values: `Active_Approved`, `Pending`, `InJourney`, `Suspend`.

**Usage:** Frontend emits `fetch_all_chats { ..., user_status: "Active_Approved" }`.

---

#### #16 — `created_at` in chat list response
**Status:** Implemented
**Files:** `chat_service.py`

**Changes:** Added `$addFields` stage to the aggregation pipeline: `{ created_at: "$status_check_datetime" }`. Each chat object now includes a `created_at` field aliased from the existing `status_check_datetime`.

---

#### #17 — `driver-chat-stats` event
**Status:** No backend work needed
**Details:** This is a V1 legacy event. V2 does not emit it. Frontend should remove the listener.

---

### NEW FINDINGS

#### #18 — `sender_type: "Executive"` vs `"Agent"`
**Status:** No backend work needed
**Details:** V2 consistently uses `"Executive"` for sender_type. This is documented in the API docs. Frontend should continue normalizing `"Executive"` → `"Agent"` as needed. Changing the backend value would break V2 API contract.

---

#### #19 — Login response missing `name` field
**Status:** Implemented
**Files:** `auth_service.py`

**Changes:** Login response now includes `name` field extracted from the external auth response:
```python
"name": data.get("name") or data.get("executive_name") or username
```

Falls back through `name` → `executive_name` → `username` to always return a display name.

---

#### #20 — `dashboard_stats` REST response shape
**Status:** Implemented
**Files:** `dashboard_router.py`, `dashboard_counters.py`

**Changes:** REST endpoint now returns both flat and nested formats for backward compatibility:
```json
{
  "status": 1,
  "data": { "active": 42, "resolved": 187, "awaiting_customer_response": 8, "pending": 8 },
  "active": 42,
  "resolved": 187,
  "awaiting_customer_response": 8,
  "pending": 8
}
```

Frontend can use either `response.data.active` or `response.active`.

---

#### #21 — `chat_assigned` broadcast missing `executive_name`
**Status:** Implemented
**Files:** `events.py`

**Changes:** In `_handle_new_chat()`, after round-robin assignment, the handler now looks up the executive's name from `v2_executives` collection and includes it in the broadcast:
```json
{
  "chat_id": "...",
  "assigned_executive_id": "agent_john",
  "assigned_executive_name": "John Doe"
}
```

Same pattern used in `_handle_reassign_chat()` for `chat_reassigned` broadcasts.

---

#### #22 — `fetch_all_chats_response` missing `assigned_executive_name`
**Status:** Implemented
**Files:** `chat_service.py`

**Changes:** Added `$lookup` to `v2_executives` collection in the `fetch_all_chats()` aggregation pipeline, with `$addFields` to extract the name:
```js
{ $lookup: { from: "v2_executives", localField: "assigned_executive_id", foreignField: "executive_id", as: "exec_info" } }
{ $addFields: { assigned_executive_name: { $ifNull: [{ $arrayElemAt: ["$exec_info.name", 0] }, null] } } }
{ $project: { exec_info: 0 } }
```

Each chat in the response now includes `assigned_executive_name`.

---

## New API Endpoints Summary

| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|-----------|---------|
| `POST` | `/api/auth/refresh` | None | 30/min | Exchange refresh token for new token pair |
| `POST` | `/api/auth/logout` | None | 10/min | Invalidate token (Redis blacklist) |
| `POST` | `/api/chats/chat_gpt` | JWT | 30/min | AI-suggested reply |
| `GET` | `/api/whatsapp/downloadmedia/{media_id}` | JWT | 200/min | Resolve Pinnacle media URL |
| `GET` | `/api/chats/{customer_number}/context-history` | JWT | 100/min | Customer chat timeline |
| `GET` | `/api/chats/{customer_number}/rides` | JWT | 100/min | Upcoming rides for customer |
| `GET` | `/api/chats/{chat_id}/notes` | JWT | 100/min | List chat notes |
| `POST` | `/api/chats/{chat_id}/notes` | JWT | 100/min | Add chat note |
| `GET` | `/api/templates?stakeholder={type}` | JWT | 100/min | WhatsApp message templates |

## New WebSocket Events Summary

| Client Emits | Server Broadcasts | Handler |
|-------------|-------------------|---------|
| `reassign_chat { chat_id, executive_id }` | `chat_reassigned { chat_id, from_executive_id, to_executive_id, assigned_executive_name }` | `_handle_reassign_chat` |
| `add_note { chat_id, text, author }` | `note_added { chat_id, note_id, text, author, datetime }` | `_handle_add_note` |
| `typing { chat_id, sender, is_typing }` | `user_typing { chat_id, sender, is_typing }` | `_handle_typing` |

---

## Backward Compatibility Notes

1. **Token type claims** — Old tokens (without `token_type`) will continue to work for normal authentication but will be rejected by `/api/auth/refresh`. Users must re-login once to get new-format tokens.
2. **Field aliases** — Where field names were aligned (#7, #20), both old and new names are returned simultaneously. No breaking changes.
3. **`sender_type`** — V2 continues to use `"Executive"`. Frontend normalizes as needed.
4. **Dashboard stats** — REST endpoint returns both `data: {}` wrapper and flat fields.

---

*Generated: 24 Feb 2026*
