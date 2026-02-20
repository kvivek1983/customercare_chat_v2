# Feature Audit — Smart Chat V2

**Date:** 2026-02-19
**Scope:** Verify actual implementation status of all planned V2 features.

---

## executive_service.py

| Function | Status | Notes |
|---|---|---|
| `set_executive_status` | ✅ Built | MongoDB + Redis queue management, auto-reassign on offline |
| `get_online_executives` | ✅ Built | Queries MongoDB by status + customer_type |
| `assign_chat_round_robin` | ✅ Built | LPOP/RPUSH rotation, updates both Mongo + Redis |
| `release_and_reassign_chats` | ✅ Built | Iterates assigned chats, unassigns, re-round-robins, broadcasts `chat_reassigned` |

---

## sla_service.py

| Feature | Status | Notes |
|---|---|---|
| `run_sla_check` — 3-min alert | ✅ Built | Queries `last_incoming_message < cutoff`, sends WhatsApp to `SLA_ALERT_GROUP_NUMBER` |
| `run_sla_check` — 10-min escalation | ✅ Built | Separate tier to `SLA_SHIFT_LEAD_NUMBER` |
| Redis dedup keys | ✅ Built | `sla::alerted::{chat_id}::{alert_type}` with TTL (300s / 700s) |

---

## tagging_service.py

| Function | Status | Notes |
|---|---|---|
| `apply_tag` | ✅ Built | `$addToSet`, manages awaiting counter, broadcasts `tag_updated` |
| `remove_tag` | ✅ Built | `$pull`, manages awaiting counter, broadcasts `tag_updated` |
| `run_awaiting_check` (background) | ✅ Built | Auto-tags chats where exec replied >90s ago and customer hasn't responded |

---

## resolution_service.py

| Feature | Status | Notes |
|---|---|---|
| Dedicated `resolution_service.py` file | ❌ Missing | No standalone module exists |
| Resolve chat logic | ⚠️ Partial | Handled inline in `events.py → _handle_update_chat_status` — sets `is_resolved`, decrements counters, clears tags, writes resolve log |
| Auto-send resolution message | ✅ Built | `send_resolution_message` in `whatsapp_service.py`, called from `events.py` on resolve |
| Rating storage | ✅ Built | REST endpoint `POST /{chat_id}/rate` in `chat_router.py`, stores to `v2_chat_ratings` collection |

---

## Chat fields on `v2_chats`

| Field | Status | Notes |
|---|---|---|
| `last_incoming_message` | ✅ Built | Set on customer message, queried by SLA service |
| `last_outgoing_message` | ✅ Built | Set on executive message, queried by awaiting tagger |
| `last_interaction_by` | ✅ Built | Set to `"Executive"` or `"Customer"` on each message |
| `is_resolved` | ✅ Built | Initialized as `false`, toggled via status update |
| `tags[]` | ✅ Built | Initialized as `[]`, managed by tagging_service |
| `assigned_executive_id` | ✅ Built | Set by round-robin, indexed in MongoDB |

---

## WebSocket events

| Event | Status | Notes |
|---|---|---|
| `sla_alert` | ✅ Built | Broadcast to `"dashboard"` room from `run_sla_check` |
| `chat_assigned` | ✅ Built | Broadcast from `_handle_new_chat` in `events.py` |
| `chat_reassigned` | ✅ Built | Broadcast from `release_and_reassign_chats` in `executive_service.py` |
| `executive_status` | ✅ Built | Broadcast from `_handle_set_executive_status` in `events.py` |
| `tag_updated` | ✅ Built | Broadcast from `apply_tag` and `remove_tag` in `tagging_service.py` |

---

## Background tasks in scheduler.py

| Task | Status | Notes |
|---|---|---|
| SLA monitor | ✅ Built | 60s loop, distributed lock, calls `run_sla_check` |
| Awaiting tagger | ✅ Built | 60s loop, distributed lock, calls `run_awaiting_check` |
| Inactivity monitor | ✅ Built | 60s loop, checks online execs, auto-offlines after 4 min |

---

## fetch_all_chats — assigned_executive_id filter

| Feature | Status | Notes |
|---|---|---|
| Filter by `assigned_executive_id` | ❌ Missing | `fetch_all_chats` accepts `status`, `customer_type`, `search`, `tag`, `sender` — no `assigned_executive_id` parameter. My Chats / All Chats split is not possible with current implementation. |

---

## Summary

| Category | ✅ Built | ⚠️ Partial | ❌ Missing |
|---|---|---|---|
| executive_service.py | 4 | 0 | 0 |
| sla_service.py | 3 | 0 | 0 |
| tagging_service.py | 3 | 0 | 0 |
| resolution_service.py | 2 | 1 | 1 |
| Chat fields | 6 | 0 | 0 |
| WebSocket events | 5 | 0 | 0 |
| Background tasks | 3 | 0 | 0 |
| fetch_all_chats filter | 0 | 0 | 1 |
| **Total** | **26** | **1** | **2** |

### Action items

1. **Create `resolution_service.py`** — Extract resolve logic from `events.py` into a dedicated service module for consistency with the rest of the service layer.
2. **Add `assigned_executive_id` filter to `fetch_all_chats`** — Accept an optional parameter and add it to the `$match` stage so the frontend can distinguish My Chats from All Chats.
